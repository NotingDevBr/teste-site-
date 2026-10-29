import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatarDataHora } from '@/lib/formato';

const ROTULOS = {
  retirada: 'Retirada',
  devolucao: 'Devolução',
  entrada: 'Reposição',
};

export default function HistoricoMovimentos({ movimentos }) {
  if (!movimentos.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
        <p className="text-sm text-slate-500">
          Nenhuma movimentação registrada ainda. Ao retirar um material, a baixa aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {movimentos.map((movimento) => {
        const entrada = movimento.acao !== 'retirada';
        return (
          <div
            key={movimento.id}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                entrada ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {entrada ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {movimento.item_nome}
                <span className="ml-1.5 font-normal text-slate-400">
                  {Number(movimento.quantidade || 0).toLocaleString('pt-BR', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  {movimento.unidade || 'un'}
                </span>
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {[
                  ROTULOS[movimento.acao] || movimento.acao,
                  movimento.lider,
                  movimento.frente,
                  movimento.relatorio_numero,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <p className="shrink-0 text-right text-[10px] text-slate-400">
              {formatarDataHora(movimento.at)}
            </p>
          </div>
        );
      })}
    </div>
  );
}