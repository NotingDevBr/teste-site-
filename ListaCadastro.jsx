import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/AppProvider';

export default function ListaCadastro({ titulo, colecao, descricao, placeholder }) {
  const { catalogos, salvarItem, excluirItem } = useApp();
  const [nome, setNome] = useState('');
  const itens = [...catalogos[colecao]].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR'),
  );

  const adicionar = async (evento) => {
    evento.preventDefault();
    if (!nome.trim()) return;
    const limpo = nome.trim();
    if (itens.some((i) => (i.nome || '').toLowerCase() === limpo.toLowerCase())) {
      setNome('');
      return;
    }
    await salvarItem(colecao, { nome: limpo, ativo: true });
    setNome('');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{descricao}</p>

      <form onSubmit={adicionar} className="flex gap-2">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={placeholder}
          className="h-12 flex-1"
        />
        <Button type="submit" className="h-12 rounded-xl bg-[#0B203B] px-5">
          <Plus className="mr-1.5 h-4 w-4" /> Adicionar
        </Button>
      </form>

      <div className="space-y-2">
        {itens.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
            Nenhum registro de {titulo.toLowerCase()} cadastrado.
          </p>
        )}
        {itens.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5"
          >
            <span className="truncate text-sm font-medium text-slate-700">{item.nome}</span>
            <button
              type="button"
              onClick={() => excluirItem(colecao, item.id)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}