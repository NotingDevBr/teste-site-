import React, { useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/context/AppProvider';

const VAZIO = { nome: '', matricula: '', cargo: '', equipe: '', ativo: true };

export default function Funcionarios() {
  const { catalogos, salvarItem, excluirItem } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);

  const atualizar = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const limpar = () => {
    setForm(VAZIO);
    setEditandoId(null);
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    if (!form.nome.trim()) return;
    await salvarItem('funcionarios', {
      ...(editandoId ? { id: editandoId } : {}),
      nome: form.nome.trim(),
      matricula: form.matricula.trim(),
      cargo: form.cargo.trim(),
      equipe: form.equipe.trim(),
      ativo: form.ativo,
    });
    toast({ title: editandoId ? 'Funcionário atualizado' : 'Funcionário cadastrado' });
    limpar();
  };

  const editar = (funcionario) => {
    setEditandoId(funcionario.id);
    setForm({
      nome: funcionario.nome || '',
      matricula: funcionario.matricula || '',
      cargo: funcionario.cargo || '',
      equipe: funcionario.equipe || '',
      ativo: funcionario.ativo !== false,
    });
  };

  const lista = [...catalogos.funcionarios].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR'),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-[#0B203B]">
          Cadastrar funcionários
        </h1>
        <p className="text-sm text-slate-500">
          Somente o nome é obrigatório. A matrícula é opcional.
        </p>
      </div>

      <form onSubmit={salvar} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nome completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => atualizar('nome')(e.target.value)}
              placeholder="Ex.: Antônio Ferreira da Silva"
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="matricula" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Matrícula (opcional)
            </Label>
            <Input
              id="matricula"
              value={form.matricula}
              onChange={(e) => atualizar('matricula')(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cargo" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cargo ou função
            </Label>
            <Input
              id="cargo"
              value={form.cargo}
              onChange={(e) => atualizar('cargo')(e.target.value)}
              placeholder="Ex.: Servente, Encanador, Operador"
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipe" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Equipe
            </Label>
            <Input
              id="equipe"
              list="equipes-cadastradas"
              value={form.equipe}
              onChange={(e) => atualizar('equipe')(e.target.value)}
              className="h-12"
            />
            <datalist id="equipes-cadastradas">
              {catalogos.equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.nome} />
              ))}
            </datalist>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Situação ativa</p>
              <p className="text-[11px] text-slate-400">Inativos não aparecem na seleção</p>
            </div>
            <Switch checked={form.ativo} onCheckedChange={atualizar('ativo')} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="h-12 flex-1 rounded-xl bg-[#0B203B] font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            {editandoId ? 'Salvar alterações' : 'Cadastrar funcionário'}
          </Button>
          {editandoId && (
            <Button type="button" variant="outline" onClick={limpar} className="h-12 rounded-xl">
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Equipe cadastrada
          </h2>
          <span className="text-xs text-slate-400">{lista.length} pessoa(s)</span>
        </div>

        {lista.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <Users className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Nenhum funcionário cadastrado ainda.</p>
          </div>
        )}

        {lista.map((funcionario) => (
          <div
            key={funcionario.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#0B203B]">
              {(funcionario.nome || '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{funcionario.nome}</p>
              <p className="truncate text-[11px] text-slate-400">
                {[
                  funcionario.cargo,
                  funcionario.equipe && `Equipe ${funcionario.equipe}`,
                  funcionario.matricula && `Mat. ${funcionario.matricula}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Sem informações complementares'}
              </p>
            </div>
            {funcionario.ativo === false && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                Inativo
              </span>
            )}
            <button
              type="button"
              onClick={() => editar(funcionario)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0B203B]"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                await excluirItem('funcionarios', funcionario.id);
                toast({ title: 'Funcionário removido' });
              }}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}