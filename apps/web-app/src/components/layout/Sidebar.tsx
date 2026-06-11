import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  Wheat,
  ListChecks,
  ShoppingCart,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PortioMark, PortioWordmark } from './PortioLogo';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Planos alimentares', href: '/planos', icon: CalendarRange },
  { name: 'Alimentos', href: '/alimentos', icon: Wheat },
  { name: 'Refeições prontas', href: '/refeicoes-prontas', icon: ListChecks },
  { name: 'Listas de compras', href: '/listas-compras', icon: ShoppingCart },
];

function SidebarBody({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-line px-[22px] py-[22px] pb-[18px]">
        <PortioMark size={26} />
        <PortioWordmark />
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.08em] text-muted border border-line rounded px-1.5 py-0.5">
          v0.1
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-0.5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-2 px-3 pt-3.5 pb-1.5">
          Planejamento
        </div>
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-[11px] px-3 py-2.5 rounded-[var(--r-md)] text-sm font-medium border border-transparent',
                'transition-[background,border-color,color] duration-120',
                isActive
                  ? 'bg-ink text-bg'
                  : 'text-ink-2 hover:bg-surface-alt'
              )}
            >
              <item.icon
                size={18}
                strokeWidth={1.6}
                className="flex-shrink-0"
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-line p-3.5 flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-[10px] bg-ink text-bg grid place-items-center font-mono text-xs font-semibold tracking-[0.04em] flex-shrink-0"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-tight truncate">
            {user?.name || 'Usuário'}
          </div>
          <div className="text-[11px] font-mono text-muted truncate">
            {user?.email}
          </div>
        </div>
        <button
          onClick={logout}
          title="Sair"
          className="w-[30px] h-[30px] rounded-lg grid place-items-center text-muted hover:bg-surface-alt hover:text-ink transition-[background,color] duration-120"
        >
          <LogOut size={16} strokeWidth={1.6} />
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-10 h-14 px-3.5 border-b border-line bg-bg items-center gap-3 hidden max-[900px]:flex">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-lg bg-transparent border border-line grid place-items-center text-ink"
        >
          <Menu size={18} strokeWidth={1.6} />
        </button>
        <div className="flex items-center gap-1.5">
          <PortioMark size={20} />
          <PortioWordmark />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden min-[901px]:flex border-r border-line bg-paper h-screen sticky top-0 flex-col overflow-hidden w-64">
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-[rgba(20,18,12,.4)] z-[100] animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-[280px] bg-paper border-r border-line z-[101] animate-slide-in flex flex-col">
            <SidebarBody onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
