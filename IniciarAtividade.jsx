import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import CampoCombo from '@/components/CampoCombo';
import FotoPicker from '@/components/FotoPicker';
import { useApp } from '@/context/AppProvider';
import { comprimirImagem } from '@/lib/imagem';
import { formatarHora } from '@/lib/formato';

export default function IniciarAtividade() {
  const { lider, relatorio, catalogos, iniciarAtividade, adicionarFotosProcessadas } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    frente: '',
    area: '',
    atividade: '',
    encarregado: lider || '',
    equipe: '',
    local: '',
    observacoes: '',
  });
  const [selecionados, setSelecionados] = useState([]);
  const [fotosIniciais, setFotosIniciais] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const atualizar = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const nomes = (colecao) => catalogos[colecao].map((item) => item.nome).filter(Boolean);
  const funcionariosAtivos = catalogos.funcionarios.filter((f) => f.ativo !== false);

  const alternar = (id) =>
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id],
    );

  const adicionarFotos = async (arquivos) => {
    const processadas = [];
    for (const arquivo of arquivos) {
      try {
        processadas.push(await comprimirImagem(arquivo));
      } catch {
        /* ignora arquivo inválido */
      }
    }
    setFotosIniciais((atual) => [...atual, ...processadas]);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!form.frente.trim() || !form.area.trim() || !form.atividade.trim()) {
      setErro('Informe a frente de serviço, a área de execução e a atividade realizada.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const funcionarios = selecionados.map((id) => {
        const cadastrado = catalogos.funcionarios.find((f) => f.id === id);
        return {
          nome: cadastrado?.nome || '',
          matricula: cadastrado?.matricula || '',
          cargo: cadastrado?.cargo || '',
        };
      });
      const novo = await iniciarAtividade({ ...form, funcionarios });
      if (fotosIniciais.length) {
        await adicionarFotosProcessadas(fotosIniciais, 'inicio', '', novo.id);
      }
      toast({
        title: 'Atividade iniciada',
        description: `Horário registrado às ${formatarHora(novo.eventos[0].at)}.`,
      });
      navigate('/');
    } finally {
      setSalvando(false);
    }
  };

  if (relatorio) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6">
        <h1 className="font-display text-lg font-semibold text-[#0B203B]">
          Já existe uma atividade em andamento
        </h1>
        <p className="mt-1 text-sm text-amber-800">
          Finalize a atividade atual antes de iniciar uma nova frente no mesmo aparelho.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => navigate('/')} className="bg-[#0B203B]">
            Voltar ao painel
          </Button>
          <Button variant="outline" onClick={() => navigate(`/relatorios/${relatorio.id}`)}>
            Ver relatório
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-[#0B203B]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[#0B203B]">
            Iniciar atividade
          </h1>
          <p className="text-sm text-slate-500">
            O horário de início será registrado automaticamente ao confirmar.
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Frente de serviço
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoCombo
            id="frente"
            rotulo="Frente de serviço"
            obrigatorio
            valor={form.frente}
            onChange={atualizar('frente')}
            opcoes={nomes('frentes')}
            placeholder="Ex.: Lote 4 — Drenagem"
          />
          <CampoCombo
            id="area"
            rotulo="Área de execução"
            obrigatorio
            valor={form.area}
            onChange={atualizar('area')}
            opcoes={nomes('areas')}
            placeholder="Ex.: Rua das Acácias"
          />
          <CampoCombo
            id="atividade"
            rotulo="Atividade realizada"
            obrigatorio
            valor={form.atividade}
            onChange={atualizar('atividade')}
            opcoes={nomes('atividades')}
            placeholder="Ex.: Assentamento de tubulação"
          />
          <CampoCombo
            id="local"
            rotulo="Local ou trecho"
            valor={form.local}
            onChange={atualizar('local')}
            placeholder="Ex.: Entre as estacas 12 e 20"
          />
          <CampoCombo
            id="encarregado"
            rotulo="Encarregado / líder"
            valor={form.encarregado}
            onChange={atualizar('encarregado')}
            placeholder={lider}
          />
          <CampoCombo
            id="equipe"
            rotulo="Equipe de trabalho"
            valor={form.equipe}
            onChange={atualizar('equipe')}
            opcoes={nomes('equipes')}
            placeholder="Ex.: Equipe A"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Funcionários participantes
          </h2>
          <span className="text-xs text-slate-400">{selecionados.length} selecionado(s)</span>
        </div>

        {funcionariosAtivos.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
            Nenhum funcionário cadastrado.{' '}
            <Link to="/funcionarios" className="font-medium text-[#0B203B] underline">
              Cadastrar agora
            </Link>
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {funcionariosAtivos.map((funcionario) => (
              <label
                key={funcionario.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  selecionados.includes(funcionario.id)
                    ? 'border-[#0B203B]/30 bg-[#0B203B]/[0.04]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selecionados.includes(funcionario.id)}
                  onChange={() => alternar(funcionario.id)}
                  className="h-4 w-4 accent-[#0B203B]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {funcionario.nome}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {[funcionario.cargo, funcionario.matricula && `Mat. ${funcionario.matricula}`]
                      .filter(Boolean)
                      .join(' · ') || 'Sem cargo informado'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Observações gerais
        </h2>
        <Textarea
          value={form.observacoes}
          onChange={(e) => atualizar('observacoes')(e.target.value)}
          rows={3}
          placeholder="Condições do local, orientações de segurança, materiais previstos..."
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Fotos iniciais
        </h2>
        <FotoPicker onArquivos={adicionarFotos} compacto />
        {fotosIniciais.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotosIniciais.map((foto, indice) => (
              <div key={indice} className="relative overflow-hidden rounded-lg border border-slate-200">
                <img src={foto.dataUrl} alt="Foto inicial" className="h-20 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFotosIniciais((atual) => atual.filter((_, i) => i !== indice))}
                  className="absolute right-1 top-1 rounded bg-white/90 p-0.5 text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {erro && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erro}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={salvando}
          className="h-14 flex-1 rounded-xl bg-[#0B203B] text-base font-semibold hover:bg-[#12314f]"
        >
          {salvando ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Play className="mr-2 h-5 w-5" />
          )}
          Iniciar atividade agora
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/')}
          className="h-14 rounded-xl px-6"
        >
          Cancelar
        </Button>
      </div>
      <p className="pb-2 text-center text-[11px] text-slate-400">
        Frente, área e atividade ficam salvos para reutilizar nos próximos registros.
      </p>
    </form>
  );
}