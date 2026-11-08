import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type ItemBreadcrumb = {
  rotulo: string;
  href?: string; // sem href = página atual (último item)
};

// Barra do topo com o caminho da página, ex.: Marcas › BMW › Lançamento X5
function Breadcrumb({ itens }: { itens: ItemBreadcrumb[] }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-card px-8">
      <nav aria-label="Caminho da página" className="flex items-center gap-2 text-sm">
        {itens.map((item, indice) => (
          <Fragment key={`${indice}-${item.rotulo}`}>
            {indice > 0 && (
              <ChevronRight className="size-3.5 text-muted-foreground/70" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-primary"
              >
                {item.rotulo}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-foreground">
                {item.rotulo}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
    </header>
  );
}

// Moldura padrão de toda tela logada: breadcrumb no topo + conteúdo centralizado
// (largura máxima 1440px e margem de 32px, como no design system).
export function Pagina({
  breadcrumb,
  children,
}: {
  breadcrumb: ItemBreadcrumb[];
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumb itens={breadcrumb} />
      <div className="mx-auto w-full max-w-[1440px] px-8 py-6">{children}</div>
    </>
  );
}
