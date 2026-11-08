import { Resvg } from '@resvg/resvg-js';
import jsQR from 'jsqr';

import { QrCodeRenderizadorDeSelo } from './qrcode-renderizador-de-selo';

const WEB_URL = 'https://fivo.example.com.br';
const DADOS = { slugEmpresa: 'cafe-serra-verde', slugCampanha: 'agua-limpa' };
const URL_ESPERADA =
  'https://fivo.example.com.br/empresa/cafe-serra-verde/agua-limpa';

interface Raster {
  pixels: Uint8ClampedArray;
  largura: number;
  altura: number;
}

/** Rasteriza o SVG como uma impressora/câmera veria. */
function rasterizar(svg: string): Raster {
  const imagem = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    background: '#ffffff',
  }).render();

  return {
    pixels: new Uint8ClampedArray(imagem.pixels),
    largura: imagem.width,
    altura: imagem.height,
  };
}

/** Grade de módulos do símbolo, a partir dos padrões localizadores. */
function gradeDoQr(raster: Raster) {
  const lido = jsQR(raster.pixels, raster.largura, raster.altura);
  if (!lido) {
    throw new Error('QR não decodificado');
  }

  const lado = 17 + 4 * lido.version;
  const { topLeftFinderPattern: tl, topRightFinderPattern: tr } = lido.location;
  const modulo = (tr.x - tl.x) / (lado - 7);
  const x0 = tl.x - 3.5 * modulo;
  const y0 = tl.y - 3.5 * modulo;

  /** Escuro no ponto (linha, coluna) em frações de módulo. */
  const escuro = (linha: number, coluna: number): boolean => {
    const x = Math.floor(x0 + coluna * modulo);
    const y = Math.floor(y0 + linha * modulo);
    const i = (y * raster.largura + x) * 4;
    const luminancia =
      (raster.pixels[i] + raster.pixels[i + 1] + raster.pixels[i + 2]) / 3;
    return luminancia < 128;
  };

  return { lido, lado, escuro };
}

/**
 * Nível de correção pela informação de formato do símbolo (ISO/IEC 18004
 * §7.9): 15 bits ao redor do localizador superior esquerdo, mascarados com
 * 0x5412; os 2 bits mais altos são o nível (L=01, M=00, Q=11, H=10).
 */
function nivelDeCorrecao(grade: ReturnType<typeof gradeDoQr>): string {
  const posicoes: Array<[number, number]> = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
  const bits = posicoes.reduce(
    (acc, [linha, coluna]) =>
      (acc << 1) | (grade.escuro(linha + 0.5, coluna + 0.5) ? 1 : 0),
    0,
  );
  const formato = bits ^ 0x5412;

  // BCH(15,5) com gerador 0x537: garante que a leitura não foi ruído.
  let resto = (formato >> 10) << 10;
  for (let bit = 14; bit >= 10; bit--) {
    if (resto & (1 << bit)) {
      resto ^= 0x537 << (bit - 10);
    }
  }
  expect(formato & 0x3ff).toBe(resto);

  return ['M', 'L', 'H', 'Q'][formato >> 13];
}

/** Maior faixa clara contínua ao redor do símbolo, em módulos (até 8). */
function margemEmModulos(grade: ReturnType<typeof gradeDoQr>): number {
  const { lado, escuro } = grade;
  const subamostras = [0.25, 0.5, 0.75];

  for (let anel = 1; anel <= 8; anel++) {
    const min = -anel;
    const max = lado + anel - 1;
    for (let k = min; k <= max; k++) {
      for (const a of subamostras) {
        for (const b of subamostras) {
          const nasBordas: Array<[number, number]> = [
            [min + a, k + b],
            [max + a, k + b],
            [k + a, min + b],
            [k + a, max + b],
          ];
          if (nasBordas.some(([l, c]) => escuro(l, c))) {
            return anel - 1;
          }
        }
      }
    }
  }

  return 8;
}

describe('QrCodeRenderizadorDeSelo', () => {
  const ambienteOriginal = { ...process.env };

  beforeEach(() => {
    process.env.WEB_URL = WEB_URL;
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it('codifica no QR exatamente {WEB_URL}/empresa/{slugEmpresa}/{slugCampanha} (Selo AC2)', async () => {
    const svg = await new QrCodeRenderizadorDeSelo().renderizar(DADOS);

    const { lido } = gradeDoQr(rasterizar(svg));

    expect(lido.data).toBe(URL_ESPERADA);
  });

  it('gera o QR com nível de correção Q (Selo AC3)', async () => {
    const svg = await new QrCodeRenderizadorDeSelo().renderizar(DADOS);

    expect(nivelDeCorrecao(gradeDoQr(rasterizar(svg)))).toBe('Q');
  });

  it('deixa margem clara de no mínimo 4 módulos ao redor do QR (Selo AC3)', async () => {
    const svg = await new QrCodeRenderizadorDeSelo().renderizar(DADOS);

    expect(margemEmModulos(gradeDoQr(rasterizar(svg)))).toBeGreaterThanOrEqual(
      4,
    );
  });

  it('traz a marca Fivo e o texto "Selo Sustentável Fivo" (Selo AC2)', async () => {
    const svg = await new QrCodeRenderizadorDeSelo().renderizar(DADOS);

    expect(svg).toMatch(/<text[^>]*>Fivo<\/text>/);
    expect(svg).toMatch(/<text[^>]*>Selo Sustentável Fivo<\/text>/);
  });

  it('desenha o QR com elementos vetoriais, sem <image> (Selo AC4)', async () => {
    const svg = await new QrCodeRenderizadorDeSelo().renderizar(DADOS);

    expect(svg).not.toMatch(/<image\b/i);
    expect(svg).toMatch(/<path\b/);
  });

  it('devolve bytes idênticos para os mesmos slugs (Selo AC5)', async () => {
    const renderizador = new QrCodeRenderizadorDeSelo();

    const primeiro = await renderizador.renderizar(DADOS);
    const segundo = await new QrCodeRenderizadorDeSelo().renderizar({
      ...DADOS,
    });

    expect(Buffer.from(segundo).equals(Buffer.from(primeiro))).toBe(true);
  });

  it('recusa a construção em produção sem WEB_URL', () => {
    delete process.env.WEB_URL;
    process.env.NODE_ENV = 'production';

    expect(() => new QrCodeRenderizadorDeSelo()).toThrow(
      'WEB_URL é obrigatório em produção',
    );
  });
});
