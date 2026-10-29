const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { list, put } from '@/lib/idb';
import { dataUrlParaArquivo } from '@/lib/imagem';
import { calcularTotais } from '@/lib/formato';

const CATALOGOS = [
  { colecao: 'frentes', cliente: () => db.entities.FrenteServico },
  { colecao: 'areas', cliente: () => db.entities.AreaServico },
  { colecao: 'atividades', cliente: () => db.entities.AtividadeServico },
  { colecao: 'equipes', cliente: () => db.entities.Equipe },
  { colecao: 'funcionarios', cliente: () => db.entities.Funcionario },
  { colecao: 'materiais', cliente: () => db.entities.Material },
  { colecao: 'equipamentos', cliente: () => db.entities.Equipamento },
];

async function enviarCatalogo(item, cliente) {
  const payload = {
    ...(item.nome ? { nome: item.nome } : {}),
    ...(item.matricula !== undefined ? { matricula: item.matricula } : {}),
    ...(item.cargo !== undefined ? { cargo: item.cargo } : {}),
    ...(item.equipe !== undefined ? { equipe: item.equipe } : {}),
    ...(item.ativo !== undefined ? { ativo: item.ativo } : {}),
    ...(item.unidade !== undefined ? { unidade: item.unidade } : {}),
    ...(item.saldo !== undefined ? { saldo: Number(item.saldo) || 0 } : {}),
    ...(item.minimo !== undefined ? { minimo: Number(item.minimo) || 0 } : {}),
    ...(item.tipo !== undefined ? { tipo: item.tipo } : {}),
    ...(item.identificacao !== undefined ? { identificacao: item.identificacao } : {}),
    ...(item.status !== undefined ? { status: item.status } : {}),
    ...(item.em_uso_por !== undefined ? { em_uso_por: item.em_uso_por } : {}),
    lider: item.lider || '',
    device_id: item.device_id || '',
    local_id: item.id,
  };
  if (item.remote_id) {
    return cliente.update(item.remote_id, payload);
  }
  return cliente.create(payload);
}

async function enviarFotos(relatorio) {
  const fotos = relatorio.fotos || [];
  const enviadas = [];
  const atualizadas = [];
  for (const foto of fotos) {
    let fileUri = foto.file_uri;
    if (!fileUri && foto.dataUrl) {
      try {
        const arquivo = dataUrlParaArquivo(foto.dataUrl, `${foto.id}.jpg`);
        const resposta = await db.integrations.Core.UploadPrivateFile({ file: arquivo });
        fileUri = resposta.file_uri;
      } catch {
        fileUri = null;
      }
    }
    atualizadas.push({ ...foto, ...(fileUri ? { file_uri: fileUri } : {}) });
    enviadas.push({
      etapa: foto.etapa || '',
      legenda: foto.legenda || '',
      at: foto.at || '',
      ...(fileUri ? { file_uri: fileUri } : {}),
    });
  }
  return { enviadas, atualizadas };
}

export async function sincronizar({ lider, deviceId }) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Sem conexão com a internet.');
  }

  const erros = [];

  for (const { colecao, cliente } of CATALOGOS) {
    const itens = (await list(colecao)).filter((i) => !i.synced_at);
    for (const item of itens) {
      try {
        const salvo = await enviarCatalogo(item, cliente());
        await put(colecao, {
          ...item,
          remote_id: salvo.id,
          synced_at: new Date().toISOString(),
        });
      } catch (erro) {
        erros.push(`${colecao}: ${erro?.message || 'falha no envio'}`);
      }
    }
  }

  const movimentos = (await list('movimentos')).filter((m) => !m.synced_at);
  for (const movimento of movimentos) {
    try {
      const payload = {
        tipo_item: movimento.tipo_item,
        item_nome: movimento.item_nome,
        acao: movimento.acao,
        quantidade: Number(movimento.quantidade || 0),
        unidade: movimento.unidade || '',
        relatorio_numero: movimento.relatorio_numero || '',
        frente: movimento.frente || '',
        lider: movimento.lider || lider,
        device_id: movimento.device_id || deviceId,
        at: movimento.at || '',
        local_id: movimento.id,
      };
      const salvo = movimento.remote_id
        ? await db.entities.Movimento.update(movimento.remote_id, payload)
        : await db.entities.Movimento.create(payload);
      await put('movimentos', {
        ...movimento,
        remote_id: salvo.id,
        synced_at: new Date().toISOString(),
      });
    } catch (erro) {
      erros.push(`movimento ${movimento.item_nome}: ${erro?.message || 'falha no envio'}`);
    }
  }

  // Envia também as atividades em andamento para o gestor acompanhar em tempo real.
  const TOLERANCIA_MS = 2000;
  const relatorios = (await list('relatorios')).filter(
    (r) =>
      !r.synced_at ||
      new Date(r.atualizado_em || 0).getTime() - new Date(r.synced_at).getTime() > TOLERANCIA_MS,
  );

  for (const relatorio of relatorios) {
    try {
      const { enviadas: fotos, atualizadas: fotosAtualizadas } = await enviarFotos(relatorio);
      const totais = calcularTotais(relatorio.eventos);
      const payload = {
        numero: relatorio.numero,
        data: relatorio.data,
        lider: relatorio.lider || lider,
        device_id: relatorio.device_id || deviceId,
        status: relatorio.status,
        frente: relatorio.frente || '',
        area: relatorio.area || '',
        atividade: relatorio.atividade || '',
        encarregado: relatorio.encarregado || '',
        equipe: relatorio.equipe || '',
        local: relatorio.local || '',
        observacoes: relatorio.observacoes || '',
        funcionarios: (relatorio.funcionarios || []).map((f) => ({
          nome: f.nome || '',
          matricula: f.matricula || '',
          cargo: f.cargo || '',
        })),
        eventos: (relatorio.eventos || []).map((e) => ({
          tipo: e.tipo,
          at: e.at,
          motivo: e.motivo || '',
          descricao: e.descricao || '',
          manual: !!e.manual,
          original_at: e.original_at || '',
          justificativa: e.justificativa || '',
        })),
        fotos,
        materiais: (relatorio.materiais || []).map((m) => ({
          nome: m.nome || '',
          unidade: m.unidade || '',
          quantidade: Number(m.quantidade) || 0,
          at: m.at || '',
          lider: m.lider || '',
        })),
        equipamentos: (relatorio.equipamentos || []).map((e) => ({
          nome: e.nome || '',
          tipo: e.tipo || '',
          at: e.at || '',
          devolvido_at: e.devolvido_at || '',
          lider: e.lider || '',
        })),
        totais: {
          total_ms: totais.total_ms,
          almoco_ms: totais.almoco_ms,
          paradas_ms: totais.paradas_ms,
          liquido_ms: totais.liquido_ms,
        },
        versao: relatorio.versao || 1,
        historico: relatorio.historico || [],
        criado_em: relatorio.criado_em || '',
        finalizado_em: relatorio.finalizado_em || '',
        local_id: relatorio.id,
      };

      const salvo = relatorio.remote_id
        ? await db.entities.RelatorioDia.update(relatorio.remote_id, payload)
        : await db.entities.RelatorioDia.create(payload);

      await put('relatorios', {
        ...relatorio,
        fotos: fotosAtualizadas,
        remote_id: salvo.id,
        synced_at: new Date().toISOString(),
      });
    } catch (erro) {
      erros.push(`${relatorio.numero}: ${erro?.message || 'falha no envio'}`);
    }
  }

  return { erros };
}