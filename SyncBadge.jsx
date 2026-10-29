import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppProvider';

export default function SyncBadge() {
  const { online, sincronizando, pendentes, sincronizarAgora } = useApp();

  return (
    <button
      type="button"
      onClick={sincronizarAgora}
      title="Sincronizar registros"
      className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90 transition-colors hover:bg-white/20"
    >
      {sincronizando ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : online ? (
        <Wifi className="h-3.5 w-3.5 text-emerald-300" />
      ) : (
        <WifiOff className="h-3.5 w-3.5 text-amber-300" />
      )}
      <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
      {pendentes > 0 && (
        <span className="rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-[#0B203B]">
          {pendentes}
        </span>
      )}
    </button>
  );
}