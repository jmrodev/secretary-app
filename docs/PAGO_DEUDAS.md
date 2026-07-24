# Algoritmo de Pago de Deudas (FIFO) - Arquitectura 💳📉

Este documento detalla el funcionamiento del algoritmo contable de asignación de pagos y cancelación de deudas en **Secretary App**.

---

## 1. Estrategia FIFO (First-In, First-Out)
Cuando un paciente realiza un pago general para reducir o saldar su deuda, el sistema no imputa el pago de forma aleatoria. Utiliza una estrategia **FIFO** (lo primero que entra es lo primero que sale) a través del procedimiento almacenado `proc_pay_patient_debt`:

1.  **Búsqueda de Deudas**: Abre un cursor que selecciona todas las transacciones pendientes del paciente (`status = 'pending'`), ordenadas por fecha de transacción de la más antigua a la más reciente:
    ```sql
    SELECT t.id, t.amount, t.description, t.appointment_id, t.request_id
    FROM transactions t
    WHERE t.related_user_id = v_user_id AND t.status = 'pending'
    ORDER BY t.transaction_date ASC, t.id ASC;
    ```
2.  **Imputación Secuencial**:
    *   **Pago Completo**: Si el monto entregado por el paciente cubre o supera la deuda más antigua, esa deuda se marca como paga (`status = 'paid'`) y el remanente continúa aplicándose a la siguiente deuda en la lista.
    *   **Pago Parcial (División de Transacción)**: Si el dinero remanente no cubre la totalidad de la deuda actual:
        *   Se actualiza la transacción original asignándole el monto remanente y cambiándola a estado `paid` con el sufijo `PARTIAL PAID`.
        *   Se inserta un nuevo registro de transacción en estado `pending` con método `on_account` para registrar el saldo pendiente restante (`monto_original - pago_parcial`).
    *   **Saldo a Favor (Pago por Adelantado)**: Si el paciente entrega más dinero del total de su deuda acumulada, la base de datos registra una nueva transacción marcada como `paid` bajo la descripción `Advance Payment / Credit Balance`. Este saldo queda a favor del paciente para futuros turnos.

---

## 2. Flujo de Control (Backend Node)
El controlador financiero delega en `FinanceService.payDebt(data, userId)`:
*   Valida los importes.
*   Genera una clave de idempotencia (`pay_pat_[patientId]_[timestamp]`) para evitar procesar dos veces el mismo pago ante fallos de red.
*   Ejecuta la llamada atómica a la base de datos:
    ```javascript
    await pool.query("CALL proc_pay_patient_debt(?, ?, ?, ?, ?, ?)", [
        data.patientId, payAmount, data.method, data.doctor_id || null, 'PAGO_DEUDA', idempotencyKey
    ]);
    ```
