import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatusNow, postPresenceEvent } from '../lib/api';
import { statusChannel } from '../lib/ws';
import { DataTable } from '../components/Table';
import { StatCard } from '../components/Cards';
import StatusPie from '../components/Charts';

const STATUS_LABELS: Record<string, string> = {
  OFF_SHIFT: 'Fuera de turno',
  ON_SHIFT: 'En turno',
  AVAILABLE: 'Disponible',
  BUSY: 'Ocupado',
  BREAK: 'En descanso',
  ABSENT: 'Ausente',
  TRAINING: 'Capacitación',
  ESCALATED: 'Escalado',
  EMERGENCY: 'Emergencia',
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { data: initialData = [] } = useQuery({
    queryKey: ['status-now'],
    queryFn: () => fetchStatusNow(),
  });
  const [rows, setRows] = useState(initialData);

  useEffect(() => {
    setRows(initialData);
  }, [initialData]);

  useEffect(() => {
    const unsubscribe = statusChannel.subscribe((data) => {
      if (Array.isArray(data)) {
        setRows(data as typeof rows);
      } else if (data && typeof data === 'object' && 'person_id' in (data as Record<string, unknown>)) {
        setRows((prev) => {
          const snapshot = data as { person_id: string; status: string; ts: string; reason?: string };
          const idx = prev.findIndex((item) => item.id === snapshot.person_id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], status: snapshot.status, ts: snapshot.ts, reason: snapshot.reason };
            return next;
          }
          queryClient.invalidateQueries({ queryKey: ['status-now'] });
          return prev;
        });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const totals = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const chartData = useMemo(
    () =>
      Object.entries(totals).map(([status, value]) => ({
        name: STATUS_LABELS[status] ?? status,
        value,
      })),
    [totals]
  );

  const mutation = useMutation({
    mutationFn: (input: { person_id: string; type: string }) =>
      postPresenceEvent({
        person_id: input.person_id,
        ts: new Date().toISOString(),
        source: 'task',
        type: input.type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-now'] });
    },
  });

  const columns = useMemo(
    () => [
      {
        header: 'Nombre',
        accessorKey: 'nombre',
      },
      {
        header: 'Rol',
        accessorKey: 'rol',
      },
      {
        header: 'Unidad',
        accessorKey: 'unidad',
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        cell: ({ getValue }: any) => STATUS_LABELS[getValue()] ?? getValue(),
      },
      {
        header: 'Actualizado',
        accessorKey: 'ts',
        cell: ({ getValue }: any) => new Date(getValue()).toLocaleTimeString(),
      },
      {
        header: 'Acciones',
        cell: ({ row }: any) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              onClick={() => mutation.mutate({ person_id: row.original.id, type: 'assigned' })}
            >
              Escalar
            </button>
            <button
              type="button"
              className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              onClick={() => mutation.mutate({ person_id: row.original.id, type: 'completed' })}
            >
              Fin tarea
            </button>
          </div>
        ),
      },
    ],
    [mutation]
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Activos" value={rows.length} subtitle="Personas con estado reciente" />
        <StatCard title="Disponibles" value={totals.AVAILABLE ?? 0} accent="text-success" />
        <StatCard title="En emergencia" value={totals.EMERGENCY ?? 0} accent="text-danger" />
        <StatCard title="En descanso" value={totals.BREAK ?? 0} accent="text-amber-500" />
      </section>
      <section className="grid gap-4 lg:grid-cols-[2fr,3fr]">
        <StatusPie data={chartData} />
        <div>
          <h2 className="mb-4 text-lg font-semibold">Personas</h2>
          <DataTable data={rows} columns={columns as any} />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
