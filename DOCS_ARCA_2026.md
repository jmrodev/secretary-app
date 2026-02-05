# Documentación Técnica: Integración Facturación Electrónica ARCA (v4.0 - 2026)

Este documento detalla la implementación técnica realizada para la adecuación del sistema a la normativa de la **Agencia de Recaudación y Control Aduanero (ARCA)**, bajo los lineamientos de la **Resolución General 5616/2024** y la **Ley de Inocencia Fiscal 27.743**.

## 🚀 Resumen del Hito
Se ha logrado la transición exitosa del protocolo AFIP hacia el nuevo estándar **ARCA 2026**, permitiendo la obtención de CAE (Código de Autorización Electrónico) para profesionales de la salud (Monotributistas/Responsables Inscriptos) con cumplimiento estricto de validación.

---

## 🛠️ Cambios Técnicos Implementados

### 1. Adecuación de Mensajería SOAP (WSFEv1 v4.0)
ARCA introdujo campos obligatorios que, de no estar presentes o estar mal posicionados, resultan en el rechazo sistemático del comprobante (Error 10242).

*   **Campo `CondicionIVAReceptorId`**: Implementado con valor `5` (Consumidor Final) como valor por defecto para transacciones de consultorio.
*   **Campo `CanMisMonExt`**: Configurado en `'N'` para asegurar la validación contra el tipo de cambio oficial del BNA en moneda local.
*   **Secuencia Estricta**: Se reestructuró el XML Detalle para que los campos nuevos se ubiquen al final del bloque `FECAEDetRequest`, respetando el parser secuencial de ARCA.

### 2. Generación de Código QR (Normativa 2026)
Se actualizó el motor de generación de QR para cumplir con la fiscalización en tiempo real.

*   **Nuevo Dominio**: Migración de `afip.gob.ar` a `https://www.arca.gob.ar/fe/qr/`.
*   **Payload JSON v1**: 
    *   Sincronización de fecha en zona horaria `America/Argentina/Buenos_Aires` (evitando desfases UTC).
    *   Forzado de tipos numéricos para `cuit`, `cae` e `importe`.
    *   Inclusión técnica de `condicionIVAReceptorId` dentro del QR.

### 3. Diseño de Comprobante Profesional
Adecuación estética y legal del PDF/Impresión:
*   **Emisor Prioritario**: El nombre del profesional de la salud (médico) actúa como encabezado principal (H1), cumpliendo con la normativa de servicios profesionales.
*   **Identidad de Marca**: Se mantiene "CIMA SALUD" como referencia del establecimiento asistencial.

---

## ⚖️ Cumplimiento Legal (RG 5616 / Ley 27.743)

*   **Hard Enforcement**: El sistema ya opera bajo la modalidad de "Rechazo por Omisión" activa desde el 01/02/2026.
*   **Inocencia Fiscal**: Al automatizar la validación de campos obligatorios, el sistema protege al profesional de multas automáticas (que en 2026 inician en $220.000) por errores formales en la facturación.
*   **Transparencia**: Cumplimiento de la discriminación de carga tributaria para consumidores finales.

---

## 📋 Guía de Pase a Producción

Para activar el entorno real de ARCA, siga estos pasos:

1.  **Habilitación en ARCA**:
    *   Ingresar con Clave Fiscal a "Administración de Puntos de Venta y Domicilios".
    *   Crear un nuevo Punto de Venta (ej. 2) tipo **"Web Services"**.
2.  **Certificados**:
    *   Generar el CSR desde el panel de control de la App.
    *   Obtener el certificado `.crt` en el portal de ARCA.
    *   Subir el certificado al perfil del médico en la aplicación.
3.  **Configuración de Sistema**:
    *   Cambiar la variable `afip_environment` de `testing` a `production`.
    *   Actualizar el Punto de Venta en la configuración del Doctor.

---

**Desarrollado con precisión técnica para garantizar la continuidad operativa en el nuevo marco fiscal argentino.**
