-- Agregar configuración para límite de turnos fuera de horario
-- Este valor define cuántos turnos extras puede tener un doctor por día

INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES (
    'daily_out_of_hours_limit', 
    '3', 
    'Número máximo de turnos fuera de horario permitidos por día'
)
ON DUPLICATE KEY UPDATE 
    setting_value = '3',
    description = 'Número máximo de turnos fuera de horario permitidos por día';
