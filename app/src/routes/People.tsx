import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPerson, fetchPeople } from '../lib/api';
import { DataTable } from '../components/Table';
import { Label, Input, Select, ErrorText } from '../components/FormControls';
import { personSchema } from '../lib/validators';
import { z } from 'zod';
import { useMemo, useState } from 'react';

const People = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{ unidad?: string; rol?: string }>({});
  const { data = [], isFetching } = useQuery({
    queryKey: ['people', filters],
    queryFn: () => fetchPeople(filters as Record<string, string>),
  });

  const columns = useMemo(
    () => [
      { header: 'Nombre', accessorKey: 'nombre' },
      { header: 'Rol', accessorKey: 'rol' },
      { header: 'Unidad', accessorKey: 'unidad' },
      { header: 'Especialidad', accessorKey: 'especialidad' },
    ],
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof personSchema>>({ resolver: zodResolver(personSchema) });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof personSchema>) => createPerson(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      reset();
    },
  });

  const onSubmit = (values: z.infer<typeof personSchema>) => mutation.mutate(values);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Alta rápida</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre')} />
            <ErrorText message={errors.nombre?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Input id="rol" {...register('rol')} />
            <ErrorText message={errors.rol?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jerarquia">Jerarquía</Label>
            <Input id="jerarquia" {...register('jerarquia')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="especialidad">Especialidad</Label>
            <Input id="especialidad" {...register('especialidad')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidad">Unidad</Label>
            <Input id="unidad" {...register('unidad')} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white shadow">
              Crear persona
            </button>
          </div>
        </form>
      </section>
      <section className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label htmlFor="filtroUnidad">Filtrar por unidad</Label>
            <Select
              id="filtroUnidad"
              value={filters.unidad ?? ''}
              onChange={(event) => setFilters((prev) => ({ ...prev, unidad: event.target.value || undefined }))}
            >
              <option value="">Todas</option>
              <option value="Unidad A">Unidad A</option>
              <option value="Unidad B">Unidad B</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="filtroRol">Filtrar por rol</Label>
            <Select id="filtroRol" value={filters.rol ?? ''} onChange={(event) => setFilters((prev) => ({ ...prev, rol: event.target.value || undefined }))}>
              <option value="">Todos</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Operador">Operador</option>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Personas registradas</h2>
          {isFetching && <p className="text-sm text-slate-400">Actualizando…</p>}
        </div>
        <DataTable data={data} columns={columns as any} />
      </section>
    </div>
  );
};

export default People;
