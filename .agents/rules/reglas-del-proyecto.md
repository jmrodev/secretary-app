---
trigger: always_on
---

# Reglas de Oro del Proyecto (Obligatorias)

Eres un asistente experto en el desarrollo de **Secretary App**. Debes seguir estas reglas estrictamente en cada respuesta y acción.

## 1. Arquitectura y Estándares
- **Referencia Principal**: Lee siempre `docs/ARQUITECTURA.md` antes de cambios estructurales.
- **Atomic Design**: Clasifica componentes en `atoms`, `molecules`, `organisms`, `templates` y `pages`.
- **BEM CSS Estricto**: Usa `block__element--modifier`. Prohibido camelCase o PascalCase en clases CSS.
- **Un Componente = Un CSS**: Cada archivo `.jsx` debe tener su `.css` homónimo al lado.
- **Prohibiciones de Estilo**: 
    - 🚫 Prohibido **TailwindCSS** (a menos que el usuario lo pida específicamente por versión).
    - 🚫 Prohibido **CSS Inline** (atributo `style={{...}}`).
    - 🚫 Prohibido usar `!important`.
- **Uso Obligatorio de Átomos**: Nunca uses `<button>` ni emojis para iconos. Usa siempre los átomos `<Button />` e `<Icon />`.

## 2. Desarrollo React
- **Path Aliases**: Usa siempre `@/` para rutas desde `src/`. Prohibido `../../../../`.
- **Lazy Loading**: Todas las páginas deben cargarse con `React.lazy()` y `Suspense`.
- **Lógica en Controllers**: La lógica de UI compleja debe ir en hooks controladores (ej: `usePatientsController`).
- **Data Fetching**: Usa siempre el hook personalizado `@/hooks/useFetch` para peticiones a la API.
- **Internacionalización**: No uses texto crudo. Usa `t('key')` del sistema de i18n.

## 3. Backend y Seguridad
- **Protección SQL**: Nunca concatenes variables en consultas SQL. Usa placeholders (`?`) o `sqlUtils`.
- **Modelos/Servicios**: Separa la orquestación (Controllers) de la lógica de negocio (Services) y el acceso a datos (Repositories).
- **i18n en Backend**: Los errores deben devolver claves (ej: `{ error: 'user_not_found' }`), no mensajes en español/inglés.

## 4. Gestión de Git y Flujo
- **Rama de Trabajo**: Todo el desarrollo se hace en `development`. `main` es solo para producción estable.
- **Limpieza**: Borra las ramas locales y remotas después de que se integren en `development`.
- **Mensajes de Commit**: Usa Commits Semánticos (ej: `feat: ...`, `fix: ...`, `chore: ...`).

## 5. Restricciones de Herramientas
- 🚫 **PROHIBICIÓN BROWSER TOOL**: Tienes terminantemente prohibido usar `browser_subagent` o `read_url` para depurar `localhost`. Valida la UI mediante logs de consola o solicitando feedback/capturas al usuario.

## 6. Estética y Diseño (Premium)
- **Visual WOW**: Los diseños deben sentirse premium (sombras suaves, bordes redondeados, paletas armoniosas).
- **Contraste**: Sigue la regla "Anti-Camuflaje" de Bento Box (evita gris sobre gris; prefiere blanco/bordes definidos para tarjetas).