import { ResourceNotFoundError } from '@core/errors/resource-not-found-error';
import { Beneficiada, InstituicaoStatus } from '@domain/fivo/catalogo';
import { Empresa, EmpresaStatus } from '@domain/fivo/empresas';
import { Slug } from '@domain/fivo/shared';
import { CampanhaStatus } from '../entities/campanha';
import { DataCalendario } from '../entities/data-calendario';
import { RegraDoacao, TipoRegraDoacao } from '../entities/regra-doacao';
import { Vigencia } from '../entities/vigencia';
import { CampanhaFactory } from '@test/factories/campanha-factory';
import { EmpresaFactory } from '@test/factories/empresa-factory';
import { InstituicaoFactory } from '@test/factories/instituicao-factory';
import { InMemoryCampanhaRepository } from '@test/doubles/in-memory-campanha-repository';
import { InMemoryCausaRepository } from '@test/doubles/in-memory-causa-repository';
import { InMemoryEmpresaRepository } from '@test/doubles/in-memory-empresa-repository';
import { InMemoryInstituicaoRepository } from '@test/doubles/in-memory-instituicao-repository';
import { BuscarEmpresaPublicaUseCase } from './buscar-empresa-publica';

function data(texto: string): DataCalendario {
  const r = DataCalendario.criar(texto);
  if (r.isLeft()) throw r.value;
  return r.value;
}
function vigencia(inicio: string): Vigencia {
  const r = Vigencia.criar({ inicio: data(inicio) });
  if (r.isLeft()) throw r.value;
  return r.value;
}
function beneficiada(instituicaoId: string): Beneficiada {
  const r = Beneficiada.criar({ instituicaoId });
  if (r.isLeft()) throw r.value;
  return r.value;
}
function regra(valor: string): RegraDoacao {
  const r = RegraDoacao.criar({ tipo: TipoRegraDoacao.POR_UNIDADE, valor });
  if (r.isLeft()) throw r.value;
  return r.value;
}

describe('BuscarEmpresaPublicaUseCase', () => {
  let empresaRepository: InMemoryEmpresaRepository;
  let campanhaRepository: InMemoryCampanhaRepository;
  let instituicaoRepository: InMemoryInstituicaoRepository;
  let causaRepository: InMemoryCausaRepository;
  let empresa: Empresa;
  let instituicaoId: string;
  let sut: BuscarEmpresaPublicaUseCase;

  beforeEach(async () => {
    empresaRepository = new InMemoryEmpresaRepository();
    campanhaRepository = new InMemoryCampanhaRepository();
    instituicaoRepository = new InMemoryInstituicaoRepository();
    causaRepository = new InMemoryCausaRepository();

    empresa = EmpresaFactory.create({
      status: EmpresaStatus.APROVADA,
      slug: Slug.reconstruir('cafe-serra-verde'),
    });
    await empresaRepository.create(empresa);

    const inst = InstituicaoFactory.create({
      status: InstituicaoStatus.APROVADA,
    });
    await instituicaoRepository.create(inst);
    instituicaoId = inst.id.toString();

    sut = new BuscarEmpresaPublicaUseCase(
      empresaRepository,
      campanhaRepository,
      instituicaoRepository,
      causaRepository,
    );
  });

  async function aprovadaComSlug(slug: string, decididoEm: Date) {
    const campanha = CampanhaFactory.aprovada({
      empresaId: empresa.id,
      slug: Slug.reconstruir(slug),
      decididoEm,
      beneficiada: beneficiada(instituicaoId),
      regraDoacao: regra('1.50'),
      vigencia: vigencia('2026-10-01'),
    });
    await campanhaRepository.create(campanha);
    return campanha;
  }

  it('returns the exact contract keys for an APROVADA empresa', async () => {
    await aprovadaComSlug('agua-limpa', new Date('2026-10-10'));

    const res = await sut.execute({ slug: 'cafe-serra-verde' });

    expect(res.isRight()).toBe(true);
    if (res.isLeft()) throw res.value;
    expect(Object.keys(res.value).sort()).toEqual(
      [
        'slug',
        'nomeFantasia',
        'cidade',
        'uf',
        'site',
        'temLogo',
        'campanhas',
      ].sort(),
    );
    expect(Object.keys(res.value.campanhas[0]).sort()).toEqual(
      [
        'slug',
        'nome',
        'descricao',
        'beneficiada',
        'regraDoacao',
        'vigencia',
        'situacao',
      ].sort(),
    );
  });

  it('keeps out RASCUNHO, EM_ANALISE, REJEITADA and APROVADA-without-slug campaigns', async () => {
    await aprovadaComSlug('publicada', new Date('2026-10-10'));
    // aprovada sem slug
    const semSlug = CampanhaFactory.aprovada({
      empresaId: empresa.id,
      beneficiada: beneficiada(instituicaoId),
      regraDoacao: regra('1.50'),
      vigencia: vigencia('2026-10-01'),
    });
    await campanhaRepository.create(semSlug);
    await campanhaRepository.create(
      CampanhaFactory.create({ empresaId: empresa.id }),
    ); // RASCUNHO
    await campanhaRepository.create(
      CampanhaFactory.emAnalise({ empresaId: empresa.id }),
    );
    await campanhaRepository.create(
      CampanhaFactory.completa({
        empresaId: empresa.id,
        status: CampanhaStatus.REJEITADA,
      }),
    );

    const res = await sut.execute({ slug: 'cafe-serra-verde' });
    if (res.isLeft()) throw res.value;
    expect(res.value.campanhas).toHaveLength(1);
    expect(res.value.campanhas[0].slug).toBe('publicada');
  });

  it('orders campaigns by approval date, most recent first', async () => {
    await aprovadaComSlug('antiga', new Date('2026-10-01'));
    await aprovadaComSlug('nova', new Date('2026-10-20'));
    await aprovadaComSlug('media', new Date('2026-10-10'));

    const res = await sut.execute({ slug: 'cafe-serra-verde' });
    if (res.isLeft()) throw res.value;
    expect(res.value.campanhas.map((c) => c.slug)).toEqual([
      'nova',
      'media',
      'antiga',
    ]);
  });

  it('exposes the approved commitment, not the pending one', async () => {
    const campanha = CampanhaFactory.aprovadaComAlteracao({
      empresaId: empresa.id,
      slug: Slug.reconstruir('com-alteracao'),
      decididoEm: new Date('2026-10-10'),
      beneficiada: beneficiada(instituicaoId),
      regraDoacao: regra('1.50'),
      vigencia: vigencia('2026-10-01'),
    });
    await campanhaRepository.create(campanha);

    const res = await sut.execute({ slug: 'cafe-serra-verde' });
    if (res.isLeft()) throw res.value;
    // a alteração padrão troca a regra para PERCENTUAL; a pública mostra o aprovado
    expect(res.value.campanhas[0].regraDoacao).toEqual({
      tipo: TipoRegraDoacao.POR_UNIDADE,
      valor: '1.50',
    });
  });

  describe('não encontrada', () => {
    const erro = new ResourceNotFoundError('Empresa não encontrada');

    it('slug inexistente', async () => {
      const res = await sut.execute({ slug: 'nao-existe' });
      expect(res.value).toEqual(erro);
    });

    it.each([
      ['PENDENTE_APROVACAO', EmpresaStatus.PENDENTE_APROVACAO],
      ['REJEITADA', EmpresaStatus.REJEITADA],
      ['SUSPENSA', EmpresaStatus.SUSPENSA],
    ])('empresa %s', async (_label, status) => {
      const outra = EmpresaFactory.create({
        status,
        slug: Slug.reconstruir('outra-empresa'),
      });
      await empresaRepository.create(outra);
      const res = await sut.execute({ slug: 'outra-empresa' });
      expect(res.value).toEqual(erro);
    });
  });
});
