---
name: Secretary App Client
description: Solución integral de gestión clínica y administrativa con estética Executive Clinical
colors:
  primary: "#0d9488"
  primary-hover: "#0f766e"
  secondary: "#1e293b"
  accent: "#0284c7"
  accent-hover: "#0369a1"
  background-bg: "#0b0f19"
  card-bg: "#151d2a"
  modal-bg: "#111827"
  text-main: "#f8fafc"
  text-secondary: "#cbd5e1"
  text-muted: "#94a3b8"
  danger: "#ef4444"
  danger-dark: "#dc2626"
  danger-deep: "#b91c1c"
  success: "#10b981"
  success-bright: "#22c55e"
  warning: "#f59e0b"
  info: "#0ea5e9"
  brand-blue: "#2563eb"
  brand-indigo: "#6366f1"
  whatsapp: "#075e54"
  whatsapp-bright: "#25d366"
  pure-white: "#ffffff"
  pure-black: "#000000"
  slate-50: "#f8fafc"
  slate-100: "#f1f5f9"
  slate-200: "#e2e8f0"
  slate-300: "#cbd5e1"
  slate-400: "#94a3b8"
  slate-500: "#64748b"
  slate-600: "#475569"
  slate-700: "#334155"
  slate-800: "#1e293b"
  slate-900: "#0f172a"
  gray-neutral: "#e9ecef"
typography:
  display:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  subtitle:
    fontFamily: "'Nunito Sans', sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Nunito Sans', 'Inter', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  body-sm:
    fontFamily: "'Nunito Sans', sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "'Nunito Sans', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
  micro:
    fontFamily: "'Nunito Sans', sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
  editorial:
    fontFamily: "'Newsreader', 'Georgia', serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0em"
  icons:
    fontFamily: "'Material Symbols Outlined'"
  mono:
    fontFamily: "Monaco, Consolas, 'Courier New', monospace"
  print:
    fontFamily: "Arial, sans-serif"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
  pill: "100px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

## Overview

Secretary App utiliza un lenguaje visual denominado **Executive Clinical**: una interfaz de alta densidad funcional y pulido estético sobrio, diseñada para secretarias, médicos y administradores de salud. Prioriza la legibilidad rápida bajo presión operativa (turnos, urgencias, cobros) mediante contrastes nítidos, jerarquía tipográfica precisa y bordes sutiles sin saturar con ornamentación innecesaria. El modo predeterminado es Dark Mode, con soporte estructurado para Light y Dim.

## Colors

El sistema cromático se basa en una paleta semántica estricta definida en [variables.css](file:///home/jmro/Documents/Development/secretary-app/client/src/styles/variables.css):

- **Primary & Accent**: `--primary-color` (`#0d9488` Teal 600) para acciones principales y estados activos; `--accent-color` (`#0284c7` Sky 600) para enlaces y focos secundarios.
- **Superficies & Fondos**:
  - `--background-bg`: `#0b0f19` (fondo base oscuro profundo).
  - `--dashboard-card-bg`: `#151d2a` (tarjetas y paneles).
  - `--card-surface-bg`: `#0f172a` (subsuperficies y listas internas).
  - `--modal-bg`: `#111827` (diálogos y modales).
- **Semánticos de Estado Clínico y Financiero**:
  - Éxito / Pagado / Completado: `--success` (`#10b981`).
  - Alerta / Pendiente: `--warning` (`#f59e0b`).
  - Error / Deuda / Cancelado / Ausente: `--danger` (`#ef4444`).
  - Info: `--info` (`#0ea5e9`).
- **Tipografía y Contraste**: `--text-main` (`#f8fafc`), `--text-secondary` (`#cbd5e1`), `--text-muted` (`#94a3b8`).

## Typography

Tres familias tipográficas con roles específicos:
- **Nunito Sans** (`--font-main`, `--font-nunito`): Fuente de cuerpo principal y datos de alta densidad. Muy legible en tablas, formularios y fichas.
- **Manrope** (`--font-manrope`): Encabezados, títulos de sección, métricas clave (KPIs) y branding.
- **Newsreader** (`--font-newsreader`): Usada puntualmente para notas médicas, citas y detalles clínicos con tono editorial formal.

Escala de tamaños:
- `xs`: 0.75rem (badges, timestamps, subtítulos de tabla).
- `sm`: 0.85rem (etiquetas de formulario, metadata).
- `base`: 1rem (texto general, inputs, celdas principales).
- `lg`: 1.125rem (subtítulos, balance cards).

## Layout

- **Atomic Design & Bento Box UI**: Los dashboards y pantallas de operaciones utilizan layouts modulares inspirados en Bento Grid, distribuyendo métricas y acciones con `gap` uniforme (`--spacing-md` a `--spacing-lg`).
- **Espaciado en cuadrícula de 4px**: `--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (16px), `--spacing-lg` (24px), `--spacing-xl` (32px).
- **Estructura**: Sidebar vertical persistente (`--sidebar-bg: #273142`), navbar superior con métricas contextuales y panel principal de scroll independiente.

## Elevation & Depth

- **Elevaciones sutiles y difusas**:
  - `--shadow-sm`: `0 4px 12px rgba(25, 28, 30, 0.04)`
  - `--shadow-md`: `0 8px 24px rgba(25, 28, 30, 0.06)`
  - `--shadow-lg`: `0 12px 32px rgba(25, 28, 30, 0.08)`
  - `--shadow-premium`: `0 24px 48px -12px rgba(0, 61, 155, 0.15)`
- **Glassmorphism contenido**: Utilizado en modales y overlays mediante `--glass`, `--glass-dark` y `--glass-border` con bordes sutiles de `rgba(255, 255, 255, 0.07)`.

## Shapes

- Esquinas cuadradas y sobrias de radio reducido para mantener un aspecto clínico ejecutivo:
  - `--radius-sm`: `4px` (badges, chips, tags).
  - `--radius-md` / `--radius`: `6px` (botones, inputs, selects).
  - `--radius-lg`: `8px` (cards principales, contenedores modales).

## Components

- **Botones**: Altura consistente, feedback de hover explícito (`--primary-hover`, `--accent-hover`), padding uniforme (`8px 16px` o `4px 8px` compactos).
- **Tarjetas Bento / Dashboard**: Bordes finos de 1px (`--dashboard-card-border`), cabecera con icono semántico y título Manrope, cuerpo con Nunito Sans.
- **Tablas y Listas de Turnos**: Filas con estados interactivos usando `--row-hover-bg` (`rgba(255, 255, 255, 0.04)`) y `--row-hover-bg-selected`. Badges de estado con fondo translúcido y texto en color semántico puro.
- **Inputs & Formularios**: Borde neutral (`--border-color`), fondo oscuro integrado (`--card-surface-bg`), foco con anillo de acento `--accent-color`.

## Do's and Don'ts

### Do's
- **Usar siempre variables CSS**: Utilizar tokens de `variables.css` para colores, fuentes, radios y márgenes.
- **CSS Modules + BEM**: Crear archivos `*.module.css` y respetar la nomenclatura `bloque__elemento--modificador`.
- **Internacionalización**: Envolver todo texto visible en `t('key')`.
- **Mantener densidad y sobriedad**: Respetar radios pequeños (4px a 8px) y paleta sobria clínica.

### Don'ts
- **No estilos en línea (`style={{...}}`)**: Excepto para posiciones estrictamente dinámicas de JS.
- **No hardcodear colores HEX/RGB**: Nunca escribir colores directos en CSS si existe el token semántico.
- **No bordes exageradamente redondeados**: Evitar `border-radius: 9999px` o formas tipo burbuja en tarjetas/paneles de trabajo médico.
- **No texto plano en el JSX**: Evitar strings quemados en componentes.
