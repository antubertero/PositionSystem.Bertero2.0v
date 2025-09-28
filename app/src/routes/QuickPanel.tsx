import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPerson,
  fetchPeople,
  fetchStatusNow,
  postPresenceEvent,
} from '../lib/api';

const personSchema = z.object({
  nombre: z.string().min(1, 'Ingresá un nombre'),
  rol: z.string().min(1, 'Indicá el rol'),
  jerarquia: z.string().optional(),
  especialidad: z.string().optional(),
  unidad: z.string().min(1, 'Seleccioná una unidad'),
});

const eventSchema = z.object({
  person_id: z.string().min(1, 'Elegí a la persona'),
  ts: z.string().min(1, 'Definí el momento'),
  source: z.enum(['mobile', 'kiosk', 'biometric', 'task', 'calendar', 'panic']),
  type: z.enum([
    'entry',
    'exit',
    'checkin',
    'checkout',
    'assigned',
    'completed',
    'panic',
    'geo_enter',
    'geo_exit',
  ]),
  payload: z.string().optional(),
});

type PersonForm = z.infer<typeof personSchema>;
type EventForm = z.infer<typeof eventSchema>;

type PersonRow = {
  id: string | number;
  nombre: string;
  rol: string;
};

type StatusRow = {
  id: string | number;
  nombre: string;
  rol: string | null;
  unidad: string | null;
  status: string | null;
  reason: string | null;
  ts: string | null;
};

const sources = [
  { value: 'biometric', label: 'Biométrico' },
  { value: 'mobile', label: 'Móvil' },
  { value: 'kiosk', label: 'Totem/Kiosco' },
  { value: 'task', label: 'Tarea' },
  { value: 'calendar', label: 'Calendario' },
  { value: 'panic', label: 'Pánico' },
];

const types = [
  { value: 'entry', label: 'Entrada' },
  { value: 'exit', label: 'Salida' },
  { value: 'checkin', label: 'Check-in' },
  { value: 'checkout', label: 'Check-out' },
  { value: 'assigned', label: 'Asignada' },
  { value: 'completed', label: 'Completada' },
  { value: 'panic', label: 'Botón de pánico' },
  { value: 'geo_enter', label: 'Entrada a zona' },
  { value: 'geo_exit', label: 'Salida de zona' },
];

const QuickPanel = () => {
  const queryClient = useQueryClient();
  const [personMessage, setPersonMessage] = useState<string | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  const peopleQuery = useQuery({
    queryKey: ['people', { panel: true }],
    queryFn: () => fetchPeople(),
  });

  const statusQuery = useQuery({
    queryKey: ['status-now', { panel: true }],
    queryFn: () => fetchStatusNow(),
    refetchInterval: 3000,
  });

  const {
    register: registerPerson,
    handleSubmit: handleSubmitPerson,
    reset: resetPerson,
    formState: { errors: personErrors },
  } = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      nombre: '',
      rol: '',
      jerarquia: '',
      especialidad: '',
      unidad: '',
    },
  });

  const nowLocal = () => new Date().toISOString().slice(0, 16);

  const {
    register: registerEvent,
    handleSubmit: handleSubmitEvent,
    reset: resetEvent,
    formState: { errors: eventErrors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      person_id: '',
      ts: nowLocal(),
      source: 'biometric',
      type: 'entry',
      payload: '',
    },
  });

  const createPersonMutation = useMutation({
    mutationFn: (values: PersonForm) => createPerson(values),
    onSuccess: (created) => {
      setPersonMessage(`Persona ${created.nombre} registrada`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['status-now'] });
      resetPerson();
    },
  });

  const sendEventMutation = useMutation({
    mutationFn: (values: EventForm & { payload?: Record<string, unknown> | null }) =>
      postPresenceEvent(values),
    onSuccess: () => {
      setEventMessage('Evento enviado y estado actualizado');
      setEventError(null);
      queryClient.invalidateQueries({ queryKey: ['status-now'] });
      resetEvent({
        person_id: '',
        ts: nowLocal(),
        source: 'biometric',
        type: 'entry',
        payload: '',
      });
    },
  });

  const statusTotals = useMemo(() => {
    const items = statusQuery.data ?? [];
    const totals = new Map<string, number>();
    items.forEach((row) => {
      const key = row.status ?? 'SIN_ESTADO';
      totals.set(key, (totals.get(key) ?? 0) + 1);
    });
    return Array.from(totals.entries()).map(([status, count]) => ({ status, count }));
  }, [statusQuery.data]);

  const onCreatePerson = (values: PersonForm) => {
    setPersonMessage(null);
    createPersonMutation.mutate(values);
  };

  const onSendEvent = (values: EventForm) => {
    setEventMessage(null);
    let parsedPayload: Record<string, unknown> | null = null;
    if (values.payload) {
      try {
        parsedPayload = JSON.parse(values.payload);
      } catch (err) {
        setEventError('La carga útil debe ser un JSON válido');
        return;
      }
    }
    setEventError(null);
    const timestamp = new Date(values.ts);
    if (Number.isNaN(timestamp.getTime())) {
      setEventError('Ingresá un horario válido');
      return;
    }
    const formattedTs = timestamp.toISOString();
    sendEventMutation.mutate({
      ...values,
      ts: formattedTs,
      payload: parsedPayload ?? undefined,
    });
  };

  const statusRows: StatusRow[] = statusQuery.data ?? [];
  const people: PersonRow[] = peopleQuery.data ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Panel rápido</h2>
        <p className="mt-2 text-sm text-slate-600">
          Gestioná las operaciones básicas desde un único lugar. Podés dar de alta agentes,
          simular eventos de presencia y revisar el estado en vivo sin navegar por todo el
          menú.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            to="/"
            className="rounded border border-primary px-3 py-2 font-medium text-primary transition hover:bg-primary hover:text-white"
          >
            Ver dashboard completo
          </Link>
          <Link
            to="/importar"
            className="rounded border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
          >
            Importar personas por CSV
          </Link>
          <Link
            to="/eventos"
            className="rounded border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
          >
            Abrir sandbox avanzado
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Alta rápida de persona</h3>
          <p className="mt-1 text-sm text-slate-600">
            Registrá datos mínimos para empezar a monitorear a alguien. Podrás completar el
            perfil luego desde la sección Personas.
          </p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmitPerson(onCreatePerson)}>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="nombre">
                Nombre y apellido
              </label>
              <input
                id="nombre"
                type="text"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Juana Pérez"
                {...registerPerson('nombre')}
              />
              {personErrors.nombre && (
                <p className="mt-1 text-xs text-red-600">{personErrors.nombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="rol">
                Rol
              </label>
              <input
                id="rol"
                type="text"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Supervisor"
                {...registerPerson('rol')}
              />
              {personErrors.rol && (
                <p className="mt-1 text-xs text-red-600">{personErrors.rol.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="unidad">
                  Unidad
                </label>
                <input
                  id="unidad"
                  type="text"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ej: Guardia Centro"
                  {...registerPerson('unidad')}
                />
                {personErrors.unidad && (
                  <p className="mt-1 text-xs text-red-600">{personErrors.unidad.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="jerarquia">
                  Jerarquía (opcional)
                </label>
                <input
                  id="jerarquia"
                  type="text"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ej: Senior"
                  {...registerPerson('jerarquia')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="especialidad">
                Especialidad (opcional)
              </label>
              <input
                id="especialidad"
                type="text"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Primeros auxilios"
                {...registerPerson('especialidad')}
              />
            </div>
            {personMessage && <p className="text-sm text-green-600">{personMessage}</p>}
            {createPersonMutation.isError && (
              <p className="text-sm text-red-600">
                No pudimos crear a la persona. Probá nuevamente en unos segundos.
              </p>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              disabled={createPersonMutation.isPending}
            >
              {createPersonMutation.isPending ? 'Guardando…' : 'Crear y habilitar monitoreo'}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Evento inmediato</h3>
          <p className="mt-1 text-sm text-slate-600">
            Enviá un evento de presencia para actualizar el estado en tiempo real. Ideal para
            pruebas o cargas manuales.
          </p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmitEvent(onSendEvent)}>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="person_id">
                Persona
              </label>
              <select
                id="person_id"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                {...registerEvent('person_id')}
              >
                <option value="">Seleccioná una persona…</option>
                {peopleQuery.isLoading && <option value="" disabled>Cargando personas…</option>}
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.nombre} · {person.rol}
                  </option>
                ))}
              </select>
              {eventErrors.person_id && (
                <p className="mt-1 text-xs text-red-600">{eventErrors.person_id.message}</p>
              )}
              {peopleQuery.isError && (
                <p className="mt-1 text-xs text-red-600">
                  No pudimos cargar las personas. Refrescá la página para reintentar.
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="source">
                  Origen
                </label>
                <select
                  id="source"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  {...registerEvent('source')}
                >
                  {sources.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {eventErrors.source && (
                  <p className="mt-1 text-xs text-red-600">{eventErrors.source.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="type">
                  Tipo de evento
                </label>
                <select
                  id="type"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  {...registerEvent('type')}
                >
                  {types.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {eventErrors.type && (
                  <p className="mt-1 text-xs text-red-600">{eventErrors.type.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="ts">
                Momento (ISO 8601)
              </label>
              <input
                id="ts"
                type="datetime-local"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                {...registerEvent('ts')}
              />
              {eventErrors.ts && (
                <p className="mt-1 text-xs text-red-600">{eventErrors.ts.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="payload">
                Detalles adicionales (JSON opcional)
              </label>
              <textarea
                id="payload"
                rows={3}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder='{"geo":"Base Central"}'
                {...registerEvent('payload')}
              />
              {eventError && <p className="mt-1 text-xs text-red-600">{eventError}</p>}
            </div>
            {eventErrors.payload && (
              <p className="text-xs text-red-600">{eventErrors.payload.message}</p>
            )}
            {eventMessage && <p className="text-sm text-green-600">{eventMessage}</p>}
            {sendEventMutation.isError && (
              <p className="text-sm text-red-600">
                No pudimos registrar el evento. Reintentá más tarde.
              </p>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              disabled={sendEventMutation.isPending}
            >
              {sendEventMutation.isPending ? 'Enviando…' : 'Enviar evento y actualizar'}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Estado en vivo</h3>
            <p className="mt-1 text-sm text-slate-600">
              Cada tarjeta muestra cuántas personas están en cada estado. La tabla inferior
              detalla el último evento detectado.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            Última actualización: {statusQuery.isFetching ? 'actualizando…' : 'sincronizada'}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusTotals.length === 0 && !statusQuery.isLoading && !statusQuery.isError && (
            <p className="col-span-full text-sm text-slate-500">
              Aún no hay estados registrados. Enviá un evento para comenzar.
            </p>
          )}
          {statusTotals.map((item) => (
            <div key={item.status} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {item.status}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.count}</p>
            </div>
          ))}
          {statusQuery.isError && (
            <p className="col-span-full text-sm text-red-600">
              No pudimos obtener los estados en vivo. Intentá nuevamente más tarde.
            </p>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Persona
                </th>
                <th scope="col" className="px-3 py-2">
                  Rol
                </th>
                <th scope="col" className="px-3 py-2">
                  Unidad
                </th>
                <th scope="col" className="px-3 py-2">
                  Estado
                </th>
                <th scope="col" className="px-3 py-2">
                  Motivo
                </th>
                <th scope="col" className="px-3 py-2">
                  Actualizado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {statusRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{row.nombre}</td>
                  <td className="px-3 py-2 text-slate-600">{row.rol ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{row.unidad ?? '—'}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{row.status ?? 'SIN_ESTADO'}</td>
                  <td className="px-3 py-2 text-slate-600">{row.reason ?? 'Sin motivo registrado'}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.ts ? new Date(row.ts).toLocaleString('es-AR') : '—'}
                  </td>
                </tr>
              ))}
              {statusRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-sm text-slate-500">
                    Todavía no hay datos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default QuickPanel;
