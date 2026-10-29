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
import { useApp } from '@/context/AppProvider';

export default function EditarEquipeDialog({ aberto, onFechar }) {
  const { relatorio, catalogos, salvarRelatorio } = useApp();
  const [selecionados, setSelecionados] = useState([]);

  useEffect(() => {
    if (aberto && relatorio) {
      setSelecionados((relatorio.funcionarios || []).map((f) => f.nome));
    }
  }, [aberto, relatorio]);

  const alternar = (nome) => {
    setSelecionados((atual) =>
      atual.includes(nome) ? atual.filter((n) => n !== nome) : [...atual, nome],
    );
  };

  const salvar = async () => {
    const atuais = relatorio?.funcionarios || [];
    const funcionarios = selecionados.map((nome) => {
      const cadastrado = catalogos.funcionarios.find((f) => f.nome === nome);
      const anterior = atuais.find((f) => f.nome === nome);
      return {
        nome,
        matricula: cadastrado?.matricula || anterior?.matricula || '',
        cargo: cadastrado?.cargo || anterior?.cargo || '',
      };
    });
    await salvarRelatorio({ funcionarios });
    onFechar();
  };

  const lista = catalogos.funcionarios.filter(
    (f) => f.ativo !== false || selecionados.includes(f.nome),
  );

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Equipe em campo</DialogTitle>
          <DialogDescription>
            Marque quem está participando. Alterações ficam registradas no relatório do dia.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1.5 overflow-y-auto py-2">
          {lista.length === 0 && (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Nenhum funcionário cadastrado.
            </p>
          )}
          {lista.map((funcionario) => (
            <label
              key={funcionario.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selecionados.includes(funcionario.nome)}
                onChange={() => alternar(funcionario.nome)}
                className="h-4 w-4 accent-[#0B203B]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">
                  {funcionario.nome}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {[funcionario.cargo, funcionario.matricula ? `Mat. ${funcionario.matricula}` : '']
                    .filter(Boolean)
                    .join(' · ') || 'Sem cargo informado'}
                </span>
              </span>
            </label>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} className="bg-[#0B203B]">
            Salvar equipe ({selecionados.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}