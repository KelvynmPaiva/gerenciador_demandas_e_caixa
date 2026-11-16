import { Money } from "@/components/money";

// Faixa de números do Evento (substitui os cartões soltos). No app só existe valor
// real (não há orçado), então o "medidor" mostra o andamento das NFs lançadas.
export function ResumoEvento({
  totalReal,
  nfsTotal,
  nfsPendentes,
  nfsVencidas,
  tarefasPendentes,
}: {
  totalReal: number;
  nfsTotal: number;
  nfsPendentes: number;
  nfsVencidas: number;
  tarefasPendentes: number;
}) {
  const lancadas = nfsTotal - nfsPendentes;
  const pct = nfsTotal > 0 ? Math.round((lancadas / nfsTotal) * 100) : 0;
  return (
    <div className="mt-6 grid grid-cols-2 gap-6 rounded-lg border bg-card p-4 shadow-xs lg:grid-cols-[repeat(3,auto)_1fr] lg:gap-8">
      <Kpi label="Total real">
        <Money value={totalReal} />
      </Kpi>
      <Kpi
        label="NFs em aberto"
        tone={nfsPendentes ? "text-danger-text" : undefined}
        hint={nfsVencidas ? `${nfsVencidas} com prazo vencido` : undefined}
      >
        {nfsPendentes}
      </Kpi>
      <Kpi label="Tarefas pendentes">{tarefasPendentes}</Kpi>
      <div className="col-span-2 self-center lg:col-span-1">
        <div
          role="meter"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="NFs lançadas"
          className="relative h-2 rounded-full bg-muted ring-1 ring-border ring-inset"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-success transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="num mt-2 flex justify-between text-xs text-muted-foreground">
          <span>
            {lancadas} de {nfsTotal} NFs lançadas
          </span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  hint,
  tone,
  children,
}: {
  label: string;
  hint?: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-kpi mt-1 whitespace-nowrap ${tone ?? ""}`}>{children}</div>
      {hint && <div className={`mt-0.5 text-xs ${tone ?? "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}
