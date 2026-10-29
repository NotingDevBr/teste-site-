import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { list } from '@/lib/idb';
import { calcularTotais, formatarData, formatarDuracao, ROTULOS_ESTADO } from '@/lib/formato';

const FILTROS_VAZIOS = { data: '', frente: '', area: '', atividade: '', lider: '', equipe: '' };

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    (async () => {
      const todos = await list('relatorios');
      setRelatorios(
        todos.sort((a, b) => {
          const porData = String(b.data || '').localeCompare(String(a.data || ''));
          if (porData !== 0) return porData;
          return String(b.criado_em || '').localeCompare(String(a.criado_em || ''));
        }),
      );
      setCarregando(false);
    })();
  }, []);

  const valoresUnicos = (campo) =>
    [...new Set(relatorios.map((r) => r[campo]).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), 'pt-BR'),
    );

  const filtrados = useMemo(
    () =>
      relatorios.filter((r) => {
        if (filtros.data && r.data !== filtros.data) return false;
        if (filtros.frente && r.frente !== filtros.frente) return false;
        if (filtros.area && r.area !== filtros.area) return false;
        if (filtros.atividade && r.atividade !== filtros.atividade) return false;
        if (filtros.equipe && String(r.equipe || '') !== filtros.equipe) return false;
        if (
          filtros.lider &&
          !String(r.lider || '')
            .toLowerCase()
            .includes(filtros.lider.toLowerCase())
        )
          return false;
        return true;
      }),
    [relatorios, filtros],
  );

  const ativos = Object.values(filtros).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[#0B203B]">
            Relatórios
          </h1>
          <p className="text-sm text-slate-500">
            Consulte registros anteriores, visualize fotos e baixe novamente o PDF.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setMostrarFiltros((v) => !v)}
          className="rounded-xl"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtros{ativos ? ` (${ativos})` : ''}
        </Button>
      </div>

      {mostrarFiltros && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Data
              </label>
              <Input
                type="date"
                value={filtros.data}
                onChange={(e) => setFiltros((f) => ({ ...f, data: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Frente de serviço
              </label>
              <select
                value={filtros.frente}
                onChange={(e) => setFiltros((f) => ({ ...f, frente: e.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Todas</option>
                {valoresUnicos('frente').map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Área
              </label>
              <select
                value={filtros.area}
                onChange={(e) => setFiltros((f) => ({ ...f, area: e.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Todas</option>
                {valoresUnicos('area').map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Atividade
              </label>
              <select
                value={filtros.atividade}
                onChange={(e) => setFiltros((f) => ({ ...f, atividade: e.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Todas</option>
                {valoresUnicos('atividade').map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Líder
              </label>
              <Input
                value={filtros.lider}
                onChange={(e) => setFiltros((f) => ({ ...f, lider: e.target.value }))}
                placeholder="Nome do líder"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Equipe
              </label>
              <select
                value={filtros.equipe}
                onChange={(e) => setFiltros((f) => ({ ...f, equipe: e.target.value }))}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Todas</option>
                {valoresUnicos('equipe').map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {ativos > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFiltros(FILTROS_VAZIOS)}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Limpar filtros
            </Button>
          )}
        </section>
      )}

      {carregando && (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-400">
          Carregando relatórios...
        </p>
      )}

      {!carregando && filtrados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            Nenhum relatório encontrado com os filtros atuais.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {filtrados.map((relatorio) => {
          const totais = calcularTotais(relatorio.eventos);
          const emAndamento = relatorio.status === 'em_andamento';
          return (
            <Link
              key={relatorio.id}
              to={`/relatorios/${relatorio.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-[#0B203B]/30 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {relatorio.numero}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      emAndamento
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {emAndamento ? ROTULOS_ESTADO.trabalhando : 'Finalizado'}
                  </span>
                  {(relatorio.versao || 1) > 1 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      v{relatorio.versao}
                    </span>
                  )}
                  {relatorio.synced_at ? (
                    <span className="text-[10px] text-slate-400">sincronizado</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      pendente
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-[#0B203B]">
                  {relatorio.frente || 'Frente de serviço'}
                  {relatorio.area ? ` · ${relatorio.area}` : ''}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {formatarData(relatorio.data)} · {relatorio.lider} ·{' '}
                  {relatorio.atividade || 'Atividade não informada'}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-display text-sm font-semibold tabular-nums text-[#0B203B]">
                  {formatarDuracao(totais.liquido_ms)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">líquido</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}