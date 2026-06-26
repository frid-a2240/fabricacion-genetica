-- Migración: insertar Cuarentena (5), renumerar Lab/Aceptado, agregar Envío (8)
-- Ejecutar en Supabase SQL Editor antes de usar el nuevo flujo.
-- Al abrir cada lote en Producción, la app crea automáticamente las filas faltantes en fechas_proceso.

UPDATE etapas_proceso SET orden = orden + 10;

INSERT INTO etapas_proceso (nombre, orden) VALUES ('Cuarentena', 5);

UPDATE etapas_proceso SET orden = 6 WHERE orden = 15;
UPDATE etapas_proceso SET nombre = 'Aceptado', orden = 7 WHERE orden = 16;

INSERT INTO etapas_proceso (nombre, orden) VALUES ('Envío', 8);

UPDATE etapas_proceso SET orden = 1 WHERE orden = 11;
UPDATE etapas_proceso SET orden = 2 WHERE orden = 12;
UPDATE etapas_proceso SET orden = 3 WHERE orden = 13;
UPDATE etapas_proceso SET orden = 4 WHERE orden = 14;
