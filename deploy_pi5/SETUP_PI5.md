# Configuración de Secretary App en Raspberry Pi 5 con Duck DNS

Este repositorio contiene los archivos necesarios para desplegar la aplicación en una Raspberry Pi 5, permitiendo el acceso seguro (HTTPS) desde una aplicación móvil nativa.

## 1. Configurar Duck DNS
El script `duckdns/duck.sh` se encarga de mantener actualizada tu IP pública.

1. Edita el archivo `duckdns/duck.sh` y reemplaza `TU_DOMINIO` y `TU_TOKEN`.
2. Dale permisos de ejecución: `chmod +x duckdns/duck.sh`.
3. Agrégalo al crontab:
   ```bash
   crontab -e
   ```
   Añade esta línea al final:
   ```bash
   */5 * * * * /home/pi/duckdns/duck.sh >/dev/null 2>&1
   ```

## 2. Levantar los Contenedores
1. Desde esta carpeta, ejecuta:
   ```bash
   docker compose up -d
   ```
2. Esto levantará:
   - La base de datos (MariaDB).
   - El servidor backend.
   - El cliente web.
   - **Nginx Proxy Manager** (Puerto 81 para administración).

## 3. Configurar SSL y Proxy (HTTPS)
Para que la app móvil nativa funcione, **necesitas HTTPS**.

1. Entra al panel de Nginx Proxy Manager: `http://[IP-DE-TU-PI]:81`.
   - Usuario: `admin@example.com`
   - Clave: `changeme`
2. Crea un **Proxy Host**:
   - **Domain Name**: `tu-dominio.duckdns.org`.
   - **Scheme**: `http`.
   - **Forward Hostname / IP**: `client` (para el frontend) o `server` (puerto 5000 para la API).
   - **Forward Port**: `80` (client) o `5000` (server).
3. En la pestaña **SSL**:
   - Selecciona "Request a new SSL Certificate".
   - Acepta los términos de Let's Encrypt.
4. Una vez guardado, tu API estará disponible en `https://tu-dominio.duckdns.org/api`.

## 4. Port Forwarding en el Router
En la configuración de tu router:
- Redirige el puerto **80** (TCP) a la IP de tu Raspberry Pi puerto 80.
- Redirige el puerto **443** (TCP) a la IP de tu Raspberry Pi puerto 443.

## 5. App Móvil Nativa
En el código de tu app Android/iOS, el endpoint será:
`https://tu-dominio.duckdns.org/api`
