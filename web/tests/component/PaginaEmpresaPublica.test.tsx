import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import theme from "@/theme";
import PaginaEmpresaPublica from "@/components/empresa/PaginaEmpresaPublica";
import type { EmpresaPublica } from "@/services/empresasPublicas";
import { instalarMockFetch, type MockFetch } from "../helpers/mockFetch";

const AVISO_FIVO_LAB =
  "A Fivo Lab não intermedeia as doações. A doação é responsabilidade da empresa participante.";

function empresaFixture(over: Partial<EmpresaPublica> = {}): EmpresaPublica {
  return {
    slug: "cafe-serra-verde",
    nomeFantasia: "Café Serra Verde",
    cidade: "Campinas",
    uf: "SP",
    site: "https://cafeserraverde.com.br",
    temLogo: true,
    campanhas: [
      {
        slug: "agua-limpa",
        nome: "Água Limpa",
        descricao: "Cada café vendido ajuda.",
        beneficiada: { tipo: "INSTITUICAO", nome: "Instituto X" },
        regraDoacao: { tipo: "POR_UNIDADE", valor: "1.00" },
        vigencia: { inicio: "2026-11-01", fim: "2027-01-31" },
        situacao: "EM_ANDAMENTO",
      },
    ],
    ...over,
  };
}

function montar(slug = "cafe-serra-verde") {
  return render(
    <ThemeProvider theme={theme}>
      <PaginaEmpresaPublica slug={slug} />
    </ThemeProvider>,
  );
}

describe("PaginaEmpresaPublica (T33)", () => {
  let mock: MockFetch;

  beforeEach(() => {
    mock = instalarMockFetch();
  });

  afterEach(() => {
    mock.restaurar();
  });

  it("mostra o card com nomeFantasia, cidade/UF e o subtópico da campanha com id = slug", async () => {
    mock.responderPara("/empresas/publicas/cafe-serra-verde", {
      status: 200,
      body: empresaFixture(),
    });

    const { container } = montar();

    expect(await screen.findByText("Café Serra Verde")).toBeInTheDocument();
    expect(screen.getByText("Campinas/SP")).toBeInTheDocument();
    expect(screen.getByText("Água Limpa")).toBeInTheDocument();
    expect(screen.getByText(/R\$ 1,00 por unidade vendida/)).toBeInTheDocument();
    expect(container.querySelector("#agua-limpa")).not.toBeNull();
  });

  it("marca 'Campanha ainda não iniciada' quando situacao é NAO_INICIADA", async () => {
    mock.responderPara("/empresas/publicas/cafe-serra-verde", {
      status: 200,
      body: empresaFixture({
        campanhas: [
          {
            ...empresaFixture().campanhas[0],
            situacao: "NAO_INICIADA",
          },
        ],
      }),
    });

    montar();

    expect(await screen.findByText("Campanha ainda não iniciada")).toBeInTheDocument();
  });

  it("mostra 'Nenhuma campanha publicada até o momento' quando não há campanhas", async () => {
    mock.responderPara("/empresas/publicas/cafe-serra-verde", {
      status: 200,
      body: empresaFixture({ campanhas: [] }),
    });

    montar();

    expect(
      await screen.findByText("Nenhuma campanha publicada até o momento"),
    ).toBeInTheDocument();
  });

  it("mostra as iniciais quando temLogo é falso", async () => {
    mock.responderPara("/empresas/publicas/cafe-serra-verde", {
      status: 200,
      body: empresaFixture({ temLogo: false }),
    });

    montar();
    expect(await screen.findByText("CS")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("mostra 'Empresa não encontrada' com link para /parceiros no 404", async () => {
    mock.responderPara("/empresas/publicas/inexistente", {
      status: 404,
      body: { statusCode: 404, message: "Empresa não encontrada" },
    });

    montar("inexistente");

    expect(await screen.findByText("Empresa não encontrada")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /parceiros/i });
    expect(link).toHaveAttribute("href", "/parceiros");
  });

  it("exibe o aviso literal da Fivo Lab", async () => {
    mock.responderPara("/empresas/publicas/cafe-serra-verde", {
      status: 200,
      body: empresaFixture(),
    });

    montar();

    expect(await screen.findByText(AVISO_FIVO_LAB)).toBeInTheDocument();
  });
});
