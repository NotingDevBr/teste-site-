import React from 'react';
import { AlertTriangle, PackageMinus, PackagePlus } from 'lucide-react';

export default function ListaMateriais({ materiais, onRetirar, onRepor }) {
  if (!materiais.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
        <p className="text-sm text-slate-500">
          Nenhum material cadastrado. Use “Novo material” para montar o estoque da obra.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {materiais.map((material) => {
        const saldo = Number(material.saldo || 0);
        const minimo = Number(material.minimo || 0);
        const baixo = minimo > 0 && saldo <= minimo;
        return (
          <div
            key={material.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{material.nome}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                {baixo ? (
                  <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                    <AlertTriangle className="h-3 w-3" /> estoque baixo
                  </span>
                ) : (
                  <span>disponível para retirada</span>
                )}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-display text-lg font-semibold leading-none text-[#0B203B] tabular-nums">
                {saldo.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                {material.unidade || 'un'}
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
              <button
                type="button"
                onClick={() => onRepor(material)}
                title="Repor estoque"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0B203B]"
              >
                <PackagePlus className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={saldo <= 0}
                onClick={() => onRetirar(material)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B203B] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12314f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PackageMinus className="h-3.5 w-3.5" /> Retirar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}