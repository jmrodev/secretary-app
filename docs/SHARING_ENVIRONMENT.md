# 📂 Compartir Entorno y Datos (Seguro)

Esta guía explica cómo mover la configuración (`.env`) y los datos (Base de Datos) de forma segura entre diferentes máquinas (ej: de la Raspberry Pi a tu PC local).

## 🚀 Resumen del Proceso

El sistema utiliza **GPG (GNU Privacy Guard)** para crear un "bundle" (paquete) cifrado que contiene todo lo necesario para que la app funcione en otra máquina sin exponer contraseñas por canales inseguros.

### 1. En la Máquina de Origen (Donde están los datos)

Ejecuta el script de empaquetado:
```bash
bash scripts/share_assets.sh
```
*   **¿Qué hace?**: Crea un backup fresco de la BD, toma el archivo `.env` y los cifra juntos.
*   **Contraseña**: Se te pedirá una frase de paso. **No la olvides**, la necesitarás para el siguiente paso.
*   **Resultado**: Un archivo llamado `secretary-assets-YYYYMMDD.tar.gz.gpg`.

### 2. Transferencia

Mueve el archivo `.gpg` generado a la máquina de destino usando:
*   Cualquier gestor de archivos (Anydesk, FileZilla).
*   Comando `scp`.
*   Incluso servicios de mensajería (es seguro porque está cifrado).

### 3. En la Máquina de Destino (Donde quieres los datos)

Ejecuta el script de importación pasando la ruta del archivo:
```bash
bash scripts/import_assets.sh ruta/al/archivo.tar.gz.gpg
```
*   **¿Qué hace?**: Descifra el paquete, restaura el `.env` y carga el volcado en la base de datos de Docker automáticamente.
*   **Contraseña**: Ingresa la misma frase de paso que usaste al crear el archivo.

---

## 🛠️ Requisitos Previos

Asegúrate de tener `gpg` instalado en ambas máquinas:
*   **Ubuntu/Debian/Raspberry Pi**: `sudo apt install gnupg`
*   **MacOS**: `brew install gnupg`
*   **Windows**: Instalar [Gpg4win](https://gpg4win.org/download.html).

## 🔒 Consejos de Seguridad

1.  **Contraseña Fuerte**: Usa una frase larga y difícil de adivinar.
2.  **No compartas la contraseña por el mismo canal**: Si envías el archivo por WhatsApp, dile la contraseña por llamada o por otro medio.
3.  **GitHub**: Si subes este archivo a GitHub, asegúrate de que el nombre del archivo `.gpg` esté en tu `.gitignore` si no quieres que quede rastro en el historial (o súbelo a la sección de **Releases**).

---

*Última actualización: 3 de Abril, 2026*
