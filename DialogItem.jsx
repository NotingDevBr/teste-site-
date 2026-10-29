import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/context/AppProvider';

const VAZIO = {
  nome: '',
  unidade: 'un',
  saldo: '',
  minimo: '',
  tipo: 'equipamento',
  identificacao: '',
};

export default function DialogItem({ aberto, tipo, onFechar }) {
  const { salvarItem } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) setForm(VAZIO);
  }, [aberto]);

  const atualizar = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const salvar = async (evento) => {
    evento.preventDefault();
    if (!form.nome.trim()) return;
    setSalvando(true);
    try {
      if (tipo === 'material') {
        await salvarItem('materiais', {
          nome: form.nome.trim(),
          unidade: form.unidade.trim() || 'un',
          saldo: Number(form.saldo) || 0,
          minimo: Number(form.minimo) || 0,
          ativo: true,
        });
        toast({ title: 'Material cadastrado' });
      } else {
        await salvarItem('equipamentos', {
          nome: form.nome.trim(),
          tipo: form.tipo,
          identificacao: form.identificacao.trim(),
          status: 'disponivel',
          em_uso_por: '',
          ativo: true,
        });
        toast({ title: 'Item cadastrado' });
      }
      onFechar();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(valor) => !valor && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tipo === 'material' ? 'Novo material' : 'Novo equipamento'}</DialogTitle>
          <DialogDescription>
            {tipo === 'material'
              ? 'Informe o saldo inicial disponível no almoxarifado da obra.'
              : 'Cadastre máquinas, equipamentos e ferramentas controladas pela equipe.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="item-nome" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="item-nome"
              autoFocus
              value={form.nome}
              onChange={(e) => atualizar('nome')(e.target.value)}
              placeholder={tipo === 'material' ? 'Ex.: Cimento CP II' : 'Ex.: Betoneira 400L'}
              className="h-12"
            />
          </div>

          {tipo === 'material' ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-unidade" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unidade
                </Label>
                <Input
                  id="item-unidade"
                  value={form.unidade}
                  onChange={(e) => atualizar('unidade')(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-saldo" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Saldo
                </Label>
                <Input
                  id="item-saldo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.saldo}
                  onChange={(e) => atualizar('saldo')(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-minimo" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mínimo
                </Label>
                <Input
                  id="item-minimo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minimo}
                  onChange={(e) => atualizar('minimo')(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="item-tipo" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Categoria
                </Label>
                <select
                  id="item-tipo"
                  value={form.tipo}
                  onChange={(e) => atualizar('tipo')(e.target.value)}
                  className="h-12 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="equipamento">Equipamento / máquina</option>
                  <option value="ferramenta">Ferramenta</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-identificacao" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Identificação
                </Label>
                <Input
                  id="item-identificacao"
                  value={form.identificacao}
                  onChange={(e) => atualizar('identificacao')(e.target.value)}
                  placeholder="Nº de patrimônio"
                  className="h-12"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onFechar} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando || !form.nome.trim()}
              className="rounded-xl bg-[#0B203B] font-semibold"
            >
              {salvando ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}