# Proposal: Mobile Add Medication with Vademecum Search & Dosage Calculator

## Context & Motivation
El médico requiere la capacidad de prescribir y registrar medicamentos directamente desde la ficha del paciente en la aplicación celular (`mobile/`). La prescripción debe ser precisa, permitiendo:
1. Buscar medicamentos por nombre o monodroga usando la base de datos de Vademécum existente (`GET /api/medical/vademecum/search`).
2. Definir la dosis y frecuencia (ej. 1 comprimido cada 12 hs).
3. Calcular en tiempo real las unidades requeridas según los días de tratamiento.

## Proposed Solution
- **Buscador en Vademécum**: Input con debounce/búsqueda dinámica llamando a `/vademecum/search?q=...`.
- **Calculadora de Dosis**: Cálculo reactivo `(tomas_diarias * dias_tratamiento)` para mostrar las unidades totales requeridas.
- **Guardado**: Envío a `POST /api/medical/patients/medications` y refresco automático de la pestaña *Medicación*.
