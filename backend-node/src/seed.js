const db = require('./db');

const run = async () => {
  try {
    await db.query(`INSERT INTO person (id, nombre, rol, jerarquia, especialidad, unidad)
      VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ana Fernández', 'Supervisor', 'Nivel 2', 'Operaciones', 'Unidad A'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bruno Díaz', 'Operador', 'Nivel 1', 'Soporte', 'Unidad A'),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Carla Gómez', 'Operador', 'Nivel 1', 'Seguridad', 'Unidad B')
      ON CONFLICT (id) DO NOTHING`);

    await db.query(`INSERT INTO status_snapshot (person_id, status, ts, source, reason)
      VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AVAILABLE', NOW(), 'seed', 'Reseteado'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BUSY', NOW(), 'seed', 'Reseteado'),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'OFF_SHIFT', NOW(), 'seed', 'Reseteado')`);
    console.log('Seeds aplicadas');
  } catch (err) {
    console.error('Error en seed', err);
  } finally {
    await db.pool.end();
  }
};

run();
