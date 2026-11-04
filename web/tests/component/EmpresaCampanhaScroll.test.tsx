import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import theme from "@/theme";
import PaginaEmpresaPublica from "@/components/empresa/PaginaEmpresaPublica";
import type { EmpresaPublica } from "@/services/empresasPublicas";
import { instalarMockFetch, type MockFetch } from "../helpers/mockFetch";

const empresa: EmpresaPublica = {
  slug: "cafe-serra-verde",
  nomeFantasia: "Café Serra Verde",
  cidade: "Campinas",
  uf: "SP",
  site: "https://cafeserraverde.com.br",
  temLogo: false,
  campanhas: [
    {
      slug: "agua-limpa",
      nome: "Água Limpa",
      descricao: "texto",
      beneficiada: { tipo: "INSTITUICAO", nome: "Instituto X" },
      regraDoacao: { tipo: "POR_UNIDADE", valor: "1.00" },
      vigencia: { inicio: "2026-11-01" },
      situacao: "EM_ANDAMENTO",
    },
  ],
};

function montar(slugCampanha: string) {
  return render(
    <ThemeProvider theme={theme}>
      <PaginaEmpresaPublica slug="cafe-serra-verde" slugCampanha={slugCampanha} />
    </ThemeProvider>,
  );
}

describe("PaginaEmpresaPublica — rolagem da rota do QR (T34)", () => {
  let mock: MockFetch;
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mock = instalarMockFetch();
    mock.responderPara("/empresas/publicas/cafe-serra-verde", { status: 200, body: empresa });
    scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
  });

  afterEach(() => {
    mock.restaurar();
    vi.restoreAllMocks();
  });

  it("chama scrollIntoView no subtópico quando o slug da campanha existe", async () => {
    montar("agua-limpa");
    expect(await screen.findByText("Água Limpa")).toBeInTheDocument();

    const alvo = document.getElementById("agua-limpa");
    expect(alvo).not.toBeNull();
    expect(scrollSpy).toHaveBeenCalled();
  });

  it("não quebra e não rola quando o slug da campanha não existe", async () => {
    montar("nao-existe");

    expect(await screen.findByText("Água Limpa")).toBeInTheDocument();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
