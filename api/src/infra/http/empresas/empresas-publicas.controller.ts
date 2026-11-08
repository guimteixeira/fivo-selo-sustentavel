import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ListarParceirosUseCase } from '@domain/fivo/empresas/use-cases/listar-parceiros';
import { Public } from '@infra/auth/decorators/public.decorator';

const PARCEIRO = {
  type: 'object',
  required: ['slug', 'nomeFantasia', 'cidade', 'uf', 'temLogo'],
  properties: {
    slug: { type: 'string' },
    nomeFantasia: { type: 'string' },
    cidade: { type: 'string' },
    uf: { type: 'string' },
    temLogo: {
      type: 'boolean',
      description:
        'Bytes em `GET /empresas/publicas/{slug}/logo` quando `true`',
    },
  },
};

@ApiTags('empresas')
@Controller('empresas/publicas')
export class EmpresasPublicasController {
  constructor(private readonly listarParceiros: ListarParceirosUseCase) {}

  @ApiOperation({
    summary:
      'Vitrine de parceiros: empresas aprovadas em ordem alfabética, sem autenticação',
  })
  @ApiResponse({
    status: 200,
    description:
      '`nomeFantasia` em ordem alfabética, sem diferenciar caixa nem acento',
    schema: { type: 'array', items: PARCEIRO },
  })
  @Public()
  @Get()
  async listar() {
    const parceiros = await this.listarParceiros.execute();

    return parceiros.map(({ slug, nomeFantasia, cidade, uf, temLogo }) => ({
      slug,
      nomeFantasia,
      cidade,
      uf,
      temLogo,
    }));
  }
}
