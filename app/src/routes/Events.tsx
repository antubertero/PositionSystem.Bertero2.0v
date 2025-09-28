import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { presenceEventSchema } from '../lib/validators';
import { postPresenceEvent, fetchStatusHistory } from '../lib/api';
import { Label, Input, Select, ErrorText } from '../components/FormControls';
import { useState } from 'react';
import { z } from 'zod';

const Events = () => {
  const [history, setHistory] = useState<any[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<z.infer<typeof presenceEventSchema>>({
    resolver: zodResolver(presenceEventSchema),
    defaultValues: {
      ts: new Date().toISOString().slice(0, 16),
      source: 'mobile',
      type: 'checkin',
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: z.infer<typeof presenceEventSchema>) => postPresenceEvent(payload),
    onSuccess: async (_, variables) => {
      const data = await fetchStatusHistory(variables.person_id);
      setHistory(data);
    },
  });

  const onSubmit = (values: z.infer<typeof presenceEventSchema>) => {
    const parsedValues = { ...values, ts: new Date(values.ts).toISOString() };
    if (values.payload && typeof values.payload === 'string') {
      try {
        parsedValues.payload = JSON.parse(values.payload as unknown as string);
      } catch (error) {
        parsedValues.payload = { raw: values.payload };
      }
    }
    mutation.mutate(parsedValues);
    setValue('ts', new Date().toISOString().slice(0, 16));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Sandbox de eventos de presencia</h2>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="person_id">Persona (UUID)</Label>
            <Input id="person_id" {...register('person_id')} placeholder="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" />
            <ErrorText message={errors.person_id?.message} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ts">Timestamp</Label>
              <Input id="ts" type="datetime-local" {...register('ts')} />
              <ErrorText message={errors.ts?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Origen</Label>
              <Select id="source" {...register('source')}>
                <option value="mobile">Mobile</option>
                <option value="kiosk">Kiosco</option>
                <option value="biometric">Biométrico</option>
                <option value="task">Tarea</option>
                <option value="calendar">Calendario</option>
                <option value="panic">Pánico</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de evento</Label>
            <Select id="type" {...register('type')}>
              <option value="checkin">Check-in</option>
              <option value="checkout">Check-out</option>
              <option value="entry">Entrada</option>
              <option value="exit">Salida</option>
              <option value="assigned">Asignado</option>
              <option value="completed">Completado</option>
              <option value="panic">Pánico</option>
              <option value="geo_enter">Geocerca entrada</option>
              <option value="geo_exit">Geocerca salida</option>
            </Select>
            <ErrorText message={errors.type?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payload">Payload JSON (opcional)</Label>
            <Input id="payload" placeholder='{"detalle":"valor"}' {...register('payload')} />
          </div>
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white shadow" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Enviando…' : 'Enviar evento'}
          </button>
          {mutation.isError && <p className="text-sm text-danger">Error al enviar evento</p>}
          {mutation.isSuccess && <p className="text-sm text-success">Evento aplicado</p>}
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Historial reciente</h2>
        <p className="text-sm text-slate-500">Se actualiza automáticamente tras registrar un evento.</p>
        <ul className="mt-4 space-y-3 text-sm">
          {history.map((item) => (
            <li key={item.ts} className="rounded border border-slate-200 p-3">
              <p className="font-semibold">{item.status}</p>
              <p className="text-slate-500">{new Date(item.ts).toLocaleString()}</p>
              <p className="text-slate-400">{item.reason}</p>
            </li>
          ))}
          {history.length === 0 && <li className="text-slate-400">Sin eventos todavía</li>}
        </ul>
      </section>
    </div>
  );
};

export default Events;
