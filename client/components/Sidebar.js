'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/warehouses', label: 'Warehouses', icon: '🏭' },
  { href: '/receipts', label: 'Receipts', icon: '📥' },
  { href: '/deliveries', label: 'Deliveries', icon: '📤' },
  { href: '/transfers', label: 'Transfers', icon: '↔️' },
  { href: '/adjustments', label: 'Adjustments', icon: '⚖️' },
  { href: '/movements', label: 'Movement History', icon: '📋' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-900/95 flex flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
        <span className="text-xl font-bold text-sky-400">CoreInventory</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {nav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === href ? 'bg-sky-600/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-1 text-xs text-slate-400 hover:text-red-400"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
