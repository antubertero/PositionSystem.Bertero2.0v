const express = require('express');
require('express-async-errors');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = require('./db');
const attachWebSocket = require('./ws');
const { onEvent } = require('./stateEngine');

dotenv.config();

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const ws = attachWebSocket(server);

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Sin token' });
  try {
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Credenciales incompletas' });
  }
  if (username !== 'admin@demo' || password !== 'admin') {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.get('/health', async (req, res) => {
  const start = Date.now();
  await db.query('SELECT 1');
  const latency = Date.now() - start;
  res.json({ status: 'ok', latency_ms: latency, version: '1.0.0' });
});

app.get('/people', authMiddleware, async (req, res) => {
  const { unit, role, status } = req.query;
  const conditions = [];
  const params = [];
  if (unit) {
    params.push(unit);
    conditions.push(`unidad = $${params.length}`);
  }
  if (role) {
    params.push(role);
    conditions.push(`rol = $${params.length}`);
  }
  let baseQuery = 'SELECT * FROM person';
  if (conditions.length) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }
  baseQuery += ' ORDER BY nombre ASC';
  const peopleResult = await db.query(baseQuery, params);

  if (!status) {
    return res.json({ data: peopleResult.rows });
  }

  const ids = peopleResult.rows.map((p) => p.id);
  if (!ids.length) return res.json({ data: [] });
  const statusResult = await db.query(
    `SELECT DISTINCT ON (person_id) person_id, status, ts FROM status_snapshot WHERE person_id = ANY($1::uuid[]) ORDER BY person_id, ts DESC`,
    [ids]
  );
  const statusMap = statusResult.rows.reduce((acc, row) => {
    acc[row.person_id] = row;
    return acc;
  }, {});
  const filtered = peopleResult.rows.filter((p) => statusMap[p.id]?.status === status);
  res.json({ data: filtered });
});

app.post('/people', authMiddleware, async (req, res) => {
  const { nombre, rol, jerarquia, especialidad, unidad } = req.body;
  if (!nombre || !rol) {
    return res.status(400).json({ message: 'Nombre y rol obligatorios' });
  }
  const insert = await db.query(
    `INSERT INTO person (nombre, rol, jerarquia, especialidad, unidad) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [nombre, rol, jerarquia || null, especialidad || null, unidad || null]
  );
  res.status(201).json(insert.rows[0]);
});

const getLatestSnapshot = async (personId) => {
  const result = await db.query(
    'SELECT * FROM status_snapshot WHERE person_id = $1 ORDER BY ts DESC LIMIT 1',
    [personId]
  );
  return result.rows[0] || null;
};

const upsertSnapshot = async (snapshot) => {
  const insert = await db.query(
    `INSERT INTO status_snapshot (person_id, status, ts, source, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [snapshot.person_id, snapshot.status, snapshot.ts, snapshot.source, snapshot.reason]
  );
  return insert.rows[0];
};

const getShiftContext = async (personId, ts) => {
  const context = { inShift: false, shiftEnded: false };
  const result = await db.query(
    `SELECT start_ts, end_ts FROM shift WHERE person_id = $1 ORDER BY end_ts DESC LIMIT 1`,
    [personId]
  );
  if (!result.rowCount) {
    context.shiftEnded = true;
    return context;
  }
  const shift = result.rows[0];
  const timestamp = new Date(ts);
  context.inShift = timestamp >= new Date(shift.start_ts) && timestamp <= new Date(shift.end_ts);
  const grace = 10 * 60 * 1000;
  context.shiftEnded = timestamp > new Date(shift.end_ts).getTime() + grace;
  return context;
};

const recordAudit = async (personId, action, details) => {
  await db.query(
    `INSERT INTO audit_log (person_id, action, details) VALUES ($1,$2,$3)` ,
    [personId, action, details ? JSON.stringify(details) : '{}']
  );
};

app.post('/events/presence', authMiddleware, async (req, res) => {
  const { person_id, ts, source, type, payload } = req.body;
  if (!person_id || !ts || !source || !type) {
    return res.status(400).json({ message: 'Campos obligatorios: person_id, ts, source, type' });
  }
  const eventResult = await db.query(
    `INSERT INTO presence_event (person_id, ts, source, type, payload) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [person_id, ts, source, type, payload ? JSON.stringify(payload) : '{}']
  );
  const event = eventResult.rows[0];
  const currentSnapshot = await getLatestSnapshot(person_id);
  const context = await getShiftContext(person_id, ts);
  const snapshotCandidate = onEvent(event, currentSnapshot, context);
  let appliedSnapshot = currentSnapshot;
  if (!currentSnapshot || snapshotCandidate.status !== currentSnapshot.status || snapshotCandidate.reason !== currentSnapshot.reason) {
    appliedSnapshot = await upsertSnapshot(snapshotCandidate);
    ws.broadcast(appliedSnapshot);
    await recordAudit(person_id, 'status_change', { from: currentSnapshot?.status, to: appliedSnapshot.status, reason: appliedSnapshot.reason });
  }
  res.status(201).json({ event, snapshot: appliedSnapshot });
});

app.get('/status/now', authMiddleware, async (req, res) => {
  const { unit } = req.query;
  const result = await db.query(
    `SELECT DISTINCT ON (p.id) p.id, p.nombre, p.rol, p.unidad, s.status, s.ts, s.reason
     FROM person p
     LEFT JOIN status_snapshot s ON s.person_id = p.id
     ${unit ? 'WHERE p.unidad = $1' : ''}
     ORDER BY p.id, s.ts DESC`,
    unit ? [unit] : []
  );
  res.json({ data: result.rows });
});

app.get('/status/history', authMiddleware, async (req, res) => {
  const { person_id, from, to } = req.query;
  if (!person_id) return res.status(400).json({ message: 'person_id obligatorio' });
  const params = [person_id];
  const conditions = ['person_id = $1'];
  if (from) {
    params.push(from);
    conditions.push(`ts >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`ts <= $${params.length}`);
  }
  const query = `SELECT person_id, status, ts, source, reason FROM status_snapshot WHERE ${conditions.join(' AND ')} ORDER BY ts DESC`;
  const result = await db.query(query, params);
  res.json({ data: result.rows });
});

app.post('/alerts/test', authMiddleware, async (req, res) => {
  const { person_id, channel } = req.body;
  if (!person_id) return res.status(400).json({ message: 'person_id requerido' });
  await recordAudit(person_id, 'alert_test', { channel: channel || 'default' });
  res.json({ message: 'Alerta de prueba enviada' });
});

app.get('/reports/kpi', authMiddleware, async (req, res) => {
  const { from, to } = req.query;
  const params = [];
  const conditions = [];
  if (from) {
    params.push(from);
    conditions.push(`ts >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`ts <= $${params.length}`);
  }
  let baseQuery = 'SELECT status FROM status_snapshot';
  if (conditions.length) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }
  const result = await db.query(baseQuery, params);
  const totals = result.rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  res.json({ totals });
});

app.get('/audit/:personId', authMiddleware, async (req, res) => {
  const { personId } = req.params;
  const result = await db.query(
    `SELECT action, details, ts FROM audit_log WHERE person_id = $1 ORDER BY ts DESC LIMIT 100`,
    [personId]
  );
  res.json({ data: result.rows });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error inesperado', detail: err.message });
});

server.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});

module.exports = { app, server };
