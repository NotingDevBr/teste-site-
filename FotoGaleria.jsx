import React from 'react';
import { Trash2 } from 'lucide-react';
import { ETAPAS_FOTO, formatarHora } from '@/lib/formato';

function rotuloEtapa(valor) {
  return (ETAPAS_FOTO.find((e) => e.valor === valor) || {}).rotulo || 'Registro';
}

export default function FotoGaleria({ fotos = [], editavel = false, onLegenda, onExcluir }) {
  if (!fotos.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
        Nenhuma fotografia registrada.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {fotos.map((foto) => (
        <figure
          key={foto.id}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative aspect-[4/3] bg-slate-100">
            <img
              src={foto.dataUrl}
              alt={foto.legenda || rotuloEtapa(foto.etapa)}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute left-1.5 top-1.5 rounded-md bg-[#0B203B]/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              {rotuloEtapa(foto.etapa)}
            </span>
            {editavel && onExcluir && (
              <button
                type="button"
                onClick={() => onExcluir(foto)}
                className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                title="Excluir foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <figcaption className="space-y-1 p-2">
            {editavel && onLegenda ? (
              <input
                value={foto.legenda || ''}
                onChange={(e) => onLegenda(foto, e.target.value)}
                placeholder="Legenda da foto"
                className="w-full rounded-md border border-transparent bg-slate-50 px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
              />
            ) : (
              <p className="line-clamp-2 text-[11px] leading-snug text-slate-600">
                {foto.legenda || 'Sem legenda'}
              </p>
            )}
            <p className="text-[10px] text-slate-400">{formatarHora(foto.at)}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}