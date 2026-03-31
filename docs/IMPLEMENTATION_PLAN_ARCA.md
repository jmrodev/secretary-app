# Plan de Implementación: Facturación ARCA (AFIP) y Recetas Electrónicas

Este plan detalla los pasos para integrar la facturación electrónica de ARCA y la generación de recetas digitales profesionales en la aplicación.

## 1. Integración ARCA (Facturación Electrónica)

### Backend
- [ ] Instalar dependencia `afip.js` para manejo de Web Services de AFIP.
- [ ] Crear `server/controllers/billingController.js` para gestionar:
    - Autenticación con AFIP (WSAA).
    - Creación de Facturas (WSFE).
    - Consulta de estado de servidores.
- [ ] Crear `server/routes/billingRoutes.js`.
- [ ] Modificar base de datos:
    - Tabla `invoices` para guardar número de comprobante, CAE, vencimiento, y relación con transacción/turno.
    - Tabla `system_settings` para guardar CUIT, Punto de Venta, y certificados (base64 o rutas).

### Frontend
- [ ] Agregar sección de "Facturación" en `SystemConfig.jsx`.
- [ ] Crear botón "Generar Factura" en `Finances.jsx` y `Appointments.jsx`.
- [ ] Crear visor de Factura (modal o nueva pestaña con PDF).

## 2. Receta Electrónica Profesional

### Backend
- [ ] Crear servicio para generación de PDF (usando `pdfkit` o similar).
- [ ] Implementar firma digitalizada (imagen de sello y firma del médico).
- [ ] Generar QR de validación interna que apunte a la URL de validación del sistema.

### Frontend
- [ ] Mejorar el modal de prescripción para previsualizar la receta.
- [ ] Agregar opción "Descargar PDF" / "Enviar por WhatsApp PDF".

---

## Próximos Pasos (Inmediato)
1. Instalar `afip.js` en el servidor.
2. Crear estructura básica de base de datos para facturación.
