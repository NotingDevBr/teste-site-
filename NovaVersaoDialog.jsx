import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/context/AppProvider';
import { ROTULOS_EVENTO, deInputLocal, formatarHora, paraInputLocal } from '@/lib/formato';

export default function NovaVersaoDialog({ relatorio, aberto, onFechar }) {
  const { criarNovaVersao } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [horarios, setHorarios] = useState({});
  const [observacoes, setObservacoes] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto && relatorio) {
      setHorarios(
        Object.fromEntries((relatorio.eventos || []).map((e) => [e.id, paraInputLocal(e.at)])),
      );
      setObservacoes(relatorio.observacoes || '');
      setJustificativa('');
    }
  }, [aberto, relatorio]);

  const salvar = async () => {
    if (!justificativa.trim()) return;
    setSalvando(true);
    try {
      const eventos = (relatorio.eventos || []).map((evento) => {
        const valor = horarios[evento.id] || paraInputLocal(evento.at);
        const iso = deInputLocal(valor);
        if (iso === evento.at) return evento;
        return {
          ...evento,
          at: iso,
          manual: true,
          original_at: evento.original_at || evento.at,
          justificativa: justificativa.trim(),
        };
      });
      const nova = await criarNovaVersao(relatorio.id, {
        eventos,
        observacoes,
        justificativa: justificativa.trim(),
      });
      toast({ title: 'Nova versão gerada', description: `Versão ${nova.versao} do relatório` });
      onFechar();
      navigate(`/relatorios/${nova.id}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Gerar nova versão</DialogTitle>
          <DialogDescription>
            O relatório original é preservado. A nova versão registra data, responsável e
            justificativa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-slate-500">
              Horários registrados
            </Label>
            <div className="space-y-2">
              {(relatorio?.eventos || []).map((evento) => (
                <div key={evento.id} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 text-[11px] text-slate-500">
                    {ROTULOS_EVENTO[evento.tipo] || evento.tipo}
                    <span className="ml-1 text-slate-400">({formatarHora(evento.at)})</span>
                  </span>
                  <Input
                    type="datetime-local"
                    value={horarios[evento.id] || ''}
                    onChange={(e) =>
                      setHorarios((atual) => ({ ...atual, [evento.id]: e.target.value }))
                    }
                    className="h-10"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs-nova" className="text-xs uppercase tracking-wide text-slate-500">
              Observações
            </Label>
            <Textarea
              id="obs-nova"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="justificativa-nova"
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Justificativa da alteração <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="justificativa-nova"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={2}
              placeholder="Ex.: ajuste dos horários anotados em campo"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={!justificativa.trim() || salvando}
            className="bg-[#0B203B]"
          >
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar nova versão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}