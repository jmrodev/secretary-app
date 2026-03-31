# Correcciones para Alto Consumo de CPU en Docker

## 🔴 Problemas Identificados

### 1. **Loop Infinito en `usePatientSearch`**
- **Archivo**: `client/src/hooks/usePatientSearch.js`
- **Problema**: `fetchAppointments` se recreaba en cada render, causando que el `useEffect` en `useAppointmentsPageController` se ejecutara infinitamente.
- **Solución**: Envolver `fetchAppointments` en `useCallback` con dependencias correctas.

### 2. **Loop Infinito en `useAppointmentsPageController`**
- **Archivo**: `client/src/controllers/useAppointmentsPageController.js`
- **Problema**: Dos `useEffect` se actualizaban mutuamente:
  - Uno actualizaba `selectedDoctor` cuando cambiaba `viewDoctorId`
  - Otro actualizaba `viewDoctorId` cuando cambiaba `selectedDoctor`
  - Esto creaba un ciclo infinito de actualizaciones
- **Solución**: Consolidar ambos `useEffect` en uno solo con lógica condicional.

### 3. **Loop Infinito en `useFloatingChatController`**
- **Archivo**: `client/src/controllers/useFloatingChatController.js`
- **Problema**: `loadConversations` dependía de `conversations`, que cambiaba cuando se ejecutaba `loadConversations`.
- **Solución**: Remover las funciones de las dependencias del `useEffect` y usar `eslint-disable`.

### 4. **Sin Límites de Recursos en Docker**
- **Archivo**: `docker-compose.yml`
- **Problema**: Los contenedores podían consumir todos los recursos del sistema sin restricciones.
- **Solución**: Agregar límites de CPU y memoria para cada servicio.

## ✅ Correcciones Implementadas

### 1. `usePatientSearch.js`
```javascript
// ANTES
const fetchAppointments = async () => {
    // ...
};

// DESPUÉS
const fetchAppointments = useCallback(async () => {
    // ...
}, [searchTerm]);
```

### 2. `useAppointmentsPageController.js`
```javascript
// ANTES - Dos useEffect separados que se actualizaban mutuamente
useEffect(() => {
    localStorage.setItem('last_selected_doctor_id', viewDoctorId);
    if (!selectedDoctor && viewDoctorId) setSelectedDoctor(viewDoctorId);
}, [viewDoctorId, selectedDoctor]);

useEffect(() => {
    localStorage.setItem('last_selected_doctor_id', selectedDoctor);
    if (!viewDoctorId) setViewDoctorId(selectedDoctor);
}, [selectedDoctor, viewDoctorId]);

// DESPUÉS - Un solo useEffect consolidado
useEffect(() => {
    const doctorId = viewDoctorId || selectedDoctor;
    if (doctorId) {
        localStorage.setItem('last_selected_doctor_id', doctorId);
    }
    
    if (viewDoctorId && !selectedDoctor) {
        setSelectedDoctor(viewDoctorId);
    }
    
    if (selectedDoctor && !viewDoctorId) {
        setViewDoctorId(selectedDoctor);
    }
}, [viewDoctorId, selectedDoctor]);
```

También se envolvió `fetchAllData` en `useCallback`:
```javascript
const fetchAllData = useCallback(async () => {
    await fetchAppointments();
    // ...
}, [fetchAppointments]);
```

### 3. `useFloatingChatController.js`
```javascript
// ANTES
}, [user, loadConversations, loadUnreadCount, loadRecipients]);

// DESPUÉS
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);
```

### 4. `docker-compose.yml`
```yaml
# Agregado a cada servicio:
deploy:
  resources:
    limits:
      cpus: '2.0'      # Máximo 2 cores
      memory: 1G       # Máximo 1GB RAM
    reservations:
      cpus: '0.5'      # Mínimo garantizado
      memory: 512M     # Mínimo garantizado
```

**Límites por servicio:**
- **DB**: 1 core CPU, 512MB RAM
- **Server**: 2 cores CPU, 1GB RAM
- **Client**: 2 cores CPU, 1GB RAM

## 📊 Monitoreo

Se creó un script de monitoreo: `monitor-docker.sh`

**Uso:**
```bash
# Monitoreo cada 5 segundos (default)
./monitor-docker.sh
# Monitoreo cada 2 segundos
./monitor-docker.sh 2
```

## 🔍 Verificación

Para verificar que los límites se aplicaron correctamente:

```bash
# Ver uso actual
docker stats --no-stream

# Ver límites configurados
docker inspect secretary-app-server-1 --format='{{.HostConfig.NanoCpus}} {{.HostConfig.Memory}}'
```

## 🚀 Reinicio de Docker

Para aplicar los cambios:
```bash
docker compose down
docker compose up -d
```

## 📝 Notas Importantes

1. **Los límites de CPU** se expresan en nanosegundos en Docker inspect:
   - `2000000000` = 2.0 cores
   - `1000000000` = 1.0 core

2. **Los límites de memoria** se expresan en bytes:
   - `1073741824` = 1GB
   - `536870912` = 512MB

3. **Si el consumo sigue alto**, verifica los logs:
   ```bash
   docker logs secretary-app-server-1 --tail 100
   docker logs secretary-app-client-1 --tail 100
   ```

4. **Señales de loop infinito** en los logs:
   - Múltiples requests repetitivos de `getAppointments`
   - Múltiples requests de `getPatientDetails` para el mismo ID
   - Mensajes de error de conexión a la base de datos

## 🛠️ Troubleshooting

Si el problema persiste:

1. **Verificar que no hay otros loops**:
   ```bash
   # Buscar useEffect sin dependencias correctas
   grep -r "useEffect" client/src --include="*.js" --include="*.jsx"
   ```

2. **Revisar React DevTools** en el navegador para ver qué componentes se re-renderizan constantemente.

3. **Agregar logs temporales** para identificar qué causa los re-renders:
   ```javascript
   useEffect(() => {
       console.log('Component rendered:', componentName);
   });
   ```

## ✨ Resultado Esperado

Después de estas correcciones:
- ✅ CPU usage debería estar < 10% en reposo
- ✅ No más loops infinitos de requests
- ✅ Docker no consumirá más del 100% de CPU total
- ✅ Límites de recursos protegen el sistema
