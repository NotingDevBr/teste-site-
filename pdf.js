import { jsPDF } from 'jspdf';
import {
  calcularTotais,
  descreverEventos,
  formatarData,
  formatarDataHora,
  formatarDuracao,
  formatarHora,
  pendenciasDoRelatorio,
  ETAPAS_FOTO,
  ROTULOS_EVENTO,
} from '@/lib/formato';

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;
const CONTENT_W = PAGE_W - M * 2;
const NAVY = [11, 32, 59];
const BLUE = [37, 99, 235];
const GRAY = [100, 116, 139];
const INK = [15, 23, 42];
const LINE = [226, 232, 240];
const SOFT = [247, 250, 252];

function rotuloEtapa(valor) {
  return (ETAPAS_FOTO.find((e) => e.valor === valor) || {}).rotulo || 'Registro';
}

function formatarQuantidade(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export function nomeArquivoPDF(relatorio) {
  const base = (relatorio?.numero || 'relatorio').replace(/[^\w-]+/g, '-');
  return `relatorio-${base}.pdf`;
}

export function montarPDF({ relatorio, fotos = [] }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const state = { y: 30 };

  const cabecalho = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PAGE_W, 22, 'F');
    doc.setFillColor(...BLUE);
    doc.roundedRect(M, 6.5, 9, 9, 1.6, 1.6, 'F');
    doc.setFillColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.text('FP', M + 4.5, 12.4, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('FRENTESPRO', M + 12, 11.6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.text('Controle de frentes de serviço', M + 12, 16.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.text(`RELATÓRIO ${relatorio.numero}`, PAGE_W - M, 11, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.text(`Versão ${relatorio.versao || 1}`, PAGE_W - M, 16, { align: 'right' });
  };

  const garantir = (altura) => {
    if (state.y + altura > PAGE_H - 20) {
      doc.addPage();
      cabecalho();
      state.y = 30;
    }
  };

  const secao = (titulo) => {
    garantir(16);
    doc.setFillColor(...NAVY);
    doc.rect(M, state.y, 2.2, 4.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.4);
    doc.setTextColor(...NAVY);
    doc.text(String(titulo).toUpperCase(), M + 5, state.y + 3.9);
    state.y += 7;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(M, state.y, PAGE_W - M, state.y);
    state.y += 4;
  };

  const paragrafo = (texto, { size = 9, cor = INK, gap = 4 } = {}) => {
    if (!texto) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...cor);
    const linhas = doc.splitTextToSize(String(texto), CONTENT_W);
    linhas.forEach((linha) => {
      garantir(6);
      doc.text(linha, M, state.y);
      state.y += size * 0.48 + 1;
    });
    state.y += gap;
  };

  const campos = (pares) => {
    const colW = CONTENT_W / 2;
    for (let i = 0; i < pares.length; i += 2) {
      const bloco = pares.slice(i, i + 2);
      const preparados = bloco.map(([rotulo, valor]) => ({
        rotulo,
        linhas: doc.splitTextToSize(String(valor || '—'), colW - 6),
      }));
      const altura = Math.max(...preparados.map((p) => p.linhas.length)) * 4 + 6.6;
      garantir(altura + 3);
      const topo = state.y;
      preparados.forEach((p, idx) => {
        const x = M + idx * colW;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.2);
        doc.setTextColor(...GRAY);
        doc.text(String(p.rotulo).toUpperCase(), x, topo + 3);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(...INK);
        doc.text(p.linhas, x, topo + 7.4);
      });
      state.y = topo + altura + 2.4;
    }
  };

  const tabela = (colunas, linhas) => {
    const desenharCabecalhoTabela = () => {
      doc.setFillColor(...NAVY);
      doc.rect(M, state.y, CONTENT_W, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      let x = M + 2.4;
      colunas.forEach((c) => {
        doc.text(
          String(c.titulo).toUpperCase(),
          c.alinhamento === 'right' ? x + c.largura - 4.8 : x,
          state.y + 4.6,
          { align: c.alinhamento || 'left' },
        );
        x += c.largura;
      });
      state.y += 7;
    };

    if (!linhas.length) {
      paragrafo('Nenhum registro.', { cor: GRAY, size: 8.4 });
      return;
    }

    garantir(20);
    desenharCabecalhoTabela();

    linhas.forEach((linha, indice) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.9);
      const celulas = colunas.map((c) =>
        doc.splitTextToSize(String(linha[c.campo] ?? '—'), c.largura - 4.8),
      );
      const altura = Math.max(...celulas.map((l) => l.length)) * 3.9 + 3.4;

      if (state.y + altura > PAGE_H - 20) {
        doc.addPage();
        cabecalho();
        state.y = 30;
        desenharCabecalhoTabela();
      }

      if (indice % 2 === 1) {
        doc.setFillColor(...SOFT);
        doc.rect(M, state.y, CONTENT_W, altura, 'F');
      }

      let x = M + 2.4;
      celulas.forEach((partes, ci) => {
        doc.setTextColor(...INK);
        doc.text(
          partes,
          colunas[ci].alinhamento === 'right' ? x + colunas[ci].largura - 4.8 : x,
          state.y + 4.4,
          { align: colunas[ci].alinhamento || 'left' },
        );
        x += colunas[ci].largura;
      });

      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.2);
      doc.line(M, state.y + altura, PAGE_W - M, state.y + altura);
      state.y += altura;
    });
    state.y += 5;
  };

  const blocoAviso = (titulo, itens) => {
    if (!itens.length) return;
    garantir(14 + itens.length * 4.4);
    const alturaBloco = 10 + itens.length * 4.4;
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(M, state.y, CONTENT_W, alturaBloco, 2, 2, 'F');
    doc.setTextColor(154, 52, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.text(titulo, M + 4, state.y + 5.6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    let y = state.y + 10.4;
    itens.forEach((item) => {
      doc.text(`•  ${item}`, M + 4, y);
      y += 4.4;
    });
    state.y += alturaBloco + 5;
  };

  const formatoImagem = (dataUrl) =>
    /^data:image\/png/i.test(String(dataUrl || '')) ? 'PNG' : 'JPEG';

  const galeria = (lista) => {
    const colW = (CONTENT_W - 6) / 2;
    let i = 0;
    while (i < lista.length) {
      const par = lista.slice(i, i + 2);
      const caixas = par.map((f) => {
        const proporcao = f.largura && f.altura ? f.altura / f.largura : 0.72;
        const altura = Math.min(62, colW * proporcao);
        return { foto: f, altura };
      });
      const alturaLinha = Math.max(...caixas.map((c) => c.altura)) + 16;
      garantir(alturaLinha);
      caixas.forEach((caixa, idx) => {
        const x = M + idx * (colW + 6);
        const y = state.y;
        doc.setFillColor(...SOFT);
        doc.rect(x, y, colW, caixa.altura, 'F');
        const proporcao = caixa.foto.largura && caixa.foto.altura
          ? caixa.foto.largura / caixa.foto.altura
          : colW / caixa.altura;
        let largura = colW;
        let altura = largura / proporcao;
        if (altura > caixa.altura) {
          altura = caixa.altura;
          largura = altura * proporcao;
        }
        try {
          doc.addImage(
            caixa.foto.dataUrl,
            formatoImagem(caixa.foto.dataUrl),
            x + (colW - largura) / 2,
            y + (caixa.altura - altura) / 2,
            largura,
            altura,
          );
        } catch {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.2);
          doc.setTextColor(...GRAY);
          doc.text('Foto indisponível', x + colW / 2, y + caixa.altura / 2, { align: 'center' });
        }
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.2);
        doc.rect(x, y, colW, caixa.altura);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.4);
        doc.setTextColor(...BLUE);
        doc.text(rotuloEtapa(caixa.foto.etapa).toUpperCase(), x, y + caixa.altura + 4.2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(...INK);
        const legenda = doc.splitTextToSize(
          `${caixa.foto.legenda || 'Sem legenda'} · ${formatarHora(caixa.foto.at)}`,
          colW,
        );
        doc.text(legenda.slice(0, 2), x, y + caixa.altura + 8.4);
      });
      state.y += alturaLinha;
      i += 2;
    }
    state.y += 2;
  };

  cabecalho();

  // Título do documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text('Relatório diário de frente de serviço', M, state.y);
  state.y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(...GRAY);
  doc.text(
    `Emitido em ${formatarDataHora(new Date().toISOString())} pelo sistema FrentesPro`,
    M,
    state.y,
  );
  state.y += 9;

  const totais = calcularTotais(relatorio.eventos);
  const estado = relatorio.status === 'finalizado' ? 'Finalizado' : 'Em andamento';

  secao('Identificação');
  campos([
    ['Número do relatório', relatorio.numero],
    ['Data', formatarData(relatorio.data)],
    ['Líder responsável', relatorio.lider],
    ['Situação', `${estado} · versão ${relatorio.versao || 1}`],
    ['Frente de serviço', relatorio.frente],
    ['Área de execução', relatorio.area],
    ['Atividade realizada', relatorio.atividade],
    ['Encarregado / líder', relatorio.encarregado || relatorio.lider],
    ['Equipe de trabalho', relatorio.equipe],
    ['Local ou trecho', relatorio.local],
  ]);

  secao('Equipe de trabalho');
  tabela(
    [
      { titulo: 'Nome completo', campo: 'nome', largura: 92 },
      { titulo: 'Matrícula', campo: 'matricula', largura: 38 },
      { titulo: 'Cargo / função', campo: 'cargo', largura: CONTENT_W - 130 },
    ],
    (relatorio.funcionarios || []).map((f) => ({
      nome: f.nome,
      matricula: f.matricula || '—',
      cargo: f.cargo || '—',
    })),
  );

  secao('Jornada — ordem cronológica');
  const linhasEventos = descreverEventos(relatorio.eventos).map((linha) => {
    const detalhe = [linha.detalhe, linha.manual ? `Horário ajustado: ${linha.justificativa}` : '']
      .filter(Boolean)
      .join(' · ');
    return {
      hora: formatarHora(linha.at),
      evento:
        linha.tipo === 'parada_fim'
          ? linha.duracao_ms
            ? `Retomada após ${formatarDuracao(linha.duracao_ms)}`
            : ROTULOS_EVENTO[linha.tipo]
          : linha.tipo === 'almoco_fim' && linha.duracao_ms
            ? `Retorno (${formatarDuracao(linha.duracao_ms)})`
            : ROTULOS_EVENTO[linha.tipo] || linha.tipo,
      detalhe: detalhe || '—',
    };
  });
  tabela(
    [
      { titulo: 'Hora', campo: 'hora', largura: 20 },
      { titulo: 'Evento', campo: 'evento', largura: 68 },
      { titulo: 'Informações', campo: 'detalhe', largura: CONTENT_W - 88 },
    ],
    linhasEventos,
  );

  secao('Tempos registrados');
  tabela(
    [
      { titulo: 'Descrição', campo: 'descricao', largura: CONTENT_W - 45 },
      { titulo: 'Tempo', campo: 'tempo', largura: 45, alinhamento: 'right' },
    ],
    [
      {
        descricao: 'Tempo total registrado (início ao encerramento)',
        tempo: totais.inicio_ts ? formatarDuracao(totais.total_ms) : 'Não calculável',
      },
      {
        descricao: 'Intervalo de almoço',
        tempo: totais.almoco_ms ? formatarDuracao(totais.almoco_ms) : '0h 00min',
      },
      {
        descricao: 'Outras paradas',
        tempo: totais.paradas_ms ? formatarDuracao(totais.paradas_ms) : '0h 00min',
      },
      {
        descricao: 'Tempo líquido de execução',
        tempo: totais.inicio_ts ? formatarDuracao(totais.liquido_ms) : 'Não calculável',
      },
    ],
  );

  const materiais = relatorio.materiais || [];
  if (materiais.length) {
    secao(`Materiais e insumos utilizados (${materiais.length})`);
    tabela(
      [
        { titulo: 'Item', campo: 'item', largura: CONTENT_W - 72 },
        { titulo: 'Qtd.', campo: 'quantidade', largura: 26, alinhamento: 'right' },
        { titulo: 'Un.', campo: 'unidade', largura: 18, alinhamento: 'right' },
        { titulo: 'Hora', campo: 'hora', largura: 28, alinhamento: 'right' },
      ],
      materiais.map((m) => ({
        item: m.nome,
        quantidade: formatarQuantidade(m.quantidade),
        unidade: m.unidade || 'un',
        hora: formatarHora(m.at),
      })),
    );
  }

  const equipamentos = relatorio.equipamentos || [];
  if (equipamentos.length) {
    secao(`Equipamentos e ferramentas (${equipamentos.length})`);
    tabela(
      [
        { titulo: 'Item', campo: 'item', largura: CONTENT_W - 92 },
        { titulo: 'Tipo', campo: 'tipo', largura: 30 },
        { titulo: 'Retirada', campo: 'retirada', largura: 31, alinhamento: 'right' },
        { titulo: 'Devolução', campo: 'devolucao', largura: 31, alinhamento: 'right' },
      ],
      equipamentos.map((e) => ({
        item: e.nome,
        tipo: e.tipo === 'ferramenta' ? 'Ferramenta' : 'Equipamento',
        retirada: formatarHora(e.at),
        devolucao: e.devolvido_at ? formatarHora(e.devolvido_at) : 'Em uso',
      })),
    );
  }

  const pendencias = pendenciasDoRelatorio(relatorio, fotos.length);
  if (pendencias.length) {
    blocoAviso('Registros incompletos neste relatório', pendencias);
  }

  secao('Observações e ocorrências');
  paragrafo(relatorio.observacoes || 'Sem observações registradas.', { cor: INK });

  if (relatorio.historico && relatorio.historico.length) {
    secao('Histórico de versões');
    tabela(
      [
        { titulo: 'Data', campo: 'data', largura: 38 },
        { titulo: 'Responsável', campo: 'responsavel', largura: 48 },
        { titulo: 'Justificativa', campo: 'justificativa', largura: CONTENT_W - 86 },
      ],
      relatorio.historico.map((h) => ({
        data: formatarDataHora(h.em),
        responsavel: h.responsavel || '—',
        justificativa: h.justificativa || h.acao || '—',
      })),
    );
  }

  secao(`Fotografias (${fotos.length})`);
  if (fotos.length) {
    galeria(fotos);
  } else {
    paragrafo('Nenhuma fotografia registrada neste relatório.', { cor: GRAY });
  }

  // Assinaturas
  garantir(38);
  state.y += 6;
  const linhaY = state.y + 10;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(M, linhaY, M + 74, linhaY);
  doc.line(PAGE_W - M - 74, linhaY, PAGE_W - M, linhaY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(...GRAY);
  doc.text('Responsável pelo registro', M, linhaY + 4.4);
  doc.text(relatorio.lider || '', M, linhaY + 8.6);
  doc.text('Aprovação / fiscalização', PAGE_W - M - 74, linhaY + 4.4);
  state.y = linhaY + 16;

  // Rodapé em todas as páginas
  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(M, PAGE_H - 15, PAGE_W - M, PAGE_H - 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(...GRAY);
    doc.text(
      `FrentesPro · Relatório ${relatorio.numero} · Líder: ${relatorio.lider || '—'}`,
      M,
      PAGE_H - 10.5,
    );
    doc.text(`Página ${p} de ${totalPaginas}`, PAGE_W - M, PAGE_H - 10.5, { align: 'right' });
    doc.text(
      `Emitido em ${formatarDataHora(new Date().toISOString())}`,
      PAGE_W - M,
      PAGE_H - 6.8,
      { align: 'right' },
    );
  }

  return doc;
}

export function gerarBlobPDF(dados) {
  return montarPDF(dados).output('blob');
}

export function baixarPDF(dados) {
  const blob = gerarBlobPDF(dados);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivoPDF(dados.relatorio);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function visualizarPDF(dados) {
  const url = URL.createObjectURL(gerarBlobPDF(dados));
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function imprimirPDF(dados) {
  const url = URL.createObjectURL(gerarBlobPDF(dados));
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 400);
  };
  document.body.appendChild(iframe);
  setTimeout(() => {
    iframe.remove();
    URL.revokeObjectURL(url);
  }, 120000);
}

export async function compartilharPDF(dados) {
  const blob = gerarBlobPDF(dados);
  const arquivo = new File([blob], nomeArquivoPDF(dados.relatorio), { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    await navigator.share({
      files: [arquivo],
      title: `Relatório ${dados.relatorio.numero}`,
      text: 'Relatório diário de frente de serviço — FrentesPro',
    });
    return 'compartilhado';
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivoPDF(dados.relatorio);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'baixado';
}