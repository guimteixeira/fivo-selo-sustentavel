import { randomUUID } from 'node:crypto';

import { EmpresaStatus } from '@domain/fivo/empresas/entities/empresa';
import { UserRole } from '@domain/fivo/identidade/entities/user';
import { Storage } from '@domain/fivo/shared/ports/storage';
import { FakeStorage } from '@test/doubles/fake-storage';
import {
  CenarioCampanhas,
  EmpresaDeTeste,
  corpoCompleto,
  diaRelativo,
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

  describe('GET /empresas/publicas/:slug', () => {
    const NAO_ENCONTRADA = {
      statusCode: 404,
      message: 'Empresa não encontrada',
    };

    async function definirDecisao(id: string, decididoEm: string) {
      await contexto.prisma.campanha.update({
        where: { id },
        data: { decididoEm: new Date(decididoEm) },
      });
    }

    it('200 sem sessão com o contrato; só campanhas APROVADA, da aprovação mais recente para a mais antiga (Página pública AC1, AC2)', async () => {
      const dona = await empresaPublica('Café Serra Verde', 'cafe-serra-verde');
      await comLogo(dona);
      await contexto.prisma.empresa.update({
        where: { id: dona.empresa.id.toString() },
        data: { site: 'https://cafeserraverde.com.br' },
      });
      const tokenAdmin = await cenario.sessaoComPapel(UserRole.ADMIN);
      const instituicao = await cenario.criarInstituicao(
        undefined,
        'Instituto Água Viva',
      );
      const causa = await cenario.criarCausa('Reflorestamento');

      const antiga = await cenario.criarAprovada(
        dona.token,
        tokenAdmin,
        corpoCompleto(instituicao, { nome: 'Água Limpa' }),
      );
      const recente = await cenario.criarAprovada(
        dona.token,
        tokenAdmin,
        corpoCompleto(instituicao, {
          nome: 'Mata Viva',
          descricao: 'Mudas nativas',
          instituicaoId: undefined,
          causaId: causa.id.toString(),
          regraDoacao: { tipo: 'PERCENTUAL', percentual: '2.50' },
          vigencia: { inicio: diaRelativo(10), fim: diaRelativo(40) },
        }),
      );
      await definirDecisao(antiga.id, '2026-02-01T10:00:00Z');
      await definirDecisao(recente.id, '2026-03-01T10:00:00Z');
      await cenario.criarCampanha(dona.token, { nome: 'Rascunho' });
      const emAnalise = await cenario.criarCampanha(
        dona.token,
        corpoCompleto(instituicao, { nome: 'Em Análise' }),
      );
      await cenario.submeter(dona.token, emAnalise.id);
      const rejeitada = await cenario.criarCampanha(
        dona.token,
        corpoCompleto(instituicao, { nome: 'Rejeitada' }),
      );
      await cenario.forcarEstado(rejeitada.id, 'REJEITADA', 'Motivo qualquer');

      const resposta = await cenario
        .api()
        .get('/empresas/publicas/cafe-serra-verde');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({
        slug: 'cafe-serra-verde',
        nomeFantasia: 'Café Serra Verde',
        cidade: 'Campinas',
        uf: 'SP',
        site: 'https://cafeserraverde.com.br',
        temLogo: true,
        campanhas: [
          {
            slug: 'mata-viva',
            nome: 'Mata Viva',
            descricao: 'Mudas nativas',
            beneficiada: { tipo: 'CAUSA', nome: 'Reflorestamento' },
            regraDoacao: { tipo: 'PERCENTUAL', percentual: '2.50' },
            vigencia: { inicio: diaRelativo(10), fim: diaRelativo(40) },
            situacao: 'NAO_INICIADA',
          },
          {
            slug: 'agua-limpa',
            nome: 'Água Limpa',
            descricao:
              'A cada pacote vendido, R$ 1,00 vai para o reforço escolar.',
            beneficiada: { tipo: 'INSTITUICAO', nome: 'Instituto Água Viva' },
            regraDoacao: { tipo: 'POR_UNIDADE', valor: '1.00' },
            vigencia: { inicio: '2026-01-01' },
            situacao: 'EM_ANDAMENTO',
          },
        ],
      });
    });

    it('omite razão social, CNPJ, telefone, endereço, contato, e-mail, ids internos e motivos (Página pública AC4)', async () => {
      const dona = await empresaPublica('Café Serra Verde', 'cafe-serra-verde');
      const tokenAdmin = await cenario.sessaoComPapel(UserRole.ADMIN);
      const instituicao = await cenario.criarInstituicao();
      const campanha = await cenario.criarAprovada(
        dona.token,
        tokenAdmin,
        corpoCompleto(instituicao),
      );

      const resposta = await cenario
        .api()
        .get('/empresas/publicas/cafe-serra-verde');

      expect(resposta.status).toBe(200);
      const corpo = resposta.body as Record<string, unknown> & {
        campanhas: Array<Record<string, unknown>>;
      };
      const PROIBIDOS = [
        'id',
        'razaoSocial',
        'cnpj',
        'telefone',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'cep',
        'contato',
        'email',
        'usuarioId',
        'logoArquivoId',
        'motivoDecisao',
      ];
      for (const chave of PROIBIDOS) {
        expect([chave, chave in corpo]).toEqual([chave, false]);
      }
      expect(Object.keys(corpo.campanhas[0]).sort()).toEqual([
        'beneficiada',
        'descricao',
        'nome',
        'regraDoacao',
        'situacao',
        'slug',
        'vigencia',
      ]);
      const texto = JSON.stringify(corpo);
      for (const valor of [
        dona.empresa.id.toString(),
        dona.usuario.id.toString(),
        dona.usuario.email,
        dona.empresa.cnpj.valor,
        dona.empresa.razaoSocial,
        dona.empresa.telefone,
        dona.empresa.contato,
        campanha.id,
        campanha.idPublico,
        instituicao.id.toString(),
      ]) {
        expect([valor, texto.includes(valor)]).toEqual([valor, false]);
      }
    });

    it('slug inexistente e empresa suspensa → 404 "Empresa não encontrada", mesmo corpo (Página pública AC3)', async () => {
      await empresaPublica(
        'Suspensa Ltda',
        'suspensa-ltda',
        EmpresaStatus.SUSPENSA,
      );

      const suspensa = await cenario
        .api()
        .get('/empresas/publicas/suspensa-ltda');
      const inexistente = await cenario
        .api()
        .get('/empresas/publicas/nao-existe');

      expect(suspensa.status).toBe(404);
      expect(suspensa.body).toEqual(NAO_ENCONTRADA);
      expect(inexistente.status).toBe(404);
      expect(inexistente.body).toEqual(NAO_ENCONTRADA);
    });
  });
});
