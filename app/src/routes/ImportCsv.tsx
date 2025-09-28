import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPerson } from '../lib/api';
import templateUrl from '../assets/plantilla_personas.csv?url';

interface CsvRow {
  nombre: string;
  rol: string;
  jerarquia?: string;
  especialidad?: string;
  unidad?: string;
}

const ImportCsv = () => {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (items: CsvRow[]) => {
      for (const row of items) {
        await createPerson(row);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setStatus('Importación completada');
    },
  });

  const parseCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setError('El archivo debe incluir encabezado y al menos una fila');
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    const requiredHeaders = ['nombre', 'rol'];
    if (!requiredHeaders.every((header) => headers.includes(header))) {
      setError('El CSV debe incluir las columnas nombre y rol');
      return;
    }
    const parsedRows: CsvRow[] = lines.slice(1).map((line) => {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? '';
      });
      return row as CsvRow;
    });
    setRows(parsedRows.filter((row) => row.nombre));
    setError(null);
    setStatus(null);
  };

  const handleImport = () => {
    if (rows.length === 0) {
      setError('No hay filas válidas para importar');
      return;
    }
    mutation.mutate(rows);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Importar desde CSV</h2>
        <p className="mt-2 text-sm text-slate-500">
          Descargá la{' '}
          <a href={templateUrl} className="text-primary underline">
            plantilla
          </a>{' '}
          y cargala con tus datos.
        </p>
        <input
          type="file"
          accept="text/csv"
          className="mt-4"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) parseCsv(file);
          }}
        />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        {status && <p className="mt-3 text-sm text-success">{status}</p>}
        {rows.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Vista previa ({rows.length} filas)</h3>
            <div className="max-h-64 overflow-auto rounded border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Rol</th>
                    <th className="px-3 py-2 text-left">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2">{row.nombre}</td>
                      <td className="px-3 py-2">{row.rol}</td>
                      <td className="px-3 py-2">{row.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
              onClick={handleImport}
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Importando…' : 'Importar'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ImportCsv;
