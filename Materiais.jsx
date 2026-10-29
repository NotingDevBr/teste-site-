import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Package, Plus, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/context/AppProvider';
import ListaMateriais from '@/components/materiais/ListaMateriais';
import ListaEquipamentos from '@/components/materiais/ListaEquipamentos';
import HistoricoMovimentos from '@/components/materiais/HistoricoMovimentos';
import DialogItem from '@/components/materiais/DialogItem';
import DialogQuantidade from '@/components/materiais/DialogQuantidade';

export default function Materiais() {
  const {
    catalogos,
    movimentos,
    relatorio,
    retirarMaterial,
    reporMaterial,
    usarEquipamento,
    devolverEquipamento,
  } = useApp();
  const { toast } = useToast();
  const [cadastro, setCadastro] = useState(null);
  const [alvo, setAlvo] = useState(null);

  const materiais = useMemo(
    () =>
      [...catalogos.materiais]
        .filter((m) => m.ativo !== false)
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')),
    [catalogos.materiais],
  );

  const equipamentos = useMemo(
    () =>
      [...catalogos.equipamentos]
        .filter((e) => e.ativo !== false)
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')),
    [catalogos.equipamentos],
  );

  const confirmarQuantidade = async (quantidade) => {
    const { material, modo } = alvo;
    if (modo === 'retirar') {
      const saldo = await retirarMaterial(material, quantidade);
      toast({
        title: 'Baixa registrada',
        description: `Restam ${saldo} ${material.unidade || 'un'} de ${material.nome}.`,
      });
    } else {
      const saldo = await reporMaterial(material, quantidade);
      toast({
        title: 'Estoque reposto',
        description: `${material.nome}: saldo de ${saldo} ${material.unidade || 'un'}.`,
      });
    }
  };

  const alternarEquipamento = async (item) => {
    try {
      if (item.status === 'em_uso') {
        await devolverEquipamento(item);
        toast({ title: 'Devolução registrada', description: `${item.nome} está disponível novamente.` });
      } else {
        await usarEquipamento(item);
        toast({ title: 'Item em uso', description: `${item.nome} vinculado à sua atividade.` });
      }
    } catch (problema) {
      toast({
        title: 'Não foi possível registrar',
        description: problema?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[#0B203B]">
            Materiais e equipamentos
          </h1>
          <p className="text-sm text-slate-500">
            Retire o que a equipe vai usar: o estoque é baixado automaticamente.
          </p>
        </div>
        {relatorio && (
          <Link
            to={`/relatorios/${relatorio.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0B203B] hover:bg-slate-50"
          >
            <ClipboardList className="h-3.5 w-3.5" /> Relatório {relatorio.numero}
          </Link>
        )}
      </div>

      <Tabs defaultValue="materiais" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="materiais" className="rounded-lg text-xs font-semibold">
            <Package className="mr-1.5 h-3.5 w-3.5" /> Materiais
          </TabsTrigger>
          <TabsTrigger value="equipamentos" className="rounded-lg text-xs font-semibold">
            <Wrench className="mr-1.5 h-3.5 w-3.5" /> Equipamentos
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-lg text-xs font-semibold">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materiais" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {materiais.length} item(ns) no estoque
            </p>
            <button
              type="button"
              onClick={() => setCadastro({ tipo: 'material' })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B203B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#12314f]"
            >
              <Plus className="h-3.5 w-3.5" /> Novo material
            </button>
          </div>
          <ListaMateriais
            materiais={materiais}
            onRetirar={(material) => setAlvo({ material, modo: 'retirar' })}
            onRepor={(material) => setAlvo({ material, modo: 'repor' })}
          />
        </TabsContent>

        <TabsContent value="equipamentos" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {equipamentos.length} item(ns) controlado(s)
            </p>
            <button
              type="button"
              onClick={() => setCadastro({ tipo: 'equipamento' })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B203B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#12314f]"
            >
              <Plus className="h-3.5 w-3.5" /> Novo item
            </button>
          </div>
          <ListaEquipamentos
            equipamentos={equipamentos}
            onUsar={alternarEquipamento}
            onDevolver={alternarEquipamento}
          />
        </TabsContent>

        <TabsContent value="historico" className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Últimas movimentações
          </p>
          <HistoricoMovimentos movimentos={movimentos} />
        </TabsContent>
      </Tabs>

      <DialogItem
        aberto={!!cadastro}
        tipo={cadastro?.tipo || 'material'}
        onFechar={() => setCadastro(null)}
      />
      <DialogQuantidade
        material={alvo?.material || null}
        modo={alvo?.modo || 'retirar'}
        onFechar={() => setAlvo(null)}
        onConfirmar={confirmarQuantidade}
      />
    </div>
  );
}