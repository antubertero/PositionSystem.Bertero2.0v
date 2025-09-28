import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAudit } from '../lib/api';
import { Input, Label } from '../components/FormControls';

const Audit = () => {
  const [personId, setPersonId] = useState('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  const { data = [], refetch, isFetching } = useQuery({
    queryKey: ['audit', personId],
    queryFn: () => fetchAudit(personId),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Auditoría por persona</h2>
        <div className="mt-4 flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="persona">Persona (UUID)</Label>
            <Input id="persona" value={personId} onChange={(event) => setPersonId(event.target.value)} />
          </div>
          <button
            type="button"
            className="self-end rounded bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
            onClick={() => refetch()}
          >
            Consultar
          </button>
        </div>
        <ul className="mt-6 space-y-3 text-sm">
          {data.map((item: any) => (
            <li key={item.ts} className="border-l-2 border-primary pl-4">
              <p className="font-semibold">{item.action}</p>
              <p className="text-slate-500">{new Date(item.ts).toLocaleString()}</p>
              <pre className="rounded bg-slate-100 p-2 text-xs text-slate-600">{JSON.stringify(item.details, null, 2)}</pre>
            </li>
          ))}
          {data.length === 0 && !isFetching && <li className="text-slate-400">Sin auditoría disponible</li>}
          {isFetching && <li className="text-slate-400">Cargando…</li>}
        </ul>
      </section>
    </div>
  );
};

export default Audit;
