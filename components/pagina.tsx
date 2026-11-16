import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type ItemBreadcrumb = {
  rotulo: string;
  href?: string; // sem href = página atual (último item)
};

// Barra do topo com o caminho da página, ex.: Marcas › BMW › Lançamento X5
function Breadcrumb({
  itens,
  acoes,
}: {
  itens: ItemBreadcrumb[];
  acoes?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-card px-4 md:px-8">
      <nav aria-label="Caminho da página" className="flex min-w-0 items-center gap-2 text-[13px]">
        {itens.map((item, indice) => (
          <Fragment key={`${indice}-${item.rotulo}`}>
            {indice > 0 && (
              <ChevronRight className="size-3.5 text-subtle-foreground" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="truncate text-muted-foreground hover:text-foreground"
              >
                {item.rotulo}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-medium text-foreground">
                {item.rotulo}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
      {acoes && <div className="ml-auto flex shrink-0 items-center gap-2">{acoes}</div>}
    </header>
  );
}

// Moldura padrão de toda tela logada: breadcrumb no topo + conteúdo centralizado
// (largura máxima 1440px e margem de 32px, como no design system).
export function Pagina({
  breadcrumb,
  acoes,
  children,
}: {
  breadcrumb: ItemBreadcrumb[];
  acoes?: React.ReactNode; // botões à direita da barra do topo
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumb itens={breadcrumb} acoes={acoes} />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8">{children}</div>
    </>
  );
}
