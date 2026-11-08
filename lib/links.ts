// Links externos (Drive, Figma, NF...). O app não tem upload: só guarda o endereço.
//
// Segurança: só aceitamos http:// e https://. Isso impede que alguém salve algo
// como "javascript:..." e execute código ao clicar no link.

// Lê o que a pessoa digitou. "drive.google.com/x" vira "https://drive.google.com/x".
// Campo vazio é válido e significa "sem link" (null).
export function lerLink(texto: string): { valido: boolean; link: string | null } {
  const limpo = texto.trim();
  if (limpo === "") return { valido: true, link: null };

  // Se não tem "esquema:" no começo (https:, mailto:...), assume https://
  const temEsquema = /^[a-z][a-z0-9+.-]*:/i.test(limpo);
  const candidato = temEsquema ? limpo : `https://${limpo}`;

  try {
    const url = new URL(candidato);
    const protocoloPermitido = url.protocol === "http:" || url.protocol === "https:";
    // Exige um domínio de verdade (com ponto), para não aceitar "https://abc"
    if (!protocoloPermitido || !url.hostname.includes(".")) {
      return { valido: false, link: null };
    }
    return { valido: true, link: url.toString() };
  } catch {
    return { valido: false, link: null };
  }
}

// Usado na hora de mostrar o link na tela: devolve o link só se for seguro.
export function linkSeguro(link: string | null | undefined): string | null {
  if (!link) return null;
  const { valido, link: normalizado } = lerLink(link);
  return valido ? normalizado : null;
}
