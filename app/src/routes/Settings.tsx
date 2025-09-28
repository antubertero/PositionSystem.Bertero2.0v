import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { institutionSchema } from '../lib/validators';
import { Label, Input, ErrorText } from '../components/FormControls';
import { z } from 'zod';

const Settings = () => {
  const stored = localStorage.getItem('institution');
  const defaultValues = stored ? (JSON.parse(stored) as z.infer<typeof institutionSchema>) : {
    nombre: 'Institución Demo',
    zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    toleranciaNoShow: 15,
    breakMax: 20,
    prefijoLegajo: 'LEG',
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<z.infer<typeof institutionSchema>>({
    resolver: zodResolver(institutionSchema),
    defaultValues,
  });

  const onSubmit = (values: z.infer<typeof institutionSchema>) => {
    localStorage.setItem('institution', JSON.stringify(values));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold">Configuración de la institución</h2>
      <p className="text-sm text-slate-500">
        Define los parámetros globales de operación. Los valores se almacenan en el navegador para esta demo.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" {...register('nombre')} />
          <ErrorText message={errors.nombre?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zonaHoraria">Zona horaria</Label>
          <Input id="zonaHoraria" {...register('zonaHoraria')} />
          <ErrorText message={errors.zonaHoraria?.message} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="toleranciaNoShow">Tolerancia no-show (min)</Label>
            <Input id="toleranciaNoShow" type="number" {...register('toleranciaNoShow', { valueAsNumber: true })} />
            <ErrorText message={errors.toleranciaNoShow?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breakMax">Descanso máximo (min)</Label>
            <Input id="breakMax" type="number" {...register('breakMax', { valueAsNumber: true })} />
            <ErrorText message={errors.breakMax?.message} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prefijoLegajo">Prefijo de legajo</Label>
          <Input id="prefijoLegajo" {...register('prefijoLegajo')} />
          <ErrorText message={errors.prefijoLegajo?.message} />
        </div>
        <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600">
          Guardar cambios
        </button>
        {isSubmitSuccessful && <p className="text-sm text-success">Configuración guardada</p>}
      </form>
    </div>
  );
};

export default Settings;
