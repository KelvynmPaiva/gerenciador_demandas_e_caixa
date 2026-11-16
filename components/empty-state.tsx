import { cn } from "@/lib/utils";

const cor = {
  neutral: "text-muted-foreground",
  success: "text-success",
  danger: "text-danger",
};

// Vazio, "tudo em dia" e erro usam o mesmo bloco. Erro: tone="danger" + AlertTriangle
// + botão "Tentar de novo" (router.refresh()); serve também para error.tsx.
export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  tone = "neutral",
}: {
  icon: React.ElementType;
  title: string;
  text?: string;
  action?: React.ReactNode;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
      <div
        className={cn(
          "mb-2 grid size-10 place-items-center rounded-lg border bg-card shadow-xs",
          cor[tone],
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>
      <h4 className="text-sm font-semibold">{title}</h4>
      {text && (
        <p className="max-w-[300px] text-[13px] text-muted-foreground">{text}</p>
      )}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}
