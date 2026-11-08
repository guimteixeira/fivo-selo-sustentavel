**Verdict**: FAIL

# Vitrine e Selo — Validação do domínio, rodada 1 (gate de handoff AD-023)

**Veredito**: ❌ **FAIL**. O núcleo de integridade do slug está sólido: normalização, sufixo, imutabilidade, unicidade por empresa e retry de 3 tentativas estão implementados conforme `design.md`, e os mutantes nos ramos de retry morreram todos. O gate de build está verde (build, tsc, eslint, unit 689/689). O FAIL vem de três frentes. (1) `BuscarEmpresaPublicaUseCase` só confere as **chaves** do contrato e nunca os **valores**: 8 mutantes sobreviveram (situação fixa, nome da beneficiada vazio, `temLogo` sempre verdadeiro, `site` trocado, descrição nula, nome da campanha trocado, vigência falsa e filtro de status removido). (2) O double de empresa define o contrato que a T20 vai seguir (`listarSlugsComPrefixo` por prefixo e `SlugEmUsoError` na unicidade natural), e nenhum dos dois é testado. (3) Há lacunas menores no slug (dígitos, sufixo `-4`, fallback ligado ao caso de uso). São 14 sobreviventes e 2 equivalentes em 60 mutantes. **A infra (T19–T28) não começa** até T45–T49 fecharem.

**Data**: 2026-11-08
**Spec**: `.specs/features/vitrine-e-selo/spec.md`
**Diff range**: `96c313f..ed49618` (55 commits; em `api/`, 39 arquivos, +2246/−58). Fora de `src/domain/**` e `test/doubles/**`, o grupo tocou `src/infra/database/prisma/repositories/prisma-{empresa,campanha}-repository.ts` (stubs que rejeitam "não implementado: T20/T21") e `test/database/criar-empresa-transacao.e2e-spec.ts` (+3 linhas de delegação).
**Verifier**: sub-agente independente (autor ≠ verificador), somente leitura sobre `src/`, `test/` e `web/`. Escreve só este arquivo.
**Rodada**: 1 de 3. Escopo: domínio T1–T18 (VIT-01, VIT-02, VIT-04, VIT-06 e VIT-08, na parte de domínio). ACs só de HTTP, infra ou `web` ficam marcados "fora do escopo deste gate (Tn)". Sem UAT.

Caminhos abreviados: `SH/` = `src/domain/fivo/shared/`, `EM/` = `src/domain/fivo/empresas/`, `CA/` = `src/domain/fivo/campanhas/`, `D/` = `test/doubles/`.

---

## Histórico

| Rodada | Diff | Verdict | Resumo |
| ------ | ---- | ------- | ------ |
| 1 | `96c313f..ed49618` | ❌ FAIL | Este relatório. Gate build: build/tsc/eslint 0, unit 689/689, e2e 507/546 (as 39 falhas vêm dos stubs de T20/T21). 60 mutantes: 44 mortos, 14 sobreviventes, 2 equivalentes. Abre T45–T49 |

---

## Gate Check

- **Gate command** (`tasks.md`, Build): `cd api && npm run build && npx tsc -p tsconfig.json --noEmit && npx eslint "{src,test}/**/*.ts" && npx jest && npx jest --config ./test/jest-e2e.json`, rodado na árvore real depois de `docker compose -f docker-compose.test.yml up -d && npx prisma migrate deploy` (Docker disponível, `fivo-postgres-test` saudável, migrations aplicadas).

| Etapa | Exit | Resultado |
| ----- | ---- | --------- |
| `npm run build` | 0 | ok |
| `tsc --noEmit` | 0 | ok |
| `eslint` | 0 | nenhum erro, nenhum aviso. Inclui as regras de import entre fatias (`eslint.config.mjs:86-113`, ordem `FATIAS_DOMINIO`). `campanhas → empresas` (`gerar-selo.ts`, `listar-campanhas-da-empresa.ts`, `buscar-empresa-publica.ts`) respeita AD-022 |
| `jest` (unit) | 0 | 72 suites, **689/689**, 0 skip |
| `jest` e2e | 1 | 35 suites, **507/546**: 39 falhas em 6 suites de `test/http/` |

- **e2e: diagnóstico das 39 falhas.** Todas vêm dos stubs provisórios do grupo: `PrismaEmpresaRepository.listarSlugsComPrefixo` (`src/infra/database/prisma/repositories/prisma-empresa-repository.ts:63`) e `PrismaCampanhaRepository.listarPorEmpresa` (`prisma-campanha-repository.ts:130`) rejeitam `"não implementado: T20"` (6 ocorrências no log) e `"não implementado: T21"` (33). Agora `AprovarEmpresaUseCase` e `AprovarCampanhaUseCase` chamam esses métodos, então toda aprovação de empresa ou de campanha responde **500**. Isso derruba `admin-empresas`, `empresas/concorrencia`, `admin-campanhas`, `campanhas-concorrencia`, `campanhas-publicas` (os fixtures aprovam via HTTP) e `email-pendente`. **Baseline**: em `96c313f` o mesmo comando no mesmo banco dá **546/546** (35 suites). A regressão é nova e foi introduzida por este diff.
  - **Julgamento**: não bloqueia o gate do domínio. A falha é estrutural ao AD-023: o domínio precisa das portas novas, e quem as implementa é a infra T20/T21, que só começa depois deste gate. O stub que rejeita é a escolha certa, porque é melhor do que um stub que devolve `[]` e atribui slug errado em silêncio. **Duas consequências**, porém: (a) T20 e T21 passam a ter como Done-when explícito "e2e de volta a 546/546" (follow-up 1); (b) **hoje a `homologacao` não aprova empresa nem campanha**. Quem integrar o `web` contra a API de `homologacao` antes de T21 recebe 500 em `/admin/.../aprovacao`.
  - `test/database/criar-empresa-transacao.e2e-spec.ts` passa: a delegação de `findBySlug` e `listarSlugsComPrefixo` só existe para satisfazer o tipo `EmpresaRepository`, e o teste não chama nenhum dos dois.
- **Contagem de testes**: unit **602** em `96c313f` → **689** agora (**+87**). e2e 546 → 546 (sem testes novos; T19–T28 são da infra).
- **Integridade** (`git diff 96c313f..HEAD -- '*.spec.ts' '*.e2e-spec.ts'`): 13 arquivos, +1499/−5. As 5 linhas removidas são 4 imports reescritos e a assinatura `criarEmpresaPendente()` ganhando `props`. **Nenhum `it(` removido, nenhum arquivo de teste apagado, nenhuma asserção enfraquecida.** `buscar-campanha-publica.spec.ts` está intacto (Done-when da T16).

---

## Task Completion

| Task | Status | Evidência |
| ---- | ------ | --------- |
| T1 `Slug` + `proximoSlugLivre` | ⚠️ | `SH/entities/slug.ts:8-45`. Done-when no teste: "Café Serra Verde" `SH/entities/slug.spec.ts:5`, "  Água & Sabão!! " `:11`, "ÇÃO--já" `:15`; 60 → 60 `:18-22`; 61 → 60 `:24-28`; hífen final do truncamento `:30-34`; fallback `:36-42`; os 4 casos de `proximoSlugLivre` `:52-74`. Exportado (`SH/index.ts:3`). **Lacunas fora da Done-when, mas dentro do AC3/AC5**: nenhum texto com dígito (M2 vivo) e nenhum caso com base, `-2` e `-3` ocupados (M9 vivo) → T46 |
| T2 Erros de slug | ✅ | `SH/errors/slug.errors.ts:4-19`: os dois `implements UseCaseError`, `status = 409`. Exportados (`SH/index.ts:13`) |
| T3 `Empresa.slug` | ✅ | `EM/entities/empresa.ts:45`, `:63`, `:142-144`, `:182-191`. Nasce nulo `EM/entities/empresa.spec.ts:298`; grava `:304`; segunda chamada → `SlugJaAtribuidoError` e original mantido `:313-322`; suspender/reativar `:324-335`; sem setter `:337-345`; edição de `nomeFantasia` `EM/use-cases/editar-dados-empresa.spec.ts:64-84` (`gravada.slug?.valor).toBe('cafe-serra-verde')`) |
| T4 `Campanha.slug` | ✅ | `CA/entities/campanha.ts:51`, `:92`, `:139-141`, `:287-295`. `CA/entities/campanha.spec.ts:819` (nulo), `:828` (grava), `:837` (`SlugJaAtribuidoError` + original), `:848` (`editarTextos`), `:859` (aprovação de alteração); caso de uso `CA/use-cases/aprovar-alteracao-campanha.spec.ts:322-334` |
| T5 Porta de empresa | ✅ | `EM/ports/empresa-repository.ts:10-12`: `findBySlug(slug: string): Promise<Empresa \| null>` e `listarSlugsComPrefixo(prefixo: string): Promise<string[]>`, iguais a design §Portas. JSDoc de `salvarTransicao` com `slug` e `SlugEmUsoError` em `:31-35` |
| T6 Porta de campanha | ⚠️ | Assinatura `listarPorEmpresa(empresaId: string): Promise<Campanha[]>` igual ao design (`CA/ports/campanha-repository.ts:30`). **O What da T6 e design §Portas ("Contrato documentado no JSDoc") pedem que o JSDoc de `salvar` documente a gravação de `slug` e o `SlugEmUsoError`, e ele não documenta** (`:10-25`, texto anterior à feature). O JSDoc de `listarEmAnalise` ("Campanhas `EM_ANALISE` e campanhas `APROVADA` com alteração pendente.") foi apagado sem motivo (`:27`). É o contrato que a T21 implementa → T49 |
| T7 `RenderizadorDeSelo` | ✅ | `CA/ports/renderizador-de-selo.ts:1-8` (`renderizar(dados: { slugEmpresa; slugCampanha }): Promise<string>`, igual ao design); exportada `CA/index.ts:12` |
| T8 Double de empresa | ⚠️ | Métodos e conflito forçado em `D/in-memory-empresa-repository.ts:56-66`, `:92-102`, `:150-181`. Os testes antigos estão verdes. **Mas o contrato que o double fixa para a T20 não tem nenhum teste**: o filtro por prefixo (`:100`, M52 vivo) e a unicidade natural em `salvarTransicao` (`:168-177`, M53 vivo). O double de campanha tem spec próprio (`D/in-memory-campanha-repository.spec.ts`); o de empresa não → T48 |
| T9 Double de campanha | ✅ | `D/in-memory-campanha-repository.ts:67-77`, `:103-128`, `:145-151`. Spec do double: lista por empresa em ordem `:40-62`, vazia `:64-70`, ida e volta do slug `:74-85`, conflito na mesma empresa sem gravar (`rejects.toThrow('Slug já está em uso')`, `slug` nulo, `versao` 0) `:87-98`, empresas diferentes `:100-110`, auto-salvar `:112-122`, CAS antes do slug `:124-131`, conflito forçado `:135-195` |
| T10 `FakeRenderizadorDeSelo` | ✅ | `D/fake-renderizador-de-selo.ts:6-15`: string determinística com os dois slugs e `chamadas` registradas |
| T11 Factories com `slug` | ✅ | Sem mudança de código e sem precisar dela: `EmpresaFactory.create` e `CampanhaFactory.*` recebem `Partial<…Props>` (`test/factories/empresa-factory.ts:6-8`, `test/factories/campanha-factory.ts:52-53`), e `slug` entrou nas props (T3/T4). O padrão nulo vem da entidade. Usado em todos os specs novos. (O Where da task cita `make-empresa.ts`, arquivo que não existe; os reais são `*-factory.ts`) |
| T12 Aprovar empresa com slug | ⚠️ | `EM/use-cases/aprovar-empresa.ts:20`, `:92-107`, `:109-142`. Done-when: `cafe-serra-verde` `EM/use-cases/aprovar-empresa.spec.ts:218-228`; `-2` `:230-248`; mantém o existente `:250-262`; conflito forçado → `-2` `:264-278`; 3 conflitos → relança, `PENDENTE_APROVACAO`, sem auditoria nem e-mail `:297-315`; outro erro sem retry `:317-331`. **Lacuna**: o fallback `'empresa'` não é exercido pelo caso de uso (M14 vivo) → T47 |
| T13 Aprovar campanha com slug | ⚠️ | `CA/use-cases/aprovar-campanha.ts:20`, `:81-97`, `:99-151`. `CA/use-cases/aprovar-campanha.spec.ts:241` (slug do nome), `:250` (`-2` na mesma empresa), `:262` (outra empresa sem sufixo), `:273` (mantém), `:286` (conflito forçado → `-2`), `:299` (2 conflitos → sucesso), `:314` (3 conflitos → relança, `EM_ANALISE`, sem auditoria), `:331` (outro erro). **Lacuna**: o fallback `'campanha'` não é exercido (M22 vivo) → T47 |
| T14 Listar campanhas da empresa | ✅ | `CA/use-cases/listar-campanhas-da-empresa.ts:39-66`. `CA/use-cases/listar-campanhas-da-empresa.spec.ts:57-80` (`toEqual` exato), `:82` (só dela), `:95` (3 datas, desc), `:121` (regra nula), `:131`/`:152` (`POR_UNIDADE` com `valor`, `PERCENTUAL` com `percentual: '2.50'`), `:203-214` (`toEqual(new ResourceNotFoundError('Empresa não encontrada'))`), `:193` (vazia) |
| T15 Gerar selo | ✅ | `CA/use-cases/gerar-selo.ts:30-58`; erro `CA/errors/campanha-nao-aprovada.error.ts:3-9`. `CA/use-cases/gerar-selo.spec.ts:52-65` (SVG e chamada exatos), `:67` (idêntico), `:96-117` (um teste por estado: `status).toBe(409)` + `message).toBe('Campanha não está aprovada')` + renderizador não chamado), `:119`/`:128` (`toEqual(naoEncontrada)`) |
| T16 Extrair campanha pública | ✅ | `CA/use-cases/campanha-publica.ts:9-28`; `buscar-campanha-publica.ts:97-107` passa a usar a função. `buscar-campanha-publica.spec.ts` sem diff. `CA/use-cases/campanha-publica.spec.ts:38` (amanhã → `NAO_INICIADA`), `:42` (hoje → `EM_ANDAMENTO`) |
| T17 Empresa pública | ❌ | `CA/use-cases/buscar-empresa-publica.ts:63-118`. O Done-when diz "Empresa `APROVADA` → campos do contrato, **nenhum outro** (o teste compara as chaves exatas)", e isso o teste cumpre (`CA/use-cases/buscar-empresa-publica.spec.ts:87-116`). Mas a T17 também implementa AC1/AC2, que fixam **o conteúdo** desses campos, e nenhum valor é conferido além de `regraDoacao` no teste da pendência (`:175`) e de `slug` (`:144`, `:154`). Ver a tabela da Página pública: M36–M40, M46 e M47 vivos. O filtro "fora `RASCUNHO`/`EM_ANALISE`/`REJEITADA`" (`:118-145`) passa por acaso: essas campanhas não têm slug, então o filtro de slug as remove sozinho (M41 vivo) → T45 |
| T18 Listar parceiros | ✅ | `EM/use-cases/listar-parceiros.ts:19-46`. `EM/use-cases/listar-parceiros.spec.ts:17-50` (um de cada estado), `:52-82` ("Abelha", "água", "Zebu"), `:84-103` (sem slug fora), `:105-145` (`toEqual` exato com `temLogo` dos dois lados), `:147` (vazia). Gate build: unit verde; e2e com a regressão estrutural acima |

---

## Spec-Anchored Acceptance Criteria

Legenda: ✅ evidência no valor da spec; ❌ lacuna; ⚠️ SPn = spec-precision gap (não bloqueia); **fora do escopo (Tn)** = AC só de HTTP, infra ou `web`.

### P1: Slug permanente (VIT-01)

| AC | Spec-defined outcome | `file:line` + asserção | Result |
| -- | -------------------- | ---------------------- | ------ |
| AC1 aprovar empresa sem slug | slug derivado de `nomeFantasia` | `EM/use-cases/aprovar-empresa.spec.ts:227` `aprovada.slug?.valor).toBe('cafe-serra-verde')` (M15 morto) | ✅ |
| AC2 aprovar campanha sem slug | slug derivado de `nome` | `CA/use-cases/aprovar-campanha.spec.ts:247` `slug?.valor).toBe('verao-solidario')` | ✅ |
| AC3 regra de formação | minúsculas, sem acento, **fora de `a-z0-9`** → hífen, sem hífen nas pontas, 60 sem hífen final | `SH/entities/slug.spec.ts:5`, `:11`, `:15`, `:18-34` (`toBe` exato; M1, M3–M6 mortos). **Nenhum caso com dígito**: trocar `[^a-z0-9]` por `[^a-z]` passa (M2). Um nome como "Café 2000" viraria `cafe` | ❌ (T46) |
| AC4 fallback | `empresa` / `campanha` | VO: `SH/entities/slug.spec.ts:37` `toBe('empresa')`, `:41` `toBe('campanha')` (M7 morto). **Ligação no caso de uso sem teste**: `aprovar-empresa.ts:125` com `'campanha'` (M14) e `aprovar-campanha.ts:131` com `'empresa'` (M22) passam. A spec define o valor por entidade, e o que garante isso é o argumento passado no caso de uso | ❌ (T47) |
| AC5 empresa homônima | menor sufixo livre `-2`, `-3`… | `EM/use-cases/aprovar-empresa.spec.ts:275` `toBe('cafe-serra-verde-2')`; `SH/entities/slug.spec.ts:58-74` (`-2`, `-3`, base livre com `-2` ocupado; M8 e M10 mortos). **"e assim por diante" sem teste**: `while` → `if` passa (M9), e com base, `-2` e `-3` ocupados devolveria `-3`, que está ocupado. O contrato de `listarSlugsComPrefixo`, que alimenta os `ocupados`, também não tem teste (M52) | ❌ (T46, T48) |
| AC6 campanha homônima | sufixo por empresa; empresas diferentes podem repetir | `CA/use-cases/aprovar-campanha.spec.ts:259` `toBe('verao-solidario-2')`, `:270` `toBe('verao-solidario')`; double `D/in-memory-campanha-repository.spec.ts:100-110` (M57, M58 mortos) | ✅ |
| AC7 imutável | não muda ao editar nome, suspender/reativar, aprovar alteração, nem em reaprovação | `EM/use-cases/editar-dados-empresa.spec.ts:83` (M13 morto); `EM/entities/empresa.spec.ts:333`, `:334`; `CA/entities/campanha.spec.ts:855`, `:866`; `CA/use-cases/aprovar-alteracao-campanha.spec.ts:333`; mantém o existente `EM/use-cases/aprovar-empresa.spec.ts:261`, `CA/use-cases/aprovar-campanha.spec.ts:283`; invariante `EM/entities/empresa.spec.ts:313-322`, `CA/entities/campanha.spec.ts:837-846` (M11, M12 mortos) | ✅ |

### P1: Campanhas na área da empresa (VIT-02)

| AC | Spec-defined outcome | `file:line` + asserção | Result |
| -- | -------------------- | ---------------------- | ------ |
| AC1 só as dela, `createdAt` desc | lista completa e ordenada | `CA/use-cases/listar-campanhas-da-empresa.spec.ts:92` `toEqual([minha])`, `:114-118` (3 datas). A ordem fica na porta: `D/in-memory-campanha-repository.spec.ts:58-61` (M60 morto). HTTP 200: fora do escopo (T24) | ✅ |
| AC2 campos | `id`, `nome`, `status`, `regraDoacao` (`tipo` + `valor`/`percentual` ou `null`), `urlPublica` | `:68-79` `toEqual` exato; `:128` `toBeNull()`; `:146-149`, `:167-170` (M27–M29 mortos). `urlPublica` é montada na infra a partir de `slugEmpresa` + `slug` (design) | ✅ (`urlPublica`: T24) |
| AC3 `urlPublica` só em `APROVADA` | URL ou `null` | Insumos `slug`/`slugEmpresa` nulos em `:180`, `:190`. A regra por status é do presenter | fora do escopo (T24) |
| AC4 403 sem papel `EMPRESA` | 403 | — | fora do escopo (T24) |
| AC5–AC10 | telas | — | fora do escopo (`web`) |

### P1: Selo genérico (VIT-04)

| AC | Spec-defined outcome | `file:line` + asserção | Result |
| -- | -------------------- | ---------------------- | ------ |
| AC1 200 SVG + `Content-Disposition` | `filename="selo-{slugCampanha}.svg"` | O domínio devolve `slugCampanha`: `CA/use-cases/gerar-selo.spec.ts:58-61` `toEqual({ svg, slugCampanha: 'agua-limpa' })`. Os cabeçalhos são HTTP | fora do escopo (T25) |
| AC2–AC4 conteúdo do SVG, nível Q, margem 4, vetorial | — | Os slugs certos chegam ao renderizador: `:62-64` (M32 morto) | fora do escopo (T23) |
| AC5 bytes idênticos | mesma resposta | `:67-75` `segunda.value).toEqual(primeira.value)` (com o fake; os bytes reais são da T23) | ✅ (domínio) |
| AC6 não aprovada | 409 "Campanha não está aprovada" | `:96-117` (3 estados): `status).toBe(409)`, `message).toBe('Campanha não está aprovada')`, `chamadas).toEqual([])` (M31 morto) | ✅ |
| AC7 inexistente ou de outra empresa | 404 "Campanha não encontrada" | `:119-137` `toEqual(new ResourceNotFoundError('Campanha não encontrada'))` (M30 morto). O corpo HTTP literal: ver follow-up 2 | ✅ (domínio) |
| AC8 403 | — | — | fora do escopo (T25) |
| AC9 botão | — | — | fora do escopo (`web`) |

### P1: Página pública da empresa (VIT-06)

| AC | Spec-defined outcome | `file:line` + asserção | Result |
| -- | -------------------- | ---------------------- | ------ |
| AC1 200 com `nomeFantasia`, `cidade`, `uf`, `site`, `temLogo`, `campanhas` | os campos **com os valores da empresa** | Só as chaves: `CA/use-cases/buscar-empresa-publica.spec.ts:94-104` `Object.keys(res.value).sort()).toEqual([...])`. **Nenhum valor conferido**: `temLogo: true` fixo (M38) e `site: empresa.cidade` (M39) passam | ❌ (T45) |
| AC2 só `APROVADA`, aprovação desc, com `slug`, `nome`, `descricao`, `beneficiada` (`nome`, `tipo`), `regraDoacao`, `vigencia`, `situacao` | lista filtrada, ordenada e com valores | Ordem: `:154-158` (M43 morto). Chaves: `:105-115`. Pendência: `:175-178` (M45 morto). **Valores sem asserção**: `situacao` fixa `'EM_ANDAMENTO'` (M36), beneficiada com `nome: ''` (M37), `descricao: null` (M40), `nome` da campanha trocado (M46) e `vigencia` falsa (M47) passam. **Filtro de status sem discriminação**: as campanhas fora de `APROVADA` em `:128-139` não têm slug, então remover `c.status === APROVADA` passa (M41) | ❌ (T45) |
| AC3 404 "Empresa não encontrada", mesmo corpo | inexistente e fora de `APROVADA` | `:184-201` `res.value).toEqual(new ResourceNotFoundError('Empresa não encontrada'))` para inexistente, `PENDENTE_APROVACAO`, `REJEITADA`, `SUSPENSA` (M44, M54 mortos). Corpo HTTP: follow-up 2 | ✅ (domínio) |
| AC4 omitir campos sensíveis | nada além do contrato | `:94-115` (chaves exatas nos dois níveis); tipo `EmpresaPublica` (`CA/use-cases/buscar-empresa-publica.ts:35-43`) | ✅ |
| AC5 logo | — | `temLogo` só como chave (ver AC1) | fora do escopo (T28) |
| AC6–AC13 | telas | — | fora do escopo (`web`) |

### P1: Vitrine de parceiros (VIT-08)

| AC | Spec-defined outcome | `file:line` + asserção | Result |
| -- | -------------------- | ---------------------- | ------ |
| AC1 só `APROVADA` com `slug`, `nomeFantasia`, `cidade`, `uf`, `temLogo` | lista exata | `EM/use-cases/listar-parceiros.spec.ts:49` `toEqual(['aprovada'])` (M48 morto); `:129-144` `toEqual` completo com `temLogo` `true`/`false` (M51 morto). HTTP 200: T26 | ✅ |
| AC2 alfabética sem caixa nem acento | `Intl.Collator('pt-BR', { sensitivity: 'base' })` | `:77-81` `toEqual(['Abelha', 'água', 'Zebu'])` (M49 morto) | ✅ / ⚠️ SP1 |
| AC3–AC5 | telas | — | fora do escopo (`web`) |

**Status**: ❌ Há lacunas. Dos **18** ACs com regra de domínio, **13** batem com o valor da spec e **5** têm lacuna (Slug AC3, AC4, AC5; Página AC1, AC2). Os ACs de Nova campanha, Detalhe e Fila do admin (VIT-10…12) são só `web` e ficam todos fora do escopo deste gate.

### Spec-precision gaps

- **SP1 — desempate da vitrine** (Vitrine AC2). "Sem diferenciar maiúsculas de minúsculas nem acentuadas" não diz a ordem entre nomes que só diferem em caixa ou acento ("Agua" × "água"). Com `sensitivity: 'base'` eles empatam e vale a ordem do repositório. Por isso M50 (`'variant'`) é equivalente frente à spec. Não bloqueia.
- **SP2 — `descricao` nula na página pública** (Página AC2). O contrato do design mostra `"descricao": "texto"`, e o tipo do domínio é `string | null` (`CA/use-cases/buscar-empresa-publica.ts:28`). Uma campanha `APROVADA` passou pela submissão. Se a descrição for opcional na submissão, o `web` precisa tratar `null`. A spec não diz. Não bloqueia.

---

## Edge Cases

- [x] **Aprovações simultâneas com o mesmo nome** → slugs distintos, as duas passam: empresa `EM/use-cases/aprovar-empresa.spec.ts:264-295` (conflito forçado → `-2`; 2 conflitos → sucesso), campanha `CA/use-cases/aprovar-campanha.spec.ts:286-312`. Esgotadas as 3 tentativas, o erro é relançado sem gravar (`:297-315` / `:314-329`). Mutantes M17–M20 e M23–M26 mortos.
- [x] **Empresa suspensa** → 404 na pública (`CA/use-cases/buscar-empresa-publica.spec.ts:189-201`, caso `SUSPENSA`), fora da vitrine (`EM/use-cases/listar-parceiros.spec.ts:39-49`) e slug preservado na reativação (`EM/entities/empresa.spec.ts:324-335`).
- [x] **Alteração pendente** → a página mostra o compromisso aprovado: `CA/use-cases/buscar-empresa-publica.spec.ts:161-179` (M45 morto).
- [ ] HTML/script como texto e logo quebrado → `web` (fora do escopo).

---

## Discrimination Sensor

**Profundidade**: P0 (integridade de dados: slug imutável, unicidade, retry). `git worktree add --detach <scratchpad>/wt-sensor HEAD` (`ed49618`), com `api/node_modules` como link simbólico para o da árvore real. Baseline no worktree: 689/689. Cada mutante foi aplicado por script (`sensor.py` no scratchpad), com substituição exata e exigência de **uma única ocorrência**, testado com a suíte unit inteira (`npx jest --silent --json`) e revertido com `git checkout --`, com conferência byte a byte do arquivo restaurado (60/60). **Nenhuma morte veio de erro de compilação** (0 suites com falha de execução; o tsconfig usa `isolatedModules` sem `noUnused*`). No fim, o link foi apagado, o worktree removido com `git worktree remove --force` e `git worktree prune` rodou (`git worktree list` só mostra a árvore real). `git stash` não foi usado.

**Isolamento**: o `git status --porcelain` da árvore real estava vazio antes do sensor. Depois aparecem `api/.specs/LESSONS.md`, `api/.specs/lessons.json` e `?? api/.specs/features/vitrine-e-selo/validation-web.md`. **Nenhum desses é deste verificador**: são do verificador do `web` e da destilação de lições, que rodaram em paralelo no mesmo scratchpad (também removeram os worktrees `wt` e `wt-base` deles). `git status --porcelain -- api/src api/test api/prisma web` = vazio antes e depois. O sensor não tocou a árvore real.

| # | Alvo | File:line | Mutação | Resultado |
| - | ---- | --------- | ------- | --------- |
| M1 | AC3 acento | `SH/entities/slug.ts:12` | remove `.replace(/\p{M}/gu, '')` | ✅ morto (7) |
| M2 | AC3 dígitos | `SH/entities/slug.ts:13` | `[^a-z0-9]+` → `[^a-z]+` | ❌ **vivo** |
| M3 | AC3 caixa | `SH/entities/slug.ts:10` | remove `.toLowerCase()` | ✅ morto (12) |
| M4 | AC3 limite | `SH/entities/slug.ts:15` | `slice(0, 60)` → `slice(0, 61)` | ✅ morto (2) |
| M5 | AC3 hífen final | `SH/entities/slug.ts:16` | remove o `replace(/-+$/)` pós-truncamento | ✅ morto (`slug.spec:30`) |
| M6 | AC3 hífen inicial | `SH/entities/slug.ts:14` | `^-+\|-+$` → `-+$` | ✅ morto (`slug.spec:10`) |
| M7 | AC4 | `SH/entities/slug.ts:18` | `valor \|\| padrao` → `valor \|\| 'empresa'` | ✅ morto (`slug.spec:40`) |
| M8 | AC5 | `SH/entities/slug.ts:38` | `sufixo = 2` → `3` | ✅ morto (5) |
| M9 | AC5 "e assim por diante" | `SH/entities/slug.ts:40` | `while` → `if` | ❌ **vivo** |
| M10 | AC5 base livre | `SH/entities/slug.ts:34-36` | remove o retorno antecipado da base | ✅ morto (11) |
| M11 | AC7 empresa | `EM/entities/empresa.ts:184` | guarda de `atribuirSlug` → `false` | ✅ morto (`empresa.spec:313`) |
| M12 | AC7 campanha | `CA/entities/campanha.ts:288` | guarda de `atribuirSlug` → `false` | ✅ morto (`campanha.spec:837`) |
| M13 | AC7 edição | `EM/use-cases/editar-dados-empresa.ts:105` | remove `slug: empresa.slug` da recriação | ✅ morto (`editar-dados-empresa.spec:64`) |
| M14 | AC4 ligação | `EM/use-cases/aprovar-empresa.ts:125` | padrão `'empresa'` → `'campanha'` | ❌ **vivo** |
| M15 | AC1 | `EM/use-cases/aprovar-empresa.ts:125` | `nomeFantasia` → `razaoSocial` | ✅ morto (4) |
| M16 | AC5 | `EM/use-cases/aprovar-empresa.ts:129` | `ocupados` → `[]` | ✅ morto (2) |
| M17 | retry | `EM/use-cases/aprovar-empresa.ts:20` | 3 → 2 tentativas | ✅ morto (`aprovar-empresa.spec:280`) |
| M18 | retry | `EM/use-cases/aprovar-empresa.ts:20` | 3 → 4 tentativas | ✅ morto (`:297`, `toHaveBeenCalledTimes(3)`) |
| M19 | retry | `EM/use-cases/aprovar-empresa.ts:101` | repete em qualquer erro | ✅ morto (`:317`) |
| M20 | retry | `EM/use-cases/aprovar-empresa.ts:102` | `>=` → `>` | ✅ morto (`:297`) |
| M21 | AC7 | `EM/use-cases/aprovar-empresa.ts:124` | `if (!empresa.slug)` → `if (true)` | ⚪ **equivalente** (abaixo) |
| M22 | AC4 ligação | `CA/use-cases/aprovar-campanha.ts:131` | padrão `'campanha'` → `'empresa'` | ❌ **vivo** |
| M23 | AC6 | `CA/use-cases/aprovar-campanha.ts:138` | `ocupados` → `[]` | ✅ morto (2) |
| M24 | retry | `CA/use-cases/aprovar-campanha.ts:20` | 3 → 2 | ✅ morto (2) |
| M25 | retry | `CA/use-cases/aprovar-campanha.ts:20` | 3 → 4 | ✅ morto (`aprovar-campanha.spec:314`) |
| M26 | retry | `CA/use-cases/aprovar-campanha.ts:90` | repete em qualquer erro | ✅ morto (`:331`) |
| M27 | Área AC2 | `CA/use-cases/listar-campanhas-da-empresa.ts:61-63` | `regraDoacao` sempre `null` | ✅ morto (3) |
| M28 | Área AC2/AC3 | `CA/use-cases/listar-campanhas-da-empresa.ts:64` | `slug: null` | ✅ morto |
| M29 | Área AC3 | `CA/use-cases/listar-campanhas-da-empresa.ts:51` | `slugEmpresa: null` | ✅ morto (2) |
| M30 | Selo AC7 | `CA/use-cases/gerar-selo.ts:36` | remove a checagem de dono | ✅ morto (`gerar-selo.spec:128`) |
| M31 | Selo AC6 | `CA/use-cases/gerar-selo.ts:40` | remove a checagem de `APROVADA` | ✅ morto (3) |
| M32 | Selo AC2 | `CA/use-cases/gerar-selo.ts:53-54` | troca `slugEmpresa` ↔ `slugCampanha` | ✅ morto (2) |
| M33 | Selo | `CA/use-cases/gerar-selo.ts:47` | não exige o slug da empresa | ✅ morto (`gerar-selo.spec:148`) |
| M34 | Página AC2 | `CA/use-cases/campanha-publica.ts:27` | inverte `NAO_INICIADA`/`EM_ANDAMENTO` | ✅ morto (5) |
| M35 | Página AC2 | `CA/use-cases/campanha-publica.ts:15` | `=== 'INSTITUICAO'` → `!==` | ✅ morto (4) |
| M36 | Página AC2 `situacao` | `CA/use-cases/buscar-empresa-publica.ts:105` | `situacao: 'EM_ANDAMENTO'` fixo | ❌ **vivo** |
| M37 | Página AC2 beneficiada | `CA/use-cases/buscar-empresa-publica.ts:97-101` | `nome` da beneficiada → `''` | ❌ **vivo** |
| M38 | Página AC1 `temLogo` | `CA/use-cases/buscar-empresa-publica.ts:115` | `temLogo: true` fixo | ❌ **vivo** |
| M39 | Página AC1 `site` | `CA/use-cases/buscar-empresa-publica.ts:114` | `site: empresa.cidade` | ❌ **vivo** |
| M40 | Página AC2 `descricao` | `CA/use-cases/buscar-empresa-publica.ts:94` | `descricao: null` | ❌ **vivo** |
| M41 | Página AC2 filtro | `CA/use-cases/buscar-empresa-publica.ts:76` | remove `status === APROVADA` (fica só `!!c.slug`) | ❌ **vivo** |
| M42 | Página AC2 sem slug | `CA/use-cases/buscar-empresa-publica.ts:76` | remove `!!c.slug` | ✅ morto (`buscar-empresa-publica.spec:118`) |
| M43 | Página AC2 ordem | `CA/use-cases/buscar-empresa-publica.ts:79` | ordem crescente | ✅ morto (`:147`) |
| M44 | Página AC3 | `CA/use-cases/buscar-empresa-publica.ts:67` | remove `estaAprovada()` | ✅ morto (3) |
| M45 | edge alteração | `CA/use-cases/buscar-empresa-publica.ts:86` | expõe o compromisso proposto | ✅ morto (`:161`) |
| M46 | Página AC2 `nome` | `CA/use-cases/buscar-empresa-publica.ts:93` | `nome: empresa.nomeFantasia` | ❌ **vivo** |
| M47 | Página AC2 `vigencia` | `CA/use-cases/buscar-empresa-publica.ts:104` | `vigencia` falsa (`{ inicio: '2000-01-01' }`) | ❌ **vivo** |
| M48 | Vitrine AC1 | `EM/use-cases/listar-parceiros.ts:21` | `APROVADA` → `SUSPENSA` | ✅ morto (4) |
| M49 | Vitrine AC2 | `EM/use-cases/listar-parceiros.ts:27` | collator → `<` por código | ✅ morto (`listar-parceiros.spec:52`) |
| M50 | Vitrine AC2 | `EM/use-cases/listar-parceiros.ts:13` | `sensitivity: 'base'` → `'variant'` | ⚪ **equivalente** (SP1) |
| M51 | Vitrine AC1 | `EM/use-cases/listar-parceiros.ts:43` | `temLogo: true` fixo | ✅ morto (`:105`) |
| M52 | contrato T20 (prefixo) | `D/in-memory-empresa-repository.ts:100` | `startsWith(prefixo)` → `=== prefixo` | ❌ **vivo** |
| M53 | contrato T20 (unicidade) | `D/in-memory-empresa-repository.ts:175-177` | remove o `SlugEmUsoError` natural | ❌ **vivo** |
| M54 | `findBySlug` | `D/in-memory-empresa-repository.ts:93` | devolve a primeira empresa com slug | ✅ morto (4) |
| M55 | double: corrida | `D/in-memory-empresa-repository.ts:153` | conflito forçado não guarda a rival | ✅ morto (`aprovar-empresa.spec:264`) |
| M56 | double: ida e volta | `D/in-memory-empresa-repository.ts:48` | `copiar` sem `slug` | ✅ morto (18) |
| M57 | contrato T21 (por empresa) | `D/in-memory-campanha-repository.ts:121` | unicidade global em vez de por empresa | ✅ morto (2) |
| M58 | contrato T21 (unicidade) | `D/in-memory-campanha-repository.ts:126-128` | remove o `SlugEmUsoError` natural | ✅ morto (2) |
| M59 | double: ida e volta | `D/in-memory-campanha-repository.ts:57` | `copiar` sem `slug` | ✅ morto (20) |
| M60 | contrato T21 (ordem) | `D/in-memory-campanha-repository.ts:148` | remove a ordenação `createdAt` desc | ✅ morto (2) |

**Result**: 60 injetados, **44 mortos**, **14 sobreviventes** (M2, M9, M14, M22, M36–M41, M46, M47, M52, M53), **2 equivalentes** (M21, M50). Sensor ❌ FAIL.

**Por que M21 é equivalente.** Com `if (true)`, uma entidade que já tem slug ainda calcula `ocupados` e chama `atribuirSlug`. Mas a guarda da entidade (`EM/entities/empresa.ts:184`, morta em M11) recusa a chamada com `SlugJaAtribuidoError`, e o caso de uso ignora o `Either`. O slug gravado e a resposta não mudam; sobra só uma consulta a mais. O mesmo vale para `aprovar-campanha.ts:130`. A invariante mora na entidade e lá está protegida. Ignorar o `Either` de `atribuirSlug` não é bug, porque o `if` já garante o ramo `right`. Ainda assim, vale uma linha de comentário (follow-up 6).

**Por que M50 é equivalente.** `'base'` e `'variant'` só divergem quando duas strings são iguais no nível primário ("Agua" × "água"). A spec não define o desempate (SP1).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Sem abstração além do design. `aprovarComSlug`/`tentarAprovar` duplicam o laço nas duas fatias, o que é aceitável (fatias diferentes, AD-022) |
| Surgical changes | ⚠️ Sumiu o JSDoc de `CampanhaRepository.listarEmAnalise` (`CA/ports/campanha-repository.ts:27`) → T49 |
| No scope creep | ✅ Os stubs em `src/infra` são o mínimo para compilar e rejeitam alto. Não implementam a T20/T21 por baixo do pano |
| Matches patterns | ✅ Retry por erro de domínio vindo do adaptador (padrão CNPJ); `Either` nas entidades; doubles com cópia por leitura |
| Spec-anchored outcome check | ❌ Página AC1/AC2 só com chaves; Slug AC3–AC5 com ramos sem valor-alvo |
| Per-layer Coverage Expectation | ❌ Matriz: "Value objects… todas as ramificações" (M2, M9); casos de uso "happy + cada erro + cada edge" (M14, M22, M36–M47) |
| Every test maps to a requirement | ✅ Todos os testes novos mapeiam para AC, edge ou Done-when. `gerar-selo.spec.ts:77` (empresa suspensa) mapeia para a premissa "Empresa suspensa baixando selo" da spec |
| Documented guidelines followed | `tasks.md` §Test Coverage Matrix (strong defaults); lições L-001 (mensagem literal: ✅ em `gerar-selo.spec:113`, `listar-campanhas-da-empresa.spec:208-213`), L-009 (limite dos dois lados: ✅ 60/61), "nada gravado" em erro (✅ `aprovar-*.spec` 3 conflitos; ✅ double de campanha) |

Notas menores (não bloqueiam):
- `EM/use-cases/editar-dados-empresa.spec.ts:70-72` diz "O double ainda não copia o slug (T8)". A T8 já está feita e o double copia (`D/in-memory-empresa-repository.ts:48`), então o `spyOn(findById)` sobra. O comentário está velho (follow-up 5).
- No double de empresa, o conflito forçado roda **antes** do CAS (`:151-155`); no de campanha, **depois** (`:103`). A diferença é inofensiva nos testes atuais, mas são dois contratos de corrida diferentes para a mesma ideia (follow-up 5).

---

## Fix Plans

Cinco tasks. T45 e T48 são **Major**: uma cobre a saída pública e a outra fixa o contrato que a infra vai implementar. T46, T47 e T49 são **Minor**. Todas são de teste ou de doc, nenhuma muda código de produção. Cabem num dia.

### T45: Valores do contrato da página pública da empresa

**What**: Fortalecer `buscar-empresa-publica.spec.ts` para conferir os **valores** de AC1/AC2, além das chaves:

1. Um teste com `jest.useFakeTimers({ now })` e empresa com `nomeFantasia`, `cidade`, `uf`, `site` e `logoArquivoId` definidos, que faz `toEqual` no objeto inteiro: empresa (`slug`, `nomeFantasia`, `cidade`, `uf`, `site`, `temLogo: true`) e campanha (`slug`, `nome`, `descricao`, `beneficiada: { tipo: 'INSTITUICAO', nome: <nomeFantasia da instituição> }`, `regraDoacao`, `vigencia: { inicio, fim }`, `situacao`).
2. `temLogo: false` para empresa sem logo.
3. `situacao` nos dois valores: início amanhã → `NAO_INICIADA`; início hoje → `EM_ANDAMENTO`.
4. No teste de exclusão (`:118-145`), dar **slug** às campanhas `RASCUNHO`, `EM_ANALISE` e `REJEITADA`, para que só o filtro de status as exclua.

**Where**: `src/domain/fivo/campanhas/use-cases/buscar-empresa-publica.spec.ts`
**Depends on**: None
**Requirement**: VIT-06 (Página AC1, AC2)
**Autor**: 👤 humano · **Responsável**: Pessoa 4
**Tests**: unit
**Gate**: quick
**Done when**:

- [ ] `toEqual` exato da resposta com todos os valores (empresa + campanha + beneficiada + vigência)
- [ ] `temLogo` `true` e `false` conferidos
- [ ] `situacao` `NAO_INICIADA` e `EM_ANDAMENTO` conferidas com relógio fixado
- [ ] Campanhas fora de `APROVADA` **com slug** ficam fora
- [ ] Mutantes M36, M37, M38, M39, M40, M41, M46 e M47 morrem
- [ ] Gate `quick` passa

**Commit**: `test(api): valores do contrato da página pública da empresa`

---

### T46: Dígitos no slug e sufixo além de `-3`

**What**: Dois casos em `slug.spec.ts`: (1) texto com dígitos preserva os dígitos, ex.: "Café 2000 Ltda." → `cafe-2000-ltda`; (2) `proximoSlugLivre` com base, `-2` e `-3` ocupados → `-4`.
**Where**: `src/domain/fivo/shared/entities/slug.spec.ts`
**Depends on**: None
**Requirement**: VIT-01 (Slug AC3, AC5)
**Autor**: 👤 humano · **Responsável**: Pessoa 1
**Tests**: unit
**Gate**: quick
**Done when**:

- [ ] Caso com dígitos com `toBe` exato
- [ ] Caso `-4` com `toBe` exato
- [ ] Mutantes M2 e M9 morrem
- [ ] Gate `quick` passa

**Commit**: `test(api): slug com dígitos e sufixo -4`

---

### T47: Fallback do slug ligado aos casos de uso de aprovação

**What**: Aprovar uma empresa com `nomeFantasia: '!!!'` → slug `empresa`; aprovar uma campanha com nome `'!!!'` (`NomeCampanha` aceita 3 caracteres após o trim) → slug `campanha`. Opcional e recomendado: segunda empresa `'!!!'` → `empresa-2`.
**Where**: `src/domain/fivo/empresas/use-cases/aprovar-empresa.spec.ts`, `src/domain/fivo/campanhas/use-cases/aprovar-campanha.spec.ts`
**Depends on**: None
**Requirement**: VIT-01 (Slug AC4)
**Autor**: 👤 humano · **Responsável**: Pessoa 1
**Tests**: unit
**Gate**: quick
**Done when**:

- [ ] `slug?.valor).toBe('empresa')` no caso de uso de empresa
- [ ] `slug?.valor).toBe('campanha')` no caso de uso de campanha
- [ ] Mutantes M14 e M22 morrem
- [ ] Gate `quick` passa

**Commit**: `test(api): fallback do slug na aprovação`

---

### T48: Spec do `InMemoryEmpresaRepository` (contrato de slug para a T20)

**What**: Criar `in-memory-empresa-repository.spec.ts` no molde de `in-memory-campanha-repository.spec.ts`, fixando o contrato que a T20 vai implementar no Prisma:

1. `listarSlugsComPrefixo('cafe')` com `cafe`, `cafe-2`, `cafeteria` e `outra` guardados → os três primeiros (o mesmo exemplo da Done-when da T20).
2. `salvarTransicao` de uma empresa cujo slug já pertence a **outra** empresa → `rejects.toBeInstanceOf(SlugEmUsoError)` e `rejects.toThrow('Slug já está em uso')`, com status e slug gravados intactos.
3. Salvar de novo a própria empresa com o slug dela → sem conflito.
4. `findBySlug` acha a empresa e devolve `null` para slug inexistente.
5. Conflito forçado: uma vez só, e a rival fica guardada.

Recomendado também, no caso de uso: terceira empresa homônima → `cafe-serra-verde-3` (`aprovar-empresa.spec.ts`).
**Where**: `test/doubles/in-memory-empresa-repository.spec.ts` (novo); `src/domain/fivo/empresas/use-cases/aprovar-empresa.spec.ts`
**Depends on**: None
**Requirement**: VIT-01 (Slug AC5), VIT-06
**Autor**: 👤 humano · **Responsável**: Pessoa 5
**Tests**: unit
**Gate**: quick
**Done when**:

- [ ] Os 5 casos acima com asserção no valor exato
- [ ] Mutantes M52 e M53 morrem
- [ ] Gate `quick` passa

**Commit**: `test(api): contrato de slug do double de empresa`

---

### T49: JSDoc do contrato de `CampanhaRepository`

**What**: (1) No JSDoc de `salvar`, acrescentar que ele grava `slug` e lança `SlugEmUsoError` quando o par `(empresaId, slug)` já existe (What da T6, design §Portas). (2) Restaurar o JSDoc de `listarEmAnalise` ("Campanhas `EM_ANALISE` e campanhas `APROVADA` com alteração pendente.").
**Where**: `src/domain/fivo/campanhas/ports/campanha-repository.ts`
**Depends on**: None
**Requirement**: VIT-01, VIT-02
**Autor**: 👤 humano · **Responsável**: Pessoa 2
**Tests**: none
**Gate**: quick
**Done when**:

- [ ] JSDoc de `salvar` cita `slug`, a unicidade por empresa e `SlugEmUsoError`
- [ ] JSDoc de `listarEmAnalise` de volta
- [ ] Gate `quick` passa

**Commit**: `docs(api): contrato de slug na porta de campanha`

---

## Follow-ups não bloqueantes

1. **e2e quebrado até a T21 (destino: T20, T21).** Acrescentar à Done-when das duas: "e2e de volta a **546/546** (as 39 falhas de `admin-empresas`, `empresas/concorrencia`, `admin-campanhas`, `campanhas-concorrencia`, `campanhas-publicas` e `email-pendente`, causadas pelos stubs)". Avisar o grupo: **a `homologacao` responde 500 em toda aprovação** (empresa e campanha) até a T21 entrar. Não integrar o `web` da fila do admin (T43) contra a API real antes disso.
2. **Mensagem literal do 404 (destino: T25, T27).** `DomainExceptionFilter` responde `{ statusCode: 404, message: 'Recurso não encontrado' }` para todo `ResourceNotFoundError` (`src/infra/http/domain-exception.filter.ts:65-71`). A spec exige "Campanha não encontrada" (Selo AC7) e "Empresa não encontrada" (Página AC3). A infra precisa mapear o texto, seja no filtro ou no controller, e o e2e precisa conferir a mensagem literal (L-001).
3. **Campanha `APROVADA` sem slug no selo (destino: T25 ou design).** `CA/use-cases/gerar-selo.ts:47-49` responde `CampanhaNaoAprovadaError` (409 "Campanha não está aprovada") quando falta o slug da campanha ou da empresa. Depois do backfill (T22) o caso não deveria ocorrer, mas a mensagem fica enganosa para uma campanha aprovada. Registrar a escolha no design ou trocar para 500 ou 404. Não é bloqueio do domínio.
4. **`descricao` nula (SP2, destino: T27/`web` T33).** Confirmar se uma campanha aprovada pode ter `descricao` nula e tipar o `web` de acordo.
5. **Higiene de testes (destino: qualquer PR do grupo).** Remover o comentário velho e o `spyOn` de `EM/use-cases/editar-dados-empresa.spec.ts:70-72`. Alinhar o momento do conflito forçado entre os dois doubles (antes ou depois do CAS).
6. **Comentário sobre o `Either` ignorado (destino: opcional).** `EM/use-cases/aprovar-empresa.ts:129` e `CA/use-cases/aprovar-campanha.ts:138` descartam o `Either` de `atribuirSlug`. Isso é correto (o `if` anterior garante o `right`), e uma linha de comentário evita que alguém ache que é bug (ver M21).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| VIT-01 (domínio) | In Tasks | ❌ Needs Fix (T46, T47, T48, T49) |
| VIT-02 (domínio) | In Tasks | ✅ Verificado no domínio (HTTP: T24) |
| VIT-04 (domínio) | In Tasks | ✅ Verificado no domínio (HTTP/SVG: T23, T25) |
| VIT-06 (domínio) | In Tasks | ❌ Needs Fix (T45) |
| VIT-08 (domínio) | In Tasks | ✅ Verificado no domínio (HTTP: T26) |

(Status sugerido; o verificador não edita `spec.md`.)

---

## Summary

**Overall**: ❌ Not Ready. Falta uma rodada curta de testes, sem mudança de produção.

**Spec-anchored check**: 13/18 ACs de domínio batem com a spec; 5 com lacuna (Slug AC3, AC4, AC5; Página AC1, AC2); 2 spec-precision gaps (SP1, SP2).
**Sensor**: 60 injetados, 44 mortos, 14 sobreviventes, 2 equivalentes.
**Gate**: build/tsc/eslint 0; unit 689/689 (+87); e2e 507/546, com as 39 falhas atribuídas aos stubs de T20/T21 (baseline 546/546).

**O que funciona**: normalização e truncamento do slug; imutabilidade nas três entidades e casos de uso; unicidade por empresa no double de campanha; retry de 3 tentativas com relançamento e "nada gravado" nas duas aprovações; lista de campanhas da empresa; selo com dono, status e mensagem literal; vitrine; filtro de empresa não aprovada e exposição do compromisso aprovado na página pública.

**Issues**: página pública sem asserção de valores (T45); contrato do double de empresa sem teste (T48); dígitos e sufixo `-4` (T46); fallback no caso de uso (T47); JSDoc da porta de campanha (T49).

**Próximo passo**: o grupo fecha T45–T49 e o agente roda a rodada 2 sobre o diff de correção, reexecutando os 14 sobreviventes.
