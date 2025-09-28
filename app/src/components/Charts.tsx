import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const COLORS = ['#0a7cff', '#12b76a', '#f79009', '#f04438', '#8b5cf6', '#0f172a', '#06b6d4', '#f97316'];

export type ChartDatum = { name: string; value: number };

export const StatusPie = ({ data }: { data: ChartDatum[] }) => (
  <div className="h-64 w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-600">Distribución de estados</h3>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie dataKey="value" data={data} nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `${value} personas`} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default StatusPie;
