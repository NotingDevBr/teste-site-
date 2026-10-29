export const ROTULOS_EVENTO = {
  inicio: 'Início da atividade',
  almoco_inicio: 'Início do almoço',
  almoco_fim: 'Retorno do almoço',
  parada_inicio: 'Parada registrada',
  parada_fim: 'Retomada da atividade',
  fim: 'Finalização da atividade',
};

export const ETAPAS_FOTO = [
  { valor: 'inicio', rotulo: 'Início' },
  { valor: 'execucao', rotulo: 'Execução' },
  { valor: 'parada', rotulo: 'Parada' },
  { valor: 'ocorrencia', rotulo: 'Ocorrência' },
  { valor: 'conclusao', rotulo: 'Conclusão' },
];

export const MOTIVOS_PARADA = [
  'Chuva / condições climáticas',
  'Falta de material',
  'Falha de equipamento',
  'Aguardando liberação de frente',
  'Intervalo autorizado',
  'Segurança do trabalho',
  'Outro motivo',
];

export function formatarHora(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatarData(valor) {
  if (!valor) return '—';
  const iso = String(valor).length === 10 ? `${valor}T12:00:00` : valor;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

export function formatarDataHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('pt-BR')} às ${formatarHora(iso)}`;
}

export function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function formatarDuracao(ms) {
  if (!ms || ms < 0) return '0h 00min';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

export function paraInputLocal(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`;
}

export function deInputLocal(valor) {
  if (!valor) return new Date().toISOString();
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function ordenarEventos(eventos = []) {
  return [...eventos].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function estadoJornada(eventos = []) {
  const evs = ordenarEventos(eventos);
  let estado = 'sem_jornada';
  for (const e of evs) {
    if (e.tipo === 'inicio') estado = 'trabalhando';
    else if (e.tipo === 'almoco_inicio') estado = 'almoco';
    else if (e.tipo === 'almoco_fim') estado = 'trabalhando';
    else if (e.tipo === 'parada_inicio') estado = 'parada';
    else if (e.tipo === 'parada_fim') estado = 'trabalhando';
    else if (e.tipo === 'fim') estado = 'finalizada';
  }
  return estado;
}

export const ROTULOS_ESTADO = {
  sem_jornada: 'Sem atividade',
  trabalhando: 'Em execução',
  almoco: 'Em almoço',
  parada: 'Parada em andamento',
  finalizada: 'Atividade finalizada',
};

export function calcularTotais(eventos = []) {
  const evs = ordenarEventos(eventos);
  const agora = Date.now();
  let inicio = null;
  let fim = null;
  let almoco = 0;
  let paradas = 0;
  let almocoAberto = null;
  let paradaAberta = null;

  for (const e of evs) {
    const t = new Date(e.at).getTime();
    if (Number.isNaN(t)) continue;
    if (e.tipo === 'inicio' && inicio === null) inicio = t;
    else if (e.tipo === 'almoco_inicio') almocoAberto = t;
    else if (e.tipo === 'almoco_fim' && almocoAberto !== null) {
      almoco += Math.max(0, t - almocoAberto);
      almocoAberto = null;
    } else if (e.tipo === 'parada_inicio') paradaAberta = t;
    else if (e.tipo === 'parada_fim' && paradaAberta !== null) {
      paradas += Math.max(0, t - paradaAberta);
      paradaAberta = null;
    } else if (e.tipo === 'fim') fim = t;
  }

  const referencia = fim ?? agora;
  if (almocoAberto !== null) almoco += Math.max(0, referencia - almocoAberto);
  if (paradaAberta !== null) paradas += Math.max(0, referencia - paradaAberta);

  const total = inicio ? Math.max(0, referencia - inicio) : 0;
  const liquido = Math.max(0, total - almoco - paradas);

  return {
    inicio_ts: inicio,
    fim_ts: fim,
    total_ms: total,
    almoco_ms: almoco,
    paradas_ms: paradas,
    liquido_ms: liquido,
    almoco_aberto: almocoAberto !== null,
    parada_aberta: paradaAberta !== null,
  };
}

export function descreverEventos(eventos = []) {
  const evs = ordenarEventos(eventos);
  const linhas = [];
  let paradaAberta = null;
  let almocoAberto = null;

  for (const e of evs) {
    const linha = {
      id: e.id,
      tipo: e.tipo,
      at: e.at,
      manual: !!e.manual,
      justificativa: e.justificativa || '',
      original_at: e.original_at || null,
      detalhe: '',
      duracao_ms: null,
    };

    if (e.tipo === 'parada_inicio') {
      paradaAberta = new Date(e.at).getTime();
      linha.detalhe = [e.motivo, e.descricao].filter(Boolean).join(' — ');
    } else if (e.tipo === 'parada_fim') {
      if (paradaAberta !== null) {
        linha.duracao_ms = Math.max(0, new Date(e.at).getTime() - paradaAberta);
        paradaAberta = null;
      }
    } else if (e.tipo === 'almoco_inicio') {
      almocoAberto = new Date(e.at).getTime();
      linha.detalhe = 'Saída para o intervalo de almoço';
    } else if (e.tipo === 'almoco_fim') {
      if (almocoAberto !== null) {
        linha.duracao_ms = Math.max(0, new Date(e.at).getTime() - almocoAberto);
        almocoAberto = null;
      }
      linha.detalhe = 'Retorno do intervalo de almoço';
    } else if (e.tipo === 'inicio') {
      linha.detalhe = 'Atividade iniciada em campo';
    } else if (e.tipo === 'fim') {
      linha.detalhe = e.descricao || 'Atividade encerrada';
    }

    linhas.push(linha);
  }
  return linhas;
}

export function pendenciasDoRelatorio(relatorio, totalFotos = 0) {
  const pendencias = [];
  if (!relatorio) return pendencias;
  const estado = estadoJornada(relatorio.eventos);
  const totais = calcularTotais(relatorio.eventos);

  if (!relatorio.frente) pendencias.push('Frente de serviço não informada');
  if (!relatorio.area) pendencias.push('Área de execução não informada');
  if (!relatorio.atividade) pendencias.push('Atividade realizada não informada');
  if (!relatorio.funcionarios || relatorio.funcionarios.length === 0)
    pendencias.push('Nenhum funcionário vinculado à equipe');
  if (estado === 'almoco') pendencias.push('Retorno do almoço não registrado');
  if (estado === 'parada') pendencias.push('Retomada após parada não registrada');
  if (!totais.fim_ts) pendencias.push('Horário de finalização não registrado');
  if (totalFotos === 0) pendencias.push('Nenhuma fotografia registrada');
  return pendencias;
}