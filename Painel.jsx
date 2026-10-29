import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Coffee,
  Undo2,
  CheckCircle2,
  Sunset,
  Camera,
  FileText,
  Users,
  Layers,
  RotateCcw,
  ChevronRight,
  RefreshCw,
  Clock,
  Images,
  Package,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import EventTimeline from '@/components/EventTimeline';
import AjustarHorarioDialog from '@/components/AjustarHorarioDialog';
import EditarEquipeDialog from '@/components/EditarEquipeDialog';
import TotaisGrid from '@/components/TotaisGrid';
import { useApp } from '@/context/AppProvider';
import {
  ROTULOS_ESTADO,
  calcularTotais,
  deInputLocal,
  descreverEventos,
  estadoJornada,
  formatarDataHora,
  formatarDuracao,
  formatarHora,
} from '@/lib/formato';

const CORES_ESTADO = {
  sem_jornada: 'bg-slate-100 text-slate-600',
  trabalhando: 'bg-emerald-100 text-emerald-700',
  almoco: 'bg-amber-100 text-amber-700',
  parada: 'bg-orange-100 text-orange-700',
  finalizada: 'bg-slate-200 text-slate-600',
};

export default function Painel() {
  const {
    lider,
    relatorio,
    fotos,
    registrarEvento,
    ajustarEvento,
    online,
    sincronizando,
    pendentes,
    ultimaSync,
    erroSync,
    sincronizarAgora,
  } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  const [eventoAjuste, setEventoAjuste] = useState(null);
  const [equipeAberta, setEquipeAberta] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const eventos = relatorio?.eventos || [];
  const estado = estadoJornada(eventos);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totais = useMemo(() => calcularTotais(eventos), [eventos, tick]);
  const linhas = useMemo(() => descreverEventos(eventos), [eventos]);

  const registrar = async (tipo, extra, mensagem) => {
    await registrarEvento(tipo, extra);
    toast({ title: mensagem });
  };

  const acoes = [
    {
      chave: 'iniciar',
      rotulo: relatorio ? 'Atividade em andamento' : 'Iniciar atividade',
      Icone: Play,
      destaque: true,
      desabilitado: !!relatorio,
      aoClicar: () => navigate('/iniciar'),
    },
    {
      chave: 'parada',
      rotulo: estado === 'parada' ? 'Retomar atividade' : 'Registrar parada',
      Icone: estado === 'parada' ? RotateCcw : Pause,
      desabilitado: !(estado === 'trabalhando' || estado === 'parada'),
      aoClicar: () =>
        estado === 'parada'
          ? registrar('parada_fim', {}, 'Atividade retomada')
          : navigate('/parada'),
    },
    {
      chave: 'almoco',
      rotulo: 'Iniciar almoço',
      Icone: Coffee,
      desabilitado: estado !== 'trabalhando',
      aoClicar: () => registrar('almoco_inicio', {}, 'Almoço iniciado'),
    },
    {
      chave: 'retorno',
      rotulo: 'Retornar do almoço',
      Icone: Undo2,
      desabilitado: estado !== 'almoco',
      aoClicar: () => registrar('almoco_fim', {}, 'Retorno do almoço registrado'),
    },
    {
      chave: 'finalizar',
      rotulo: 'Finalizar atividade',
      Icone: CheckCircle2,
      desabilitado: estado !== 'trabalhando',
      aoClicar: () => navigate('/finalizar'),
    },
    {
      chave: 'dia',
      rotulo: 'Finalizar dia',
      Icone: Sunset,
      desabilitado: estado === 'sem_jornada',
      aoClicar: () => navigate('/finalizar?dia=1'),
    },
    {
      chave: 'fotos',
      rotulo: 'Registrar fotos',
      Icone: Camera,
      desabilitado: !relatorio,
      aoClicar: () => navigate('/fotos'),
    },
    {
      chave: 'materiais',
      rotulo: 'Materiais e equipamentos',
      Icone: Package,
      aoClicar: () => navigate('/materiais'),
    },
    {
      chave: 'relatorios',
      rotulo: 'Consultar relatórios',
      Icone: FileText,
      aoClicar: () => navigate('/relatorios'),
    },
    {
      chave: 'gestor',
      rotulo: 'Painel do gestor',
      Icone: Gauge,
      aoClicar: () => navigate('/gestor'),
    },
    {
      chave: 'funcionarios',
      rotulo: 'Cadastrar funcionários',
      Icone: Users,
      aoClicar: () => navigate('/funcionarios'),
    },
    {
      chave: 'frentes',
      rotulo: 'Gerenciar frentes',
      Icone: Layers,
      aoClicar: () => navigate('/cadastros'),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-[#0B203B]">
            Painel operacional
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Líder: <span className="font-medium text-slate-700">{lider}</span>
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
            CORES_ESTADO[estado]
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {ROTULOS_ESTADO[estado]}
        </span>
      </div>

      {relatorio ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#0B203B] px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                  Relatório {relatorio.numero}
                </p>
                <h2 className="font-display mt-1 truncate text-lg font-semibold">
                  {relatorio.frente || 'Frente de serviço'}
                </h2>
                <p className="mt-0.5 truncate text-xs text-white/60">
                  {[relatorio.area, relatorio.atividade].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <Clock className="h-5 w-5 shrink-0 text-white/30" />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-3xl font-semibold tabular-nums leading-none">
                  {formatarDuracao(totais.liquido_ms)}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/50">
                  tempo líquido de execução
                </p>
              </div>
              <div className="text-right text-[11px] text-white/60">
                <p>Início {formatarHora(eventos[0]?.at)}</p>
                {totais.fim_ts && <p>Fim {formatarHora(new Date(totais.fim_ts).toISOString())}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            <TotaisGrid totais={totais} />

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {relatorio.funcionarios?.length || 0} funcionário(s)
              </span>
              {relatorio.equipe && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">Equipe {relatorio.equipe}</span>
              )}
              <button
                type="button"
                onClick={() => setEquipeAberta(true)}
                className="rounded-full bg-[#0B203B]/5 px-2.5 py-1 font-medium text-[#0B203B] hover:bg-[#0B203B]/10"
              >
                Ajustar equipe
              </button>
              <Link
                to="/fotos"
                className="inline-flex items-center gap-1 rounded-full bg-[#0B203B]/5 px-2.5 py-1 font-medium text-[#0B203B] hover:bg-[#0B203B]/10"
              >
                <Images className="h-3 w-3" /> {fotos.length} foto(s)
              </Link>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Linha do tempo
                </h3>
                <Link
                  to={`/relatorios/${relatorio.id}`}
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-[#0B203B] hover:underline"
                >
                  Abrir relatório <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <EventTimeline linhas={linhas} aoAjustar={setEventoAjuste} />
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
          <p className="font-display text-base font-semibold text-[#0B203B]">
            Nenhuma atividade em andamento
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Selecione a frente de serviço, a área e a atividade para registrar o início da jornada.
          </p>
          <Button
            onClick={() => navigate('/iniciar')}
            className="mt-4 h-12 rounded-xl bg-[#0B203B] px-6 font-semibold hover:bg-[#12314f]"
          >
            <Play className="mr-2 h-4 w-4" /> Iniciar atividade
          </Button>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {acoes.map((acao) => (
            <button
              key={acao.chave}
              type="button"
              onClick={acao.aoClicar}
              disabled={acao.desabilitado}
              className={`group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                acao.destaque && !acao.desabilitado
                  ? 'col-span-2 border-[#0B203B] bg-[#0B203B] text-white shadow-md hover:bg-[#12314f]'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-[#0B203B]/30 hover:shadow-md'
              } ${acao.desabilitado ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  acao.destaque && !acao.desabilitado
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-100 text-[#0B203B] group-hover:bg-[#0B203B]/10'
                }`}
              >
                <acao.Icone className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold leading-tight">{acao.rotulo}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0B203B]">Sincronização</p>
            <p className="text-xs text-slate-500">
              {online ? 'Conectado à internet' : 'Sem conexão — registros salvos no aparelho'} ·{' '}
              {pendentes > 0
                ? `${pendentes} registro(s) pendente(s)`
                : 'tudo sincronizado'}
            </p>
            {ultimaSync && (
              <p className="text-[11px] text-slate-400">
                Última sincronização: {formatarDataHora(ultimaSync)}
              </p>
            )}
            {erroSync && <p className="text-[11px] font-medium text-red-600">{erroSync}</p>}
          </div>
          <Button
            variant="outline"
            onClick={sincronizarAgora}
            disabled={sincronizando || !online}
            className="rounded-xl"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
            Sincronizar agora
          </Button>
        </div>
      </section>

      <AjustarHorarioDialog
        aberto={!!eventoAjuste}
        linha={eventoAjuste}
        onFechar={() => setEventoAjuste(null)}
        onSalvar={(valor, justificativa) => {
          ajustarEvento(eventoAjuste.id, deInputLocal(valor), justificativa);
          toast({ title: 'Horário corrigido com justificativa registrada' });
        }}
      />

      <EditarEquipeDialog aberto={equipeAberta} onFechar={() => setEquipeAberta(false)} />
    </div>
  );
}