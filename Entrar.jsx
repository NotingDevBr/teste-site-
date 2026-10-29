import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppProvider';
import { APP_NOME, LOGO_URL } from '@/lib/marca';

export default function Entrar() {
  const { lider, definirLider } = useApp();
  const navigate = useNavigate();
  const [nome, setNome] = useState(lider || '');
  const [erro, setErro] = useState('');

  const entrar = (evento) => {
    evento.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o nome do líder da equipe para continuar.');
      return;
    }
    definirLider(nome);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B203B] px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={LOGO_URL}
            alt={APP_NOME}
            className="h-20 w-20 rounded-3xl bg-white object-contain p-2 shadow-lg shadow-black/30"
          />
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight text-white">
            {APP_NOME}
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/50">
            Frentes de serviço
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="rounded-3xl bg-white p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <h2 className="font-display text-xl font-semibold text-[#0B203B]">Entrar no sistema</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Sem senha, sem cadastro. Informe quem está responsável pelos registros em campo.
          </p>

          <div className="mt-6 space-y-2">
            <Label htmlFor="lider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nome do líder da equipe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lider"
              autoFocus
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro('');
              }}
              placeholder="Ex.: Carlos Andrade"
              className="h-14 rounded-xl text-base"
            />
            {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
          </div>

          <Button
            type="submit"
            className="mt-5 h-14 w-full rounded-xl bg-[#0B203B] text-base font-semibold hover:bg-[#12314f]"
          >
            Entrar no sistema
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            O nome identifica o responsável pelo registro e fica salvo neste dispositivo. Ele não
            comprova identidade.
          </p>
        </form>
      </div>
    </div>
  );
}