import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileKey2,
  Users,
  Calendar,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/licenses', icon: FileKey2, label: '许可证管理' },
  { to: '/allocations', icon: Users, label: '授权分配' },
  { to: '/calendar', icon: Calendar, label: '到期日历' },
  { to: '/reports', icon: BarChart3, label: '统计报表' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-brand-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-brand-800">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">LicenseHub</div>
          <div className="text-xs text-brand-300">软件授权管理</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-700 text-white shadow-inner'
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white',
              )
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-brand-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-semibold">
            管
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">IT管理员</div>
            <div className="text-xs text-brand-300 truncate">admin@company.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
