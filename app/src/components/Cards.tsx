import type { ReactNode } from 'react';

export const StatCard = ({ title, value, subtitle, accent }: { title: string; value: ReactNode; subtitle?: string; accent?: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className={`mt-2 text-3xl font-semibold ${accent ?? 'text-slate-900'}`}>{value}</p>
    {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
  </div>
);

export default StatCard;
