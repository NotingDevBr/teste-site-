import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, list, put, remove, uid } from '@/lib/idb';
import { getDeviceId, getLider, salvarLider } from '@/lib/device';
import { calcularTotais, hojeISO } from '@/lib/formato';
import { comprimirImagem } from '@/lib/imagem';
import { sincronizar } from '@/lib/sync';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const COLECOES_CATALOGO = [
  'frentes',
  'areas',
  'atividades',
  'equipes',
  'funcionarios',
  'materiais',
  'equipamentos',
];

export function AppProvider({ children }) {
  const [lider, setLider] = useState(() => getLider());
  const [deviceId] = useState(() => getDeviceId());
  const [pronto, setPronto] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [catalogos, setCatalogos] = useState({
    frentes: [],
    areas: [],
    atividades: [],
    equipes: [],
    funcionarios: [],
    materiais: [],
    equipamentos: [],
  });
  const [movimentos, setMovimentos] = useState([]);
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(() => {
    try {
      return localStorage.getItem('fp.ultimaSync') || null;
    } catch {
      return null;
    }
  });
  const [erroSync, setErroSync] = useState(null);
  const [pendentes, setPendentes] = useState(0);

  const carregarCatalogos = useCallback(async () => {
    const [frentes, areas, atividades, equipes, funcionarios, materiais, equipamentos] =
      await Promise.all(COLECOES_CATALOGO.map((c) => list(c)));
    setCatalogos({
      frentes,
      areas,
      atividades,
      equipes,
      funcionarios,
      materiais,
      equipamentos,
    });
  }, []);

  const carregarMovimentos = useCallback(async () => {
    const registros = await list('movimentos');
    setMovimentos(
      registros.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 80),
    );
  }, []);

  const carregarFotos = useCallback(async (relatorioId) => {
    if (!relatorioId) return [];
    const registro = await get(relatorioId);
    return (registro?.fotos || [])
      .slice()
      .sort((a, b) => new Date(a.at) - new Date(b.at));
  }, []);

  const carregarAtivo = useCallback(async () => {
    const relatorios = await list('relatorios');
    const ativo =
      relatorios
        .filter((r) => r.status === 'em_andamento')
        .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))[0] || null;
    setRelatorio(ativo);
    setFotos(ativo ? await carregarFotos(ativo.id) : []);
    return ativo;
  }, [carregarFotos]);

  const contarPendentes = useCallback(async () => {
    const catalogosList = await Promise.all(COLECOES_CATALOGO.map((c) => list(c)));
    const pendentesCatalogo = catalogosList.flat().filter((i) => !i.synced_at).length;
    const relatorios = await list('relatorios');
    const pendentesRelatorios = relatorios.filter(
      (r) => r.status === 'finalizado' && !r.synced_at,
    ).length;
    const pendentesMovimentos = (await list('movimentos')).filter((m) => !m.synced_at).length;
    setPendentes(pendentesCatalogo + pendentesRelatorios + pendentesMovimentos);
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      await Promise.all([
        carregarCatalogos(),
        carregarAtivo(),
        contarPendentes(),
        carregarMovimentos(),
      ]);
      if (ativo) setPronto(true);
    })();
    return () => {
      ativo = false;
    };
  }, [carregarCatalogos, carregarAtivo, contarPendentes, carregarMovimentos]);

  const sincronizarAgora = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErroSync('Sem conexão — os registros continuam salvos no aparelho.');
      return;
    }
    setSincronizando(true);
    setErroSync(null);
    try {
      const { erros } = await sincronizar({ lider, deviceId });
      if (erros.length) {
        setErroSync(`${erros.length} registro(s) não puderam ser enviados.`);
      } else {
        const agora = new Date().toISOString();
        setUltimaSync(agora);
        try {
          localStorage.setItem('fp.ultimaSync', agora);
        } catch {
          /* ignora */
        }
      }
      await contarPendentes();
    } catch (erro) {
      setErroSync(erro?.message || 'Falha ao sincronizar.');
    } finally {
      setSincronizando(false);
    }
  }, [lider, deviceId, contarPendentes]);

  useEffect(() => {
    const aoVoltarOnline = () => {
      setOnline(true);
      sincronizarAgora();
    };
    const aoFicarOffline = () => setOnline(false);
    window.addEventListener('online', aoVoltarOnline);
    window.addEventListener('offline', aoFicarOffline);
    return () => {
      window.removeEventListener('online', aoVoltarOnline);
      window.removeEventListener('offline', aoFicarOffline);
    };
  }, [sincronizarAgora]);

  useEffect(() => {
    if (pronto && lider && online) sincronizarAgora();
  }, [pronto, lider, online, sincronizarAgora]);

  // Mantém o painel do gestor atualizado em tempo real enquanto a atividade corre.
  useEffect(() => {
    if (!pronto || !lider) return undefined;
    const timer = setInterval(() => {
      if (navigator.onLine) sincronizarAgora();
    }, 60000);
    return () => clearInterval(timer);
  }, [pronto, lider, sincronizarAgora]);

  const definirLider = useCallback((nome) => {
    setLider(salvarLider(nome));
  }, []);

  const garantirCatalogo = useCallback(
    async (colecao, nome) => {
      const limpo = (nome || '').trim();
      if (!limpo) return;
      const itens = await list(colecao);
      const existe = itens.some((i) => (i.nome || '').toLowerCase() === limpo.toLowerCase());
      if (!existe) {
        await put(colecao, { nome: limpo, ativo: true, lider, device_id: deviceId });
      }
    },
    [lider, deviceId],
  );

  const iniciarAtividade = useCallback(
    async (dados) => {
      const data = hojeISO();
      const existentes = (await list('relatorios')).filter((r) => r.data === data);
      const sequencia = String(existentes.length + 1).padStart(2, '0');
      const novo = {
        id: uid(),
        numero: `REL-${data.replace(/-/g, '')}-${sequencia}`,
        data,
        lider,
        device_id: deviceId,
        status: 'em_andamento',
        criado_em: new Date().toISOString(),
        frente: (dados.frente || '').trim(),
        area: (dados.area || '').trim(),
        atividade: (dados.atividade || '').trim(),
        encarregado: (dados.encarregado || lider).trim(),
        equipe: (dados.equipe || '').trim(),
        local: (dados.local || '').trim(),
        observacoes: dados.observacoes || '',
        funcionarios: dados.funcionarios || [],
        eventos: [{ id: uid(), tipo: 'inicio', at: new Date().toISOString() }],
        versao: 1,
        historico: [],
      };
      await put('relatorios', novo);
      await Promise.all([
        garantirCatalogo('frentes', novo.frente),
        garantirCatalogo('areas', novo.area),
        garantirCatalogo('atividades', novo.atividade),
        garantirCatalogo('equipes', novo.equipe),
      ]);
      await carregarCatalogos();
      setRelatorio(novo);
      setFotos([]);
      await contarPendentes();
      return novo;
    },
    [lider, deviceId, garantirCatalogo, carregarCatalogos, contarPendentes],
  );

  // Sempre parte da versão gravada no aparelho, para não perder fotos registradas.
  const relatorioAtual = useCallback(async () => {
    if (!relatorio?.id) return null;
    return (await get(relatorio.id)) || relatorio;
  }, [relatorio]);

  const salvarRelatorio = useCallback(
    async (patch) => {
      const atual = await relatorioAtual();
      if (!atual) return null;
      const registro = await put('relatorios', { ...atual, ...patch });
      setRelatorio(registro);
      return registro;
    },
    [relatorioAtual],
  );

  const registrarEvento = useCallback(
    async (tipo, extra = {}) => {
      const atual = await relatorioAtual();
      if (!atual) return null;
      const evento = { id: uid(), tipo, at: new Date().toISOString(), ...extra };
      const atualizado = {
        ...atual,
        eventos: [...(atual.eventos || []), evento],
      };
      await put('relatorios', atualizado);
      setRelatorio(atualizado);
      return evento;
    },
    [relatorioAtual],
  );

  const ajustarEvento = useCallback(
    async (eventoId, novoHorarioISO, justificativa) => {
      const atual = await relatorioAtual();
      if (!atual) return;
      const eventos = (atual.eventos || []).map((e) =>
        e.id === eventoId
          ? {
              ...e,
              at: novoHorarioISO,
              manual: true,
              original_at: e.original_at || e.at,
              justificativa,
            }
          : e,
      );
      const atualizado = { ...atual, eventos };
      await put('relatorios', atualizado);
      setRelatorio(atualizado);
    },
    [relatorioAtual],
  );

  const adicionarFotosProcessadas = useCallback(
    async (itens, etapa = 'execucao', legenda = '', relatorioId = null) => {
      const alvo = relatorioId || relatorio?.id;
      if (!alvo || !itens.length) return [];
      const salvas = itens.map((item) => ({
        id: uid(),
        relatorio_id: alvo,
        etapa: item.etapa || etapa,
        legenda: item.legenda ?? legenda,
        at: new Date().toISOString(),
        lider,
        dataUrl: item.dataUrl,
        largura: item.largura,
        altura: item.altura,
      }));

      // As fotos ficam gravadas dentro do próprio relatório, junto dos demais dados.
      const registro = await get(alvo);
      if (registro) {
        const atualizado = { ...registro, fotos: [...(registro.fotos || []), ...salvas] };
        await put('relatorios', atualizado);
        if (relatorio?.id === alvo) setRelatorio(atualizado);
      }

      setFotos((anteriores) => [...anteriores, ...salvas]);
      return salvas;
    },
    [relatorio, lider],
  );

  const adicionarArquivos = useCallback(
    async (arquivos, etapa, legenda, relatorioId = null) => {
      const processadas = [];
      for (const arquivo of arquivos) {
        try {
          processadas.push(await comprimirImagem(arquivo));
        } catch {
          /* arquivo inválido é ignorado */
        }
      }
      return adicionarFotosProcessadas(processadas, etapa, legenda, relatorioId);
    },
    [adicionarFotosProcessadas],
  );

  const atualizarFoto = useCallback(
    async (foto, patch) => {
      const atualizada = { ...foto, ...patch };
      const alvoId = foto.relatorio_id || relatorio?.id;
      const registro = alvoId ? await get(alvoId) : null;
      if (registro) {
        const atualizado = {
          ...registro,
          fotos: (registro.fotos || []).map((f) => (f.id === foto.id ? atualizada : f)),
        };
        await put('relatorios', atualizado);
        if (relatorio?.id === alvoId) setRelatorio(atualizado);
      }
      setFotos((anteriores) => anteriores.map((f) => (f.id === foto.id ? atualizada : f)));
    },
    [relatorio],
  );

  const excluirFoto = useCallback(
    async (fotoId) => {
      const registro = relatorio ? await get(relatorio.id) : null;
      if (registro) {
        const atualizado = {
          ...registro,
          fotos: (registro.fotos || []).filter((f) => f.id !== fotoId),
        };
        await put('relatorios', atualizado);
        setRelatorio(atualizado);
      }
      setFotos((anteriores) => anteriores.filter((f) => f.id !== fotoId));
    },
    [relatorio],
  );

  const finalizarRelatorio = useCallback(
    async (dados = {}) => {
      const atual = await relatorioAtual();
      if (!atual) return null;
      const { eventosExtra = [], ...resto } = dados;
      const eventos = [...(atual.eventos || []), ...eventosExtra];
      const totais = calcularTotais(eventos);
      const atualizado = {
        ...atual,
        ...resto,
        eventos,
        status: 'finalizado',
        finalizado_em: new Date().toISOString(),
        totais: {
          total_ms: totais.total_ms,
          almoco_ms: totais.almoco_ms,
          paradas_ms: totais.paradas_ms,
          liquido_ms: totais.liquido_ms,
        },
      };
      await put('relatorios', atualizado);
      setRelatorio(null);
      setFotos([]);
      await contarPendentes();
      if (navigator.onLine) sincronizarAgora();
      return atualizado;
    },
    [relatorioAtual, contarPendentes, sincronizarAgora],
  );

  const criarNovaVersao = useCallback(
    async (relatorioId, dados) => {
      const original = await get(relatorioId);
      if (!original) throw new Error('Relatório não encontrado.');
      const versao = (original.versao || 1) + 1;
      const base = (original.numero || '').replace(/-v\d+$/, '');
      const novaId = uid();
      const nova = {
        ...original,
        id: novaId,
        versao,
        numero: `${base}-v${versao}`,
        eventos: dados.eventos || original.eventos,
        observacoes: dados.observacoes ?? original.observacoes,
        status: 'finalizado',
        finalizado_em: new Date().toISOString(),
        historico: [
          ...(original.historico || []),
          {
            em: new Date().toISOString(),
            responsavel: lider,
            justificativa: dados.justificativa || '',
            acao: `Nova versão ${versao}`,
          },
        ],
        fotos: (original.fotos || []).map((foto) => ({ ...foto, id: uid(), relatorio_id: novaId })),
        synced_at: null,
        remote_id: null,
      };
      await put('relatorios', nova);
      await contarPendentes();
      return nova;
    },
    [lider, contarPendentes],
  );

  const salvarItem = useCallback(
    async (colecao, dados) => {
      const registro = await put(colecao, { lider, device_id: deviceId, ...dados });
      await carregarCatalogos();
      await contarPendentes();
      return registro;
    },
    [lider, deviceId, carregarCatalogos, contarPendentes],
  );

  const excluirItem = useCallback(
    async (colecao, id) => {
      await remove(id);
      await carregarCatalogos();
      await contarPendentes();
    },
    [carregarCatalogos, contarPendentes],
  );

  const registrarMovimento = useCallback(
    async (dados) => {
      const registro = await put('movimentos', {
        lider,
        device_id: deviceId,
        at: new Date().toISOString(),
        ...dados,
      });
      await carregarMovimentos();
      await contarPendentes();
      return registro;
    },
    [lider, deviceId, carregarMovimentos, contarPendentes],
  );

  // Anexa o item utilizado ao relatório em andamento (quando existe um).
  const anexarAoRelatorio = useCallback(
    async (campo, item) => {
      const atual = await relatorioAtual();
      if (!atual) return null;
      const atualizado = { ...atual, [campo]: [...(atual[campo] || []), item] };
      await put('relatorios', atualizado);
      setRelatorio(atualizado);
      return atualizado;
    },
    [relatorioAtual],
  );

  const retirarMaterial = useCallback(
    async (material, quantidade) => {
      const qtd = Number(quantidade);
      if (!material?.id || !Number.isFinite(qtd) || qtd <= 0) {
        throw new Error('Informe uma quantidade válida.');
      }
      const atual = await get(material.id);
      if (!atual) throw new Error('Material não encontrado.');
      const saldo = Number(atual.saldo || 0);
      if (qtd > saldo) {
        throw new Error(`Saldo insuficiente: restam ${saldo} ${atual.unidade || 'un'}.`);
      }
      await put('materiais', { ...atual, saldo: saldo - qtd, synced_at: null });
      const rel = await anexarAoRelatorio('materiais', {
        id: uid(),
        material_id: atual.id,
        nome: atual.nome,
        unidade: atual.unidade || 'un',
        quantidade: qtd,
        at: new Date().toISOString(),
        lider,
      });
      await registrarMovimento({
        tipo_item: 'material',
        item_id: atual.id,
        item_nome: atual.nome,
        acao: 'retirada',
        quantidade: qtd,
        unidade: atual.unidade || 'un',
        frente: rel?.frente || '',
        relatorio_numero: rel?.numero || '',
      });
      await carregarCatalogos();
      return saldo - qtd;
    },
    [anexarAoRelatorio, registrarMovimento, carregarCatalogos, lider],
  );

  const reporMaterial = useCallback(
    async (material, quantidade) => {
      const qtd = Number(quantidade);
      if (!material?.id || !Number.isFinite(qtd) || qtd <= 0) {
        throw new Error('Informe uma quantidade válida.');
      }
      const atual = await get(material.id);
      if (!atual) throw new Error('Material não encontrado.');
      const saldo = Number(atual.saldo || 0) + qtd;
      await put('materiais', { ...atual, saldo, synced_at: null });
      await registrarMovimento({
        tipo_item: 'material',
        item_id: atual.id,
        item_nome: atual.nome,
        acao: 'entrada',
        quantidade: qtd,
        unidade: atual.unidade || 'un',
        frente: relatorio?.frente || '',
        relatorio_numero: relatorio?.numero || '',
      });
      await carregarCatalogos();
      return saldo;
    },
    [registrarMovimento, carregarCatalogos, relatorio],
  );

  const usarEquipamento = useCallback(
    async (equipamento) => {
      const atual = await get(equipamento.id);
      if (!atual) throw new Error('Item não encontrado.');
      if (atual.status === 'em_uso') throw new Error('Este item já está em uso.');
      await put('equipamentos', {
        ...atual,
        status: 'em_uso',
        em_uso_por: lider,
        synced_at: null,
      });
      const rel = await anexarAoRelatorio('equipamentos', {
        id: uid(),
        equipamento_id: atual.id,
        nome: atual.nome,
        tipo: atual.tipo || 'equipamento',
        at: new Date().toISOString(),
        devolvido_at: null,
        lider,
      });
      await registrarMovimento({
        tipo_item: 'equipamento',
        item_id: atual.id,
        item_nome: atual.nome,
        acao: 'retirada',
        quantidade: 1,
        unidade: 'un',
        frente: rel?.frente || '',
        relatorio_numero: rel?.numero || '',
      });
      await carregarCatalogos();
    },
    [anexarAoRelatorio, registrarMovimento, carregarCatalogos, lider],
  );

  const devolverEquipamento = useCallback(
    async (equipamento) => {
      const atual = await get(equipamento.id);
      if (!atual) throw new Error('Item não encontrado.');
      await put('equipamentos', {
        ...atual,
        status: 'disponivel',
        em_uso_por: '',
        synced_at: null,
      });
      const registro = await relatorioAtual();
      if (registro) {
        const itens = [...(registro.equipamentos || [])];
        let alterado = false;
        for (let i = itens.length - 1; i >= 0; i -= 1) {
          if (itens[i].equipamento_id === atual.id && !itens[i].devolvido_at) {
            itens[i] = { ...itens[i], devolvido_at: new Date().toISOString() };
            alterado = true;
            break;
          }
        }
        if (alterado) {
          const atualizado = { ...registro, equipamentos: itens };
          await put('relatorios', atualizado);
          setRelatorio(atualizado);
        }
      }
      await registrarMovimento({
        tipo_item: 'equipamento',
        item_id: atual.id,
        item_nome: atual.nome,
        acao: 'devolucao',
        quantidade: 1,
        unidade: 'un',
        frente: registro?.frente || '',
        relatorio_numero: registro?.numero || '',
      });
      await carregarCatalogos();
    },
    [relatorioAtual, registrarMovimento, carregarCatalogos],
  );

  const valor = useMemo(
    () => ({
      lider,
      deviceId,
      pronto,
      relatorio,
      fotos,
      catalogos,
      online,
      sincronizando,
      ultimaSync,
      erroSync,
      pendentes,
      definirLider,
      iniciarAtividade,
      salvarRelatorio,
      registrarEvento,
      ajustarEvento,
      adicionarArquivos,
      atualizarFoto,
      excluirFoto,
      carregarFotos,
      finalizarRelatorio,
      criarNovaVersao,
      salvarItem,
      excluirItem,
      movimentos,
      carregarMovimentos,
      retirarMaterial,
      reporMaterial,
      usarEquipamento,
      devolverEquipamento,
      sincronizarAgora,
    }),
    [
      lider,
      deviceId,
      pronto,
      relatorio,
      fotos,
      catalogos,
      online,
      sincronizando,
      ultimaSync,
      erroSync,
      pendentes,
      definirLider,
      iniciarAtividade,
      salvarRelatorio,
      registrarEvento,
      ajustarEvento,
      adicionarArquivos,
      atualizarFoto,
      excluirFoto,
      carregarFotos,
      finalizarRelatorio,
      criarNovaVersao,
      salvarItem,
      excluirItem,
      movimentos,
      carregarMovimentos,
      retirarMaterial,
      reporMaterial,
      usarEquipamento,
      devolverEquipamento,
      sincronizarAgora,
    ],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}