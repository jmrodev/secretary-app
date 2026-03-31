#!/bin/bash

# Script para monitorear el uso de recursos de Docker
# Uso: ./monitor-docker.sh [intervalo_en_segundos]

INTERVAL=${1:-5}

echo "🔍 Monitoreando uso de recursos de Docker (actualización cada ${INTERVAL}s)"
echo "Presiona Ctrl+C para detener"
echo ""

while true; do
    clear
    echo "═══════════════════════════════════════════════════════════════════"
    echo "📊 ESTADO DE CONTENEDORES - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.PIDs}}"
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "⚙️  LÍMITES CONFIGURADOS"
    echo "═══════════════════════════════════════════════════════════════════"
    echo "DB:     CPU: 1.0 cores | RAM: 512MB"
    echo "Server: CPU: 2.0 cores | RAM: 1GB"
    echo "Client: CPU: 2.0 cores | RAM: 1GB"
    echo ""
    echo "Presiona Ctrl+C para detener el monitoreo"
    
    sleep $INTERVAL
done
