#!/bin/bash
# Script de actualización para Duck DNS
# Reemplaza TU_DOMINIO y TU_TOKEN con tus datos de duckdns.org

DOMINIO="TU_DOMINIO"
TOKEN="TU_TOKEN"

echo url="https://www.duckdns.org/update?domains=${DOMINIO}&token=${TOKEN}&ip=" | curl -k -o /home/pi/duckdns/duck.log -K -
