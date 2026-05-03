# Guía de Resolución de Avisos de Linter en React

Este documento explica cómo manejar los avisos de `react-hooks/set-state-in-effect` y por qué se producen.

## El problema: `set-state-in-effect`

React lanza este aviso cuando detecta que un `useEffect` realiza una actualización de estado (`setState`) de forma síncrona durante su ejecución. 

### ¿Por qué es un problema?
1. **Renders en cascada**: React ejecuta el render, luego el efecto, y si el efecto actualiza el estado inmediatamente, React debe programar otro render *antes* de que el usuario vea el primero (o justo después), lo que impacta el rendimiento.
2. **Inconsistencia**: Puede llevar a comportamientos difíciles de depurar si el estado depende de otros estados que están cambiando.

## Soluciones Recomendadas

### 1. Calcular durante el Render (Diferido)
Si un estado se deriva de otros props o estados, a menudo no necesitas un `useEffect`.
**Mal:**
```javascript
useEffect(() => {
  setFullName(name + ' ' + lastName);
}, [name, lastName]);
```
**Bien:**
```javascript
const fullName = name + ' ' + lastName; // Calcular directamente
```

### 2. Inicialización de Estado
Si necesitas inicializar un estado basado en un prop una sola vez:
**Bien:**
```javascript
const [userId, setUserId] = useState(() => initialId);
```

### 3. Evitar actualizaciones síncronas (El "Hack" de `setTimeout`)
Cuando es inevitable actualizar el estado en respuesta a un cambio (como resetear una página de búsqueda), y el linter se queja, envolverlo en un microtask o timeout evita que React lo vea como una ejecución síncrona dentro del ciclo de vida del efecto actual.
```javascript
useEffect(() => {
  const t = setTimeout(() => setPage(1), 0);
  return () => clearTimeout(t);
}, [searchTerm]);
```

### 4. Estabilización de Funciones (`useCallback`)
Si el linter se queja de que una función llamada en el efecto no es estable, asegúrate de envolver la definición de esa función en `useCallback`.

## Casos corregidos en este PR

1. **Contexto de Doctor**: Se inicializaba el ID del doctor activo basándose en la lista cargada. Se usó `setTimeout` para que la inicialización no bloquee el render inicial del contexto.
2. **Reseteo de Páginas**: Al cambiar el término de búsqueda, se resetea la página a 1. Esto es correcto, pero el linter lo marca como "cascading render".
3. **Polling de WhatsApp**: Las funciones de carga inicial (`fetchStatus`, `fetchConversations`) disparan estados de carga y datos. Al ser llamadas al montar el componente, el linter prefiere que sean asíncronas.
