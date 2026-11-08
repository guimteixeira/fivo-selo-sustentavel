import { randomUUID } from 'node:crypto';

import { EmpresaStatus } from '@domain/fivo/empresas/entities/empresa';
import { Storage } from '@domain/fivo/shared/ports/storage';
import { FakeStorage } from '@test/doubles/fake-storage';
import {
  CenarioCampanhas,
  EmpresaDeTeste,
  pngBuffer,
} from '@test/http/campanhas/campanhas-e2e.helper';
import {
  AppDeTeste,
  criarAppDeTeste,
  limparBanco,
} from '@test/helpers/e2e-app';

describe('Empresas públicas (e2e)', () => {
  let contexto: AppDeTeste;
  let cenario: CenarioCampanhas;
  const storage = new FakeStorage();

  beforeAll(async () => {
    contexto = await criarAppDeTeste({
      configurar: (construtor) =>
        construtor.overrideProvider(Storage).useValue(storage),
    });
    cenario = new CenarioCampanhas(contexto);
  });

  beforeEach(async () => {
    await limparBanco(contexto.prisma);
    storage.arquivos.clear();
    storage.resetFailure();
  });

  afterAll(async () => {
    await contexto.encerrar();
  });

  /** Empresa gravada já com slug, cidade e UF (sem passar pela aprovação). */
  async function empresaPublica(
    nomeFantasia: string,
    slug: string,
    status: EmpresaStatus = EmpresaStatus.APROVADA,
    extra: { cidade?: string; uf?: string } = {},
  ): Promise<EmpresaDeTeste> {
    const criada = await cenario.criarEmpresa(status, nomeFantasia);
    await contexto.prisma.empresa.update({
      where: { id: criada.empresa.id.toString() },
      data: {
        slug,
        cidade: extra.cidade ?? 'Campinas',
        uf: extra.uf ?? 'SP',
      },
    });
    return criada;
  }

  /** Grava um logo PNG para a empresa, no banco e no storage. */
  async function comLogo(empresa: EmpresaDeTeste): Promise<Buffer> {
    const bytes = pngBuffer(40, 40);
    const id = randomUUID();
    const chave = `${id}/logo.png`;
    await contexto.prisma.arquivo.create({
      data: {
        id,
        tipo: 'LOGO_EMPRESA',
        nomeOriginal: 'logo.png',
        mime: 'image/png',
        bytes: bytes.length,
        chaveStorage: chave,
      },
    });
    await contexto.prisma.empresa.update({
      where: { id: empresa.empresa.id.toString() },
      data: { logoArquivoId: id },
    });
    await storage.salvar(chave, bytes, 'image/png');
    return bytes;
  }

  describe('GET /empresas/publicas', () => {
    it('200 sem sessão, só APROVADA, em ordem alfabética sem caixa nem acento, só os campos do contrato (Vitrine AC1, AC2)', async () => {
      const zebra = await empresaPublica('Zebra Orgânicos', 'zebra-organicos');
      await empresaPublica('Árvore Viva', 'arvore-viva', undefined, {
        cidade: 'Recife',
        uf: 'PE',
      });
      await empresaPublica('abelha Feliz', 'abelha-feliz');
      await empresaPublica('Café Serra Verde', 'cafe-serra-verde');
      await comLogo(zebra);
      await cenario.criarEmpresa(EmpresaStatus.PENDENTE_APROVACAO, 'Pendente');
      await cenario.criarEmpresa(EmpresaStatus.REJEITADA, 'Rejeitada');

      const resposta = await cenario.api().get('/empresas/publicas');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([
        {
          slug: 'abelha-feliz',
          nomeFantasia: 'abelha Feliz',
          cidade: 'Campinas',
          uf: 'SP',
          temLogo: false,
        },
        {
          slug: 'arvore-viva',
          nomeFantasia: 'Árvore Viva',
          cidade: 'Recife',
          uf: 'PE',
          temLogo: false,
        },
        {
          slug: 'cafe-serra-verde',
          nomeFantasia: 'Café Serra Verde',
          cidade: 'Campinas',
          uf: 'SP',
          temLogo: false,
        },
        {
          slug: 'zebra-organicos',
          nomeFantasia: 'Zebra Orgânicos',
          cidade: 'Campinas',
          uf: 'SP',
          temLogo: true,
        },
      ]);
    });

    it('empresa suspensa sai da vitrine (edge case de suspensão)', async () => {
      await empresaPublica('Café Serra Verde', 'cafe-serra-verde');
      await empresaPublica(
        'Suspensa Ltda',
        'suspensa-ltda',
        EmpresaStatus.SUSPENSA,
      );

      const resposta = await cenario.api().get('/empresas/publicas');

      expect(resposta.status).toBe(200);
      expect(
        (resposta.body as Array<{ slug: string }>).map(({ slug }) => slug),
      ).toEqual(['cafe-serra-verde']);
    });

    it('sem empresa aprovada → 200 com lista vazia (Vitrine AC1)', async () => {
      const resposta = await cenario.api().get('/empresas/publicas');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });
  });
});
