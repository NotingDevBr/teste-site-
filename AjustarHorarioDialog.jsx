import React, { useEffect, useState } from 'react';
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
import { paraInputLocal } from '@/lib/formato';

export default function AjustarHorarioDialog({ linha, aberto, onFechar, onSalvar }) {
  const [horario, setHorario] = useState('');
  const [justificativa, setJustificativa] = useState('');

  useEffect(() => {
    if (aberto && linha) {
      setHorario(paraInputLocal(linha.at));
      setJustificativa('');
    }
  }, [aberto, linha]);

  const salvar = () => {
    if (!horario || !justificativa.trim()) return;
    onSalvar(horario, justificativa.trim());
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Corrigir horário</DialogTitle>
          <DialogDescription>
            A correção manual exige justificativa e fica registrada no histórico do relatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="horario-ajuste" className="text-xs uppercase tracking-wide text-slate-500">
              Novo horário
            </Label>
            <Input
              id="horario-ajuste"
              type="datetime-local"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="justificativa-ajuste"
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Justificativa
            </Label>
            <Textarea
              id="justificativa-ajuste"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex.: horário anotado em campo e lançado depois"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={!horario || !justificativa.trim()}
            className="bg-[#0B203B]"
          >
            Salvar correção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}