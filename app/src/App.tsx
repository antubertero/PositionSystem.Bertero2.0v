import { Suspense, useEffect, useMemo } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './routes/Dashboard';
import { lazy } from 'react';
import Settings from './routes/Settings';
import People from './routes/People';
import ImportCsv from './routes/ImportCsv';
import Events from './routes/Events';
import Audit from './routes/Audit';
import Diagnostics from './routes/Diagnostics';
import { login } from './lib/api';

const QuickPanel = lazy(() => import('./routes/QuickPanel'));

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const baseNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/configuracion', label: 'Configuración' },
  { to: '/personas', label: 'Personas' },
  { to: '/importar', label: 'Importar CSV' },
  { to: '/eventos', label: 'Sandbox de eventos' },
  { to: '/auditoria', label: 'Auditoría' },
  { to: '/diagnostico', label: 'Diagnóstico' },
];

const navItemsWithQuickPanel = (items: NavItem[]): NavItem[] => {
  const cloned = [...items];
  const dashboardIndex = cloned.findIndex((item) => item.to === '/');
  const quickPanelLink: NavItem = { to: '/panel', label: 'Panel rápido' };

  if (dashboardIndex === -1) {
    cloned.unshift(quickPanelLink);
    return cloned;
  }

  cloned.splice(dashboardIndex + 1, 0, quickPanelLink);
  return cloned;
};

const App = () => {
  useEffect(() => {
    const ensureToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        await login('admin@demo', 'admin');
      }
    };
    ensureToken();
  }, []);

  const navItems = useMemo(() => navItemsWithQuickPanel(baseNavItems), []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">Control de Personal en Tiempo Real</h1>
          <nav className="flex gap-4 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded px-3 py-2 font-medium transition ${
                    isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/panel" element={<QuickPanel />} />
            <Route path="/configuracion" element={<Settings />} />
            <Route path="/personas" element={<People />} />
            <Route path="/importar" element={<ImportCsv />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/auditoria" element={<Audit />} />
            <Route path="/diagnostico" element={<Diagnostics />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
