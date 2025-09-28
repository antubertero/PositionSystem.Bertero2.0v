import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../lib/api';
import { useState } from 'react';

const Diagnostics = () => {
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const result = await fetchHealth();
      setLastChecked(new Date().toLocaleString());
      return result;
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Diagnóstico del backend</h2>
        <p className="text-sm text-slate-500">Último chequeo: {lastChecked ?? 'nunca'}</p>
        <button
          type="button"
          className="mt-4 rounded bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Verificando…' : 'Refrescar'}
        </button>
        {data && (
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Estado</dt>
              <dd className="font-semibold text-success">{data.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Latencia (ms)</dt>
              <dd className="font-semibold">{data.latency_ms}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Versión</dt>
              <dd className="font-semibold">{data.version}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
};

export default Diagnostics;
