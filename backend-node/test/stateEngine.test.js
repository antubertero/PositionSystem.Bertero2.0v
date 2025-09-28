const { onEvent } = require('../src/stateEngine');

describe('state engine priority resolution', () => {
  it('prioritises emergency events', () => {
    const current = { person_id: '1', status: 'AVAILABLE', ts: '2024-01-01T10:00:00Z', source: 'resolved', reason: 'ok', priority: 'TASK' };
    const event = { person_id: '1', ts: '2024-01-01T10:01:00Z', source: 'panic', type: 'panic' };
    const result = onEvent(event, current, {});
    expect(result.status).toBe('EMERGENCY');
  });

  it('keeps latest timestamp when same priority', () => {
    const current = { person_id: '1', status: 'AVAILABLE', ts: '2024-01-01T10:00:00Z', source: 'resolved', reason: 'ok', priority: 'TASK' };
    const event = { person_id: '1', ts: '2024-01-01T10:05:00Z', source: 'task', type: 'completed' };
    const result = onEvent(event, current, {});
    expect(result.status).toBe('AVAILABLE');
    expect(result.ts).toBe('2024-01-01T10:05:00Z');
  });
});
