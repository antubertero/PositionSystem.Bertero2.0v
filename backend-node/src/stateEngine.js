const PRIORITIES = ['EMERGENCY', 'BIOMETRIC', 'GEOFENCE', 'TASK', 'CALENDAR'];
const priorityWeight = PRIORITIES.reduce((acc, name, index) => {
  acc[name] = PRIORITIES.length - index;
  return acc;
}, {});

const inferPriority = (event) => {
  if (!event) return 'CALENDAR';
  if (event.type === 'panic' || event.source === 'panic') return 'EMERGENCY';
  if (event.source === 'biometric') return 'BIOMETRIC';
  if (event.type && event.type.startsWith('geo')) return 'GEOFENCE';
  if (event.source === 'task') return 'TASK';
  return 'CALENDAR';
};

const applyRules = (event, currentSnapshot = null, context = {}) => {
  if (!event) return null;
  const base = {
    person_id: event.person_id,
    ts: event.ts,
    source: 'resolved',
    reason: '',
    status: currentSnapshot?.status || 'OFF_SHIFT',
    priority: inferPriority(event),
  };

  if (event.type === 'panic') {
    return { ...base, status: 'EMERGENCY', reason: 'Botón de pánico' };
  }

  if (event.source === 'biometric' && event.type === 'entry') {
    return { ...base, status: 'ON_SHIFT', reason: 'Ingreso biométrico' };
  }

  if (event.source === 'biometric' && event.type === 'exit') {
    return { ...base, status: 'OFF_SHIFT', reason: 'Salida biométrica' };
  }

  if (event.source === 'task' && event.type === 'assigned') {
    return { ...base, status: 'BUSY', reason: 'Tarea asignada' };
  }

  if (event.source === 'task' && event.type === 'completed') {
    return { ...base, status: 'AVAILABLE', reason: 'Tarea completada' };
  }

  if (event.source === 'mobile' && event.type === 'geo_enter') {
    if (context.inShift) {
      return { ...base, status: 'AVAILABLE', reason: 'Ingreso a zona geocercada' };
    }
    return { ...base, status: 'ON_SHIFT', reason: 'Ingreso fuera de turno' };
  }

  if (event.source === 'mobile' && event.type === 'geo_exit') {
    return { ...base, status: 'BREAK', reason: 'Salida de zona geocercada' };
  }

  if (event.type === 'entry' || event.type === 'checkin') {
    return { ...base, status: 'AVAILABLE', reason: 'Check-in' };
  }

  if (event.type === 'exit' || event.type === 'checkout') {
    return { ...base, status: 'OFF_SHIFT', reason: 'Check-out' };
  }

  if (context.shiftEnded) {
    return { ...base, status: 'OFF_SHIFT', reason: 'Fin de turno' };
  }

  return { ...base, status: currentSnapshot?.status || 'OFF_SHIFT', reason: 'Sin cambios' };
};

const chooseByPriority = (candidate, currentSnapshot) => {
  if (!candidate) return currentSnapshot || null;
  if (!currentSnapshot) return candidate;
  const currentPriority = currentSnapshot.priority || inferPriority({ source: currentSnapshot.source });
  const candidatePriority = candidate.priority || inferPriority({ source: candidate.source, type: candidate.type });
  if ((priorityWeight[candidatePriority] || 0) > (priorityWeight[currentPriority] || 0)) {
    return candidate;
  }
  if ((priorityWeight[candidatePriority] || 0) === (priorityWeight[currentPriority] || 0)) {
    if (new Date(candidate.ts).getTime() >= new Date(currentSnapshot.ts).getTime()) {
      return candidate;
    }
  }
  return { ...currentSnapshot, priority: currentPriority };
};

const onEvent = (event, currentSnapshot, context) => {
  const candidate = applyRules(event, currentSnapshot, context);
  const chosen = chooseByPriority(candidate, currentSnapshot && { ...currentSnapshot, priority: currentSnapshot.priority || inferPriority({ source: currentSnapshot.source }) });
  return chosen;
};

module.exports = {
  PRIORITIES,
  applyRules,
  chooseByPriority,
  onEvent,
  inferPriority,
};
