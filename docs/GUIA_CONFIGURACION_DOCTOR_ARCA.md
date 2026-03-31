# Guía de Configuración: Adecuación de Doctor para ARCA (2026)

Esta guía detalla los pasos necesarios para habilitar a un nuevo profesional en el sistema de facturación electrónica bajo la normativa de la **Agencia de Recaudación y Control Aduanero (ARCA)**.

---

## Paso 1: Configuración en el Portal de ARCA
El profesional debe realizar estas acciones en [arca.gob.ar](https://www.arca.gob.ar) con su propia Clave Fiscal.

### 1.1 Habilitar Punto de Venta
1.  Ingresar al servicio **"Administración de Puntos de Venta y Domicilios"**.
2.  Seleccionar el nombre del profesional.
3.  Ir a **"A/B/M de Puntos de Venta"**.
4.  Presionar **"Agregar"**.
5.  Configurar:
    *   **Número**: Ej. `2` (no debe usarse uno ya activo para Factura en Línea o Controlador Fiscal).
    *   **Nombre Fantasía**: Consultorio / CIMA Salud.
    *   **Sistema**: Seleccionar estrictamente **"RECE para Aplicativo e Importación (Web Services)"**.
    *   **Domicilio**: El del consultorio habilitado.

### 1.2 Delegación de Servicio (Solo si factura un tercero)
Si la aplicación utilizará un certificado central, se debe delegar el servicio de Facturación Electrónica en el administrador de relaciones. *Para este sistema, se recomienda que cada doctor use su propio certificado.*

---

## Paso 2: Generación de Credenciales en la App
Una vez habilitado el punto de venta, debemos vincularlo a la aplicación.

1.  **Ingresar a la App**: Ir a la sección de **Médicos**.
2.  **Editar Perfil**: Seleccionar al médico y completar:
    *   **CUIT**: Los 11 dígitos sin guiones.
    *   **Punto de Venta**: El número que se creó en el paso 1.1 (ej. `2`).
3.  **Generar CSR (Solicitud de Certificado)**:
    *   En la pestaña de **Facturación**, hay un botón para **"Generar Pedido de Certificado (CSR)"**.
    *   El sistema descargará o te mostrará un texto que comienza con `-----BEGIN CERTIFICATE REQUEST-----`. **Copia este texto.**

---

## Paso 3: Obtención del Certificado CRT
1.  En el portal de ARCA, ir al servicio **"Administración de Certificados Digitales"**.
2.  Subir el archivo o pegar el texto (CSR) generado en el Paso 2.
3.  ARCA procesará la solicitud y te permitirá **Descargar el Certificado (.crt)**.

---

## Paso 4: Activación Final en la App
1.  **Subir Certificado**: En el perfil del médico (Pestaña Facturación), utiliza el botón **"Subir Certificado (.crt)"**.
2.  **Verificar Estado**: La App mostrará un indicador de conexión con ARCA.
    *   Si dice `Ambiente: Homologacion`, los tickets no tienen validez fiscal.
    *   Si dice `Ambiente: Production`, ya puedes emitir facturas legales.
3.  **Habilitar Facturación**: Asegúrate de que el interruptor **"Habilitar AFIP/ARCA"** esté encendido.

---

## 💡 Notas Importantes (Checklist 2026)
*   **Concepto 2**: El sistema está pre-configurado para "Servicios", lo que requiere fechas de prestación. Esto ya se maneja automáticamente según la fecha del turno.
*   **Condición IVA**: Las facturas se emiten por defecto como **Consumidor Final (ID 5)**.
*   **ARCA Portal**: Si el médico es Monotributista, el sistema detecta automáticamente la **Factura C**. Si es Responsable Inscripto, debe configurarse para **Factura A/B**.

---
*Guía técnica actualizada para el cumplimiento de la RG 5616/2024.*
