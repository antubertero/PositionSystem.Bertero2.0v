import { z } from 'zod';

export const personSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  rol: z.string().min(1, 'Rol obligatorio'),
  jerarquia: z.string().optional(),
  especialidad: z.string().optional(),
  unidad: z.string().optional(),
});

export const presenceEventSchema = z.object({
  person_id: z.string().min(1, 'Persona obligatoria'),
  ts: z.string().min(1, 'Timestamp requerido'),
  source: z.enum(['mobile', 'kiosk', 'biometric', 'task', 'calendar', 'panic']),
  type: z.enum(['entry', 'exit', 'checkin', 'checkout', 'assigned', 'completed', 'panic', 'geo_enter', 'geo_exit']),
  payload: z.union([z.string(), z.record(z.any())]).optional(),
});

export const institutionSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  zonaHoraria: z.string().min(1, 'Zona horaria requerida'),
  toleranciaNoShow: z.number().min(0),
  breakMax: z.number().min(0),
  prefijoLegajo: z.string().min(1),
});
