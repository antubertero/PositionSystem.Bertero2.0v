INSERT INTO site (id, nombre, tipo, zonas) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Base Central', 'oficina', '["Norte", "Sur"]');

INSERT INTO person (id, nombre, rol, jerarquia, especialidad, unidad) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ana Fernández', 'Supervisor', 'Nivel 2', 'Operaciones', 'Unidad A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bruno Díaz', 'Operador', 'Nivel 1', 'Soporte', 'Unidad A'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Carla Gómez', 'Operador', 'Nivel 1', 'Seguridad', 'Unidad B')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shift (id, person_id, start_ts, end_ts, site_id) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '7 hour', '11111111-1111-1111-1111-111111111111'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '30 minute', NOW() + INTERVAL '7 hour 30 minute', '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '3 hour', NOW() - INTERVAL '1 hour', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO status_snapshot (id, person_id, status, ts, source, reason) VALUES
  ('11111111-2222-3333-4444-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AVAILABLE', NOW() - INTERVAL '5 minute', 'seed', 'Inicio disponible'),
  ('11111111-2222-3333-4444-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BUSY', NOW() - INTERVAL '10 minute', 'seed', 'Ticket asignado'),
  ('11111111-2222-3333-4444-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'OFF_SHIFT', NOW() - INTERVAL '1 hour', 'seed', 'Fin de turno')
ON CONFLICT (id) DO NOTHING;
