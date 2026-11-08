**Verdict**: FAIL

# Vitrine e Selo — Validação do domínio, rodada 2 (gate de handoff AD-023)

**Veredito**: ❌ **FAIL**, por pouco. T45–T49 cumprem a Done-when item a item, e os **14 sobreviventes da rodada 1 morreram todos**. O gate está verde: build, tsc e eslint saem com 0, e o unit dá 704/704 (+15). Dos 16 mutantes novos, porém, **2 sobreviveram e são lacunas reais**. **N16**: na página pública da empresa, `beneficiada.tipo` fixado em `'INSTITUICAO'` passa, porque `buscar-empresa-publica.spec.ts` nunca monta uma campanha com beneficiada `CAUSA` (Página AC2). **N13**: trocar `[^a-z0-9]` por `[^a-z0-8]` passa, porque o único caso com dígitos ("2000") não tem `9` (Slug AC3, limite superior da faixa, L-009). As duas correções são de teste e cabem em uma hora: **T50** e **T51**. **A Fase 4 (T19–T28) continua bloqueada** até elas fecharem e a rodada 3 (a última, antes de escalar ao usuário) passar.

**Data**: 2026-11-08
**Spec**: `.specs/features/vitrine-e-selo/spec.md`
**Diff range**: domínio `96c313f..HEAD` (`d937a94`). Correções da rodada: `6f9793d..d386fb8` (T45 `6f9793d`, T46 `a001597`, T47 `bb20ac0`, T48 `f36959a`, T49 `d386fb8`). Em `api/src` e `api/test`: 6 arquivos, +334/−5, todos de teste ou JSDoc, **nenhuma linha de produção**. Os commits `b1244db..d937a94` (T60–T64) são só `web/` e `tasks.md` e ficam fora deste gate (ver `validation-web.md`).
**Verifier**: sub-agente independente (autor ≠ verificador), somente leitura sobre `src/`, `test/` e `web/`. Escreve só este arquivo.
**Rodada**: 2 de 3. Escopo: domínio T1–T18 + T45–T49 (VIT-01, VIT-02, VIT-04, VIT-06 e VIT-08, na parte de domínio). ACs só de HTTP, infra ou `web` ficam marcados "fora do escopo (Tn)". Sem UAT.

Caminhos abreviados: `SH/` = `src/domain/fivo/shared/`, `EM/` = `src/domain/fivo/empresas/`, `CA/` = `src/domain/fivo/campanhas/`, `D/` = `test/doubles/`.

---

## Histórico

| Rodada | Diff | Verdict | Resumo |
| ------ | ---- | ------- | ------ |
| 1 | `96c313f..ed49618` | ❌ FAIL | Gate: build/tsc/eslint 0, unit 689/689, e2e 507/546 (39 falhas dos stubs de T20/T21). 60 mutantes: 44 mortos, 14 sobreviventes (M2, M9, M14, M22, M36–M41, M46, M47, M52, M53), 2 equivalentes (M21, M50). 13/18 ACs. Abriu T45–T49 |
| 2 | `96c313f..d937a94` (correções `6f9793d..d386fb8`) | ❌ FAIL | Este relatório. Gate: build/tsc/eslint 0, unit **704/704**, e2e 507/546 (as mesmas 39, mesma causa). Sensor: 14 sobreviventes reexecutados, **14 mortos**; 16 novos: 12 mortos, **2 sobreviventes (N13, N16)**, 2 equivalentes (N3, N15). 16/18 ACs. Abre T50–T51 |

---

## Correções da rodada 1 (T45–T49): Done-when item a item

### T45 — Valores do contrato da página pública (`6f9793d`) ✅

| Done-when | Evidência | ✔ |
| --------- | --------- | - |
| `toEqual` exato com todos os valores (empresa + campanha + beneficiada + vigência) | `CA/use-cases/buscar-empresa-publica.spec.ts:210-266`: `expect(res.value).toEqual({ slug: 'agua-viva', nomeFantasia: 'Água Viva', cidade: 'Campinas', uf: 'SP', site: 'https://aguaviva.com.br', temLogo: true, campanhas: [{ slug, nome: 'Garrafa Solidária', descricao, beneficiada: { tipo: 'INSTITUICAO', nome: 'Instituto Mata Viva' }, regraDoacao: { tipo: POR_UNIDADE, valor: '2.50' }, vigencia: { inicio: '2026-10-01', fim: '2026-12-31' }, situacao: 'EM_ANDAMENTO' }] })` (`:247`) | ✅ |
| `temLogo` `true` e `false` | `true` em `:253` (empresa com `logoArquivoId`); `false` em `:268-274` `expect(res.value.temLogo).toBe(false)` | ✅ |
| `situacao` nos dois valores com relógio fixado | `jest.useFakeTimers({ now: 2026-10-15T12:00Z })` em `:199-203`; `it.each` `:276-297`: início 16/10 → `NAO_INICIADA`, 15/10 → `EM_ANDAMENTO` (`situacao).toBe(situacao)`) | ✅ |
| Fora de `APROVADA` **com slug** fica fora | `:124-159`: `RASCUNHO` `slug: 'rascunho'` (`:138`), `EM_ANALISE` `'em-analise'` (`:144`), `REJEITADA` `'rejeitada'` (`:151`) | ✅ |
| M36, M37, M38, M39, M40, M41, M46, M47 morrem | Sensor abaixo: todos mortos | ✅ |
| Gate `quick` | unit 704/704 | ✅ |

### T46 — Dígitos e sufixo `-4` (`a001597`) ✅

| Done-when | Evidência | ✔ |
| --------- | --------- | - |
| Dígitos com `toBe` exato | `SH/entities/slug.spec.ts:14-16` `Slug.de('Café 2000 Ltda.', 'empresa').valor).toBe('cafe-2000-ltda')` | ✅ (mas só cobre `0` e `2`: N13 vivo → T51) |
| `-4` com `toBe` exato | `:74-82` base, `-2` e `-3` ocupados → `toBe('cafe-serra-verde-4')` | ✅ |
| M2 e M9 morrem | mortos (`slug.spec:14`, `:74`) | ✅ |
| Gate `quick` | ✅ | ✅ |

### T47 — Fallback ligado ao caso de uso (`bb20ac0`) ✅

| Done-when | Evidência | ✔ |
| --------- | --------- | - |
| `toBe('empresa')` no caso de uso | `EM/use-cases/aprovar-empresa.spec.ts:266-280`: `'!!!'` → `toBe('empresa')` (`:274-276`) e o opcional recomendado, segunda `'!!!'` → `toBe('empresa-2')` (`:277-279`) | ✅ |
| `toBe('campanha')` no caso de uso | `CA/use-cases/aprovar-campanha.spec.ts:250-259` `slug?.valor).toBe('campanha')` (`:258`) | ✅ |
| M14 e M22 morrem | mortos | ✅ |
| Gate `quick` | ✅ | ✅ |

### T48 — Spec do `InMemoryEmpresaRepository` (`f36959a`) ✅

| Caso | Evidência | ✔ |
| ---- | --------- | - |
| 1. `listarSlugsComPrefixo('cafe')` → `cafe`, `cafe-2`, `cafeteria` | `D/in-memory-empresa-repository.spec.ts:42-52` `toEqual(['cafe', 'cafe-2', 'cafeteria'])` (com `outra` e uma pendente sem slug guardadas) | ✅ |
| 2. Slug de outra empresa → `SlugEmUsoError`, nada gravado | `:73-88`: `rejects.toBeInstanceOf(SlugEmUsoError)` (`:83`), `rejects.toThrow('Slug já está em uso')` (`:84`), `status).toBe(PENDENTE_APROVACAO)` (`:86`), `slug).toBeNull()` (`:87`) | ✅ |
| 3. Regravar a própria empresa com o slug dela | `:90-109`: `gravou).toBe(true)`, `status).toBe(SUSPENSA)`, `slug?.valor).toBe('cafe-serra-verde')` | ✅ |
| 4. `findBySlug` acha / `null` | `:56-63` (`id` e `slug` exatos), `:65-69` `toBeNull()` | ✅ |
| 5. Conflito forçado: uma vez só, rival guardada | `:113-137`: 1ª → `SlugEmUsoError`; `listarSlugsComPrefixo` → `['cafe-serra-verde']`; rival ≠ pendente; 2ª com `-2` grava | ✅ |
| Recomendado: terceira homônima → `-3` | `EM/use-cases/aprovar-empresa.spec.ts:250-264` `toBe('cafe-serra-verde-3')` | ✅ |
| M52 e M53 morrem | mortos (M52 por 2 testes, M53 por `:73`) | ✅ |

### T49 — JSDoc de `CampanhaRepository` (`d386fb8`) ✅

| Done-when | Evidência | ✔ |
| --------- | --------- | - |
| `salvar` cita `slug`, unicidade por empresa e `SlugEmUsoError` | `CA/ports/campanha-repository.ts:26-29`: "Grava também o `slug`. O par `(empresaId, slug)` é único… lança `SlugEmUsoError` sem gravar nada (a versão não é incrementada). Campanhas de empresas diferentes podem ter o mesmo slug." Bate com design §Portas e com o double (`D/in-memory-campanha-repository.spec.ts:87-110`) | ✅ |
| JSDoc de `listarEmAnalise` de volta | `:33`, texto idêntico ao anterior à feature | ✅ |

**Integridade das correções**: as 5 linhas removidas em `2174df0..HEAD -- '*.spec.ts'` são a assinatura do helper `vigencia(inicio)` (ganhou `fim?`) e as 3 fábricas do teste de exclusão, reescritas para receber slug. Nenhum `it(` removido, nenhuma asserção enfraquecida. `tasks.md`: os checkboxes de T45–T49 foram marcados pelo agente no handoff (AD-020/AD-023), e nenhum outro texto de T45–T49 mudou.

---

## Gate Check

Comandos rodados na árvore real (`d937a94`). Saídas no scratchpad (`r2-*.txt`).

| Etapa | Exit | Resultado |
| ----- | ---- | --------- |
| `npm run build` | 0 | ok |
| `npx tsc -p tsconfig.json --noEmit` | 0 | ok |
| `npx eslint "{src,test}/**/*.ts"` | 0 | nenhum erro ou aviso; inclui as regras de fatia (AD-022) |
| `npx jest` (unit) | 0 | 73 suites, **704/704**, 0 skip |
| `npx jest --config ./test/jest-e2e.json` (registro) | 1 | 35 suites, **507/546**. As 39 falhas são as mesmas da rodada 1: o log tem 6× `"não implementado: T20"` e 33× `"não implementado: T21"`. É o problema estrutural já aceito (follow-up 1) e não bloqueia este gate |

- **Contagem**: unit 602 (`96c313f`) → 689 (rodada 1) → **704** (+15 = slug 2, `aprovar-empresa` 2, `aprovar-campanha` 1, `buscar-empresa-publica` 4, double de empresa 6). e2e: 546 (sem testes novos; T19–T28 são da infra).
- **Integridade** (`git diff 96c313f..HEAD -- '*.spec.ts'`): 14 arquivos, +1816/−5. As 5 remoções são 4 imports reescritos e a assinatura de `criarEmpresaPendente(props)`, as mesmas da rodada 1 (as remoções da T45 caem dentro de `buscar-empresa-publica.spec.ts`, que é novo no range). **Nenhum teste apagado, nenhum `it(` removido, nenhuma asserção enfraquecida.** `buscar-campanha-publica.spec.ts` continua intacto.

---

## Task Completion

| Task | Status | Nota |
| ---- | ------ | ---- |
| T1 | ✅ | Lacunas da rodada 1 fechadas pela T46. O limite superior da faixa de dígitos ainda não tem teste (N13) → T51 |
| T2, T3, T4, T5, T7, T9, T10, T11, T14, T15, T16, T18 | ✅ | Sem mudança desde a rodada 1 (evidência lá, linhas inalteradas) |
| T6 | ✅ | JSDoc corrigido pela T49 |
| T8 | ✅ | Contrato fixado pela T48 |
| T12, T13 | ✅ | Fallback ligado pela T47 |
| T17 | ⚠️ | T45 fechou os 8 sobreviventes. Falta o ramo `CAUSA` da beneficiada (N16) → T50 |
| T45–T49 | ✅ | Ver acima |

---

## Spec-Anchored Acceptance Criteria

Legenda: ✅ evidência no valor da spec; ❌ lacuna; ⚠️ SPn = spec-precision gap (não bloqueia); **fora do escopo (Tn)** = AC só de HTTP, infra ou `web`. Os ACs que não mudaram desde a rodada 1 mantêm a mesma evidência, conferida de novo nas linhas atuais.

### P1: Slug permanente (VIT-01)

| AC | Spec-defined outcome | `file:line` + asserção | Result |
| -- | -------------------- | ---------------------- | ------ |
| AC1 | slug de `nomeFantasia` | `EM/use-cases/aprovar-empresa.spec.ts:227` `toBe('cafe-serra-verde')` | ✅ |
| AC2 | slug de `nome` | `CA/use-cases/aprovar-campanha.spec.ts:247` `toBe('verao-solidario')` | ✅ |
| AC3 | minúsculas, sem acento, fora de `a-z0-9` → hífen, pontas sem hífen, 60 sem hífen final | `SH/entities/slug.spec.ts:4-46` (`toBe` exato); dígitos `:15` `toBe('cafe-2000-ltda')` (M2 morto). **O limite superior da faixa não tem teste**: `[^a-z0-8]` passa (N13), e "Loja 99" viraria `loja`. É o mesmo padrão de L-009 (testar o limite dos dois lados), aplicado à faixa `0-9` | ❌ (T51) |
| AC4 | `empresa` / `campanha` | VO `slug.spec.ts:41`, `:45`; caso de uso `aprovar-empresa.spec.ts:274-279` (`'empresa'`, `'empresa-2'`), `aprovar-campanha.spec.ts:258` (`'campanha'`) (M14, M22 mortos) | ✅ |
| AC5 | menor sufixo livre, `-2`, `-3`… | `slug.spec.ts:62-88` (`-2`, `-3`, `-4`, base livre com `-2` ocupado); `aprovar-empresa.spec.ts:242-246` (`-2`), `:261` (`-3`); contrato do prefixo `D/in-memory-empresa-repository.spec.ts:51` (M9, M52, N10, N11 mortos) | ✅ |
| AC6 | sufixo por empresa | `aprovar-campanha.spec.ts` (`-2` na mesma empresa, sem sufixo em outra); `D/in-memory-campanha-repository.spec.ts:100-110`; N12 morto | ✅ |
| AC7 | imutável | igual à rodada 1, mais `D/in-memory-empresa-repository.spec.ts:90-109` (suspensão regrava o mesmo slug; N1 morto) | ✅ |

### P1: Campanhas na área da empresa (VIT-02)

| AC | Result |
| -- | ------ |
| AC1 só as dela, `createdAt` desc | ✅ (`CA/use-cases/listar-campanhas-da-empresa.spec.ts:92`, `:114-118`; ordem na porta `D/in-memory-campanha-repository.spec.ts:58-61`) |
| AC2 campos | ✅ (`:68-79` `toEqual` exato; `urlPublica` é da T24) |
| AC3, AC4 | fora do escopo (T24) |
| AC5–AC10 | fora do escopo (`web`) |

### P1: Selo genérico (VIT-04)

| AC | Result |
| -- | ------ |
| AC5 bytes idênticos (domínio) | ✅ `CA/use-cases/gerar-selo.spec.ts:67-75` |
| AC6 não aprovada → 409 "Campanha não está aprovada" | ✅ `:96-117` |
| AC7 inexistente ou de outra empresa → "Campanha não encontrada" | ✅ (domínio) `:119-137` |
| AC1–AC4, AC8 | fora do escopo (T23, T25) |
| AC9 | fora do escopo (`web`) |

### P1: Página pública da empresa (VIT-06)

| AC | Spec-defined outcome | `file:line` + asserção | Result |
| -- | -------------------- | ---------------------- | ------ |
| AC1 | `nomeFantasia`, `cidade`, `uf`, `site`, `temLogo`, `campanhas` com os valores da empresa | `CA/use-cases/buscar-empresa-publica.spec.ts:247-266` `toEqual` do objeto inteiro; `temLogo` `false` em `:273` (M38, M39, N5, N6 mortos) | ✅ |
| AC2 | só `APROVADA`, aprovação desc, cada uma com `slug`, `nome`, `descricao`, `beneficiada` (`nome` **e `tipo`**), `regraDoacao`, `vigencia` (`inicio`, `fim`), `situacao` | Valores: `:247-266` (M36, M37, M40, M46, M47, N7, N9 mortos); situação: `:276-297`; filtro: `:124-159` com slug nas excluídas (M41, N14 mortos); ordem: `:161-173`. **`tipo` só é conferido como `'INSTITUICAO'`**: nenhum teste deste caso de uso tem beneficiada `CAUSA`, então fixar `tipo: 'INSTITUICAO'` passa (N16). O `web` escolhe o rótulo da beneficiada pelo `tipo` (T61/W12), então um `tipo` errado chega à tela | ❌ (T50) |
| AC3 | 404 "Empresa não encontrada" | `:302-322` `toEqual(new ResourceNotFoundError('Empresa não encontrada'))` (inexistente, `PENDENTE_APROVACAO`, `REJEITADA`, `SUSPENSA`) | ✅ (domínio) |
| AC4 | nada além do contrato | `:93-122` (chaves exatas) + `:247` (`toEqual` exato) | ✅ |
| AC5 | logo | — | fora do escopo (T28) |
| AC6–AC13 | telas | — | fora do escopo (`web`) |

### P1: Vitrine de parceiros (VIT-08)

| AC | Result |
| -- | ------ |
| AC1 só `APROVADA` com os campos | ✅ `EM/use-cases/listar-parceiros.spec.ts:49`, `:129-144` |
| AC2 alfabética sem caixa nem acento | ✅ `:77-81` / ⚠️ SP1 |
| AC3–AC5 | fora do escopo (`web`) |

**Status**: ❌ Há lacunas. Dos **18** ACs com regra de domínio, **16** batem com o valor da spec. As 5 lacunas da rodada 1 viram 2: **Slug AC4, Slug AC5 e Página AC1 fecharam**, e **Slug AC3 e Página AC2 continuam abertos**, agora em um ramo cada (faixa `0-9` e beneficiada `CAUSA`).

### Spec-precision gaps

- **SP1 — desempate da vitrine** (Vitrine AC2): continua. M50 continua equivalente frente à spec. Não bloqueia.
- **SP2 — `descricao` nula** (Página AC2): **fechado pelo código**. Uma campanha só chega a `APROVADA` por `submeter`, que exige `descricao` não vazia (`CA/entities/campanha.ts:390-392`, `camposPendentes`). Depois disso, `editarTextos` não aceita `null` (`EditarTextosProps.descricao?: DescricaoCampanha`, `:61`). O ramo `?? null` de `CA/use-cases/buscar-empresa-publica.ts:94` é inalcançável para campanha aprovada, e por isso N15 é equivalente. O `web` pode tratar `descricao` como `string` na página pública (o follow-up 4 fica resolvido).

---

## Edge Cases

- [x] Aprovações simultâneas com o mesmo nome: igual à rodada 1, agora com o contrato do double fixado (`D/in-memory-empresa-repository.spec.ts:113-137`, N2 morto).
- [x] Empresa suspensa: 404 na página pública (`buscar-empresa-publica.spec.ts:310-322`), fora da vitrine, slug preservado na regravação (`D/in-memory-empresa-repository.spec.ts:90-109`).
- [x] Alteração pendente → compromisso aprovado (`buscar-empresa-publica.spec.ts:175-193`).
- [ ] HTML/script como texto e logo quebrado: `web` (fora do escopo).

---

## Discrimination Sensor

**Profundidade**: P0 (integridade de dados). `git worktree add --detach <scratchpad>/wt-r2-dom HEAD` (`d937a94`), com `api/node_modules` como link simbólico para o da árvore real. Baseline no worktree: 704/704. Cada mutante foi aplicado por script (`sensor_r2.py` no scratchpad, que reaproveita as definições exatas de `sensor.py` da rodada 1 para os 14 sobreviventes), com substituição exata e exigência de **uma única ocorrência**. Cada um rodou contra a suíte unit inteira (`npx jest --silent --json`) e foi revertido com `git checkout --`, com conferência byte a byte (30/30 restaurados). **Nenhuma morte veio de erro de execução ou compilação** (`runtime=[]` nos 30). No fim: link apagado, `git worktree remove --force`, `git worktree prune`. `git stash` não foi usado. Resultados por mutante em `<scratchpad>/sensor-r2/`.

**Isolamento**: o `git status --porcelain` da árvore real estava vazio antes do sensor e continuou vazio depois (diff dos dois arquivos: idêntico). O `wt-r2-web` que aparece em `git worktree list` é do verificador do `web`, que roda em paralelo, e não foi tocado.

### Reexecução dos 14 sobreviventes da rodada 1

| # | Alvo | Resultado | Morto por |
| - | ---- | --------- | --------- |
| M2 | Slug AC3 dígitos | ✅ morto | `slug.spec.ts:14` |
| M9 | Slug AC5 `while`→`if` | ✅ morto | `slug.spec.ts:74` |
| M14 | Slug AC4 empresa | ✅ morto | `aprovar-empresa.spec.ts:266` |
| M22 | Slug AC4 campanha | ✅ morto | `aprovar-campanha.spec.ts:250` |
| M36 | Página `situacao` fixa | ✅ morto | `buscar-empresa-publica.spec.ts:276` (`NAO_INICIADA`) |
| M37 | beneficiada `nome: ''` | ✅ morto | `:210` |
| M38 | `temLogo: true` | ✅ morto | `:268` |
| M39 | `site: cidade` | ✅ morto | `:210` |
| M40 | `descricao: null` | ✅ morto | `:210` |
| M41 | sem filtro de status | ✅ morto | `:124` |
| M46 | `nome` da campanha trocado | ✅ morto | `:210` |
| M47 | `vigencia` falsa | ✅ morto | `:210` |
| M52 | prefixo `===` | ✅ morto | `D/in-memory-empresa-repository.spec.ts:42`, `aprovar-empresa.spec.ts:250` |
| M53 | sem `SlugEmUsoError` natural | ✅ morto | `D/in-memory-empresa-repository.spec.ts:73` |

### Mutantes novos (testes e código tocados pelas correções e ramos ainda não exercitados)

| # | Alvo | File:line | Mutação | Resultado |
| - | ---- | --------- | ------- | --------- |
| N1 | contrato T20 (própria empresa) | `D/in-memory-empresa-repository.ts:170` | remove `!item.id.equals(empresa.id)` (a empresa colide consigo mesma) | ✅ morto (2: `in-memory-empresa-repository.spec:90`, `aprovar-empresa.spec` "keep the slug") |
| N2 | conflito forçado uma vez só | `D/in-memory-empresa-repository.ts:152` | não zera `conflitoDeSlugForcado` | ✅ morto (2) |
| N3 | conflito forçado sem slug | `D/in-memory-empresa-repository.ts:151` | remove `empresa.slug &&` | ⚪ **equivalente** (abaixo) |
| N4 | unicidade por valor | `D/in-memory-empresa-repository.ts:172` | qualquer outra empresa com slug conflita | ✅ morto (5) |
| N5 | Página AC1 `temLogo` | `CA/use-cases/buscar-empresa-publica.ts:115` | `!!` → `!` | ✅ morto (2) |
| N6 | Página AC1 | `CA/use-cases/buscar-empresa-publica.ts:112-113` | troca `cidade` ↔ `uf` | ✅ morto (`:210`) |
| N7 | Página AC2 nome da instituição | `CA/use-cases/campanha-publica.ts:17` | `nomeFantasia` → `razaoSocial` | ✅ morto (3) |
| N8 | nome da causa | `CA/use-cases/campanha-publica.ts:21` | nome da causa → `''` | ✅ morto (2, em `campanha-publica.spec` e `buscar-campanha-publica.spec`) |
| N9 | Página AC2 `situacao` / relógio | `CA/use-cases/buscar-empresa-publica.ts:82` | `hoje` = amanhã | ✅ morto (`:276`) |
| N10 | Slug AC5 passo do sufixo | `SH/entities/slug.ts:41` | `sufixo++` → `sufixo += 2` | ✅ morto (2) |
| N11 | Slug AC5 prefixo consultado | `EM/use-cases/aprovar-empresa.ts:126-128` | `listarSlugsComPrefixo(base + '-')` (a base some dos ocupados) | ✅ morto (4) |
| N12 | Slug AC6 empresa consultada | `CA/use-cases/aprovar-campanha.ts:132-134` | `listarPorEmpresa(user.id)` | ✅ morto (2) |
| N13 | Slug AC3 faixa de dígitos | `SH/entities/slug.ts:13` | `[^a-z0-9]+` → `[^a-z0-8]+` | ❌ **vivo** → T51 |
| N14 | Página AC2 filtro unilateral | `CA/use-cases/buscar-empresa-publica.ts:76` | `=== APROVADA` → `!== RASCUNHO` | ✅ morto (`:124`) |
| N15 | Página AC2 `descricao` nula | `CA/use-cases/buscar-empresa-publica.ts:94` | `?? null` → `?? ''` | ⚪ **equivalente** (SP2, abaixo) |
| N16 | Página AC2 `beneficiada.tipo` | `CA/use-cases/buscar-empresa-publica.ts:96` | `tipo: beneficiada.tipo` → `tipo: 'INSTITUICAO'` | ❌ **vivo** → T50 |

**Result**: 30 injetados (14 reexecutados + 16 novos), **26 mortos**, **2 sobreviventes (N13, N16)**, **2 equivalentes (N3, N15)**. Sensor ❌ FAIL. Acumulado das duas rodadas: 76 mutantes distintos, 4 equivalentes (M21, M50, N3, N15), 2 vivos.

**Por que N3 é equivalente.** `forcarConflitoDeSlugNaProximaTransicao` é um gancho só de teste, e o adaptador Prisma não tem nada parecido. Os três chamadores (`aprovar-empresa.spec.ts`, `in-memory-empresa-repository.spec.ts:116`) só o armam antes de uma transição com slug, então a guarda `empresa.slug &&` nunca decide nada. Não é contrato da T20.

**Por que N15 é equivalente.** Ver SP2: campanha `APROVADA` sempre tem `descricao` (`CA/entities/campanha.ts:390`, `:61`).

---

## Code Quality (diff de correção)

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical | ✅ Só testes e JSDoc; nenhuma linha de produção. O helper `vigencia(inicio, fim?)` foi estendido em vez de duplicado |
| Matches patterns | ✅ `in-memory-empresa-repository.spec.ts` segue o molde do spec do double de campanha; relógio fixado com `doNotFake: ['nextTick', 'setImmediate']`, como nos outros specs com timers |
| Spec-anchored outcome | ⚠️ Página AC2 `tipo` (N16) e Slug AC3 faixa (N13) |
| Per-layer Coverage Expectation | ⚠️ Matriz: "Value objects… todas as ramificações" (N13); "casos de uso happy + cada edge" (N16, ramo `CAUSA`) |
| Every test maps to a requirement | ✅ Os 15 testes novos mapeiam para Done-when de T45–T48 |
| Documented guidelines | `tasks.md` §Test Coverage Matrix; L-001 (mensagem literal: ✅ `in-memory-empresa-repository.spec.ts:84`); L-009 (limite dos dois lados: ❌ na faixa de dígitos, N13) |

---

## Fix Plans

Duas tasks, ambas **Minor**, só de teste e sem mudança de produção. Juntas cabem em menos de uma hora.

### T50: Beneficiada `CAUSA` na página pública da empresa

**What**: Em `buscar-empresa-publica.spec.ts`, acrescentar um caso com campanha `APROVADA` cuja beneficiada é uma **causa** (`Beneficiada.criar({ causaId })`, causa guardada em `causaRepository` com `nome` conhecido). Conferir `res.value.campanhas[0].beneficiada).toEqual({ tipo: 'CAUSA', nome: '<nome da causa>' })`.
**Where**: `src/domain/fivo/campanhas/use-cases/buscar-empresa-publica.spec.ts`
**Depends on**: None
**Requirement**: VIT-06 (Página AC2)
**Autor**: 👤 humano · **Responsável**: Pessoa 4
**Tests**: unit
**Gate**: quick
**Done when**:

- [ ] Caso com beneficiada `CAUSA` com `toEqual` exato de `{ tipo: 'CAUSA', nome }`
- [ ] Mutante N16 (`tipo: 'INSTITUICAO'` fixo em `buscar-empresa-publica.ts:96`) morre
- [ ] Gate `quick` passa

**Commit**: `test(api): beneficiada causa na página pública da empresa`

---

### T51: Faixa completa de dígitos no slug

**What**: Em `slug.spec.ts`, um caso que cubra os dois extremos da faixa `0-9`, por exemplo "Loja 0 a 9" → `loja-0-a-9`, ou estender o caso atual para "Café 2009 Ltda." → `cafe-2009-ltda`.
**Where**: `src/domain/fivo/shared/entities/slug.spec.ts`
**Depends on**: None
**Requirement**: VIT-01 (Slug AC3)
**Autor**: 👤 humano · **Responsável**: Pessoa 1
**Tests**: unit
**Gate**: quick
**Done when**:

- [ ] `toBe` exato com `0` e `9` no texto
- [ ] Mutante N13 (`[^a-z0-8]` em `slug.ts:13`) morre
- [ ] Gate `quick` passa

**Commit**: `test(api): faixa de dígitos do slug`

---

## Follow-ups não bloqueantes (da rodada 1, ainda válidos)

1. **e2e quebrado até a T21 (destino: T20, T21).** Continua: 507/546 nesta rodada, com as mesmas 39 falhas (6 de T20, 33 de T21). A Done-when de T20/T21 em `tasks.md` **ainda não tem** "e2e de volta a 546/546". Acrescentar. Enquanto isso, a `homologacao` responde 500 em toda aprovação de empresa e de campanha.
2. **Mensagem literal do 404 (destino: T25, T27).** Continua. `DomainExceptionFilter` responde "Recurso não encontrado" para todo `ResourceNotFoundError` (`src/infra/http/domain-exception.filter.ts:65-71`). A spec exige "Campanha não encontrada" e "Empresa não encontrada". O e2e precisa conferir o texto literal (L-001).
3. **Campanha `APROVADA` sem slug no selo (destino: T25 ou design).** Continua. `CA/use-cases/gerar-selo.ts:47-49` responde 409 "Campanha não está aprovada" quando falta o slug.
4. ~~`descricao` nula (SP2)~~: **resolvido**. Ver SP2: a invariante de submissão garante `descricao` em campanha aprovada.
5. **Higiene de testes (destino: qualquer PR do grupo).** Continua. O comentário velho "O double ainda não copia o slug (T8)" e o `spyOn(findById)` seguem em `EM/use-cases/editar-dados-empresa.spec.ts:70-72`. A T48 deixou ainda mais claro que o double copia o slug (`D/in-memory-empresa-repository.spec.ts:56-63`). O momento do conflito forçado continua diferente nos dois doubles (antes do CAS no de empresa, `D/in-memory-empresa-repository.ts:151`; depois no de campanha).
6. **Comentário sobre o `Either` ignorado (destino: opcional).** Continua (`EM/use-cases/aprovar-empresa.ts:129`, `CA/use-cases/aprovar-campanha.ts:138`).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| VIT-01 (domínio) | ❌ Needs Fix (T46–T49) | ❌ Needs Fix (T51) |
| VIT-02 (domínio) | ✅ Verificado no domínio | ✅ Verificado no domínio (HTTP: T24) |
| VIT-04 (domínio) | ✅ Verificado no domínio | ✅ Verificado no domínio (HTTP/SVG: T23, T25) |
| VIT-06 (domínio) | ❌ Needs Fix (T45) | ❌ Needs Fix (T50) |
| VIT-08 (domínio) | ✅ Verificado no domínio | ✅ Verificado no domínio (HTTP: T26) |

(Status sugerido; o verificador não edita `spec.md`.)

---

## Summary

**Overall**: ❌ Not Ready. Faltam dois testes curtos.

**Spec-anchored check**: 16/18 ACs de domínio batem com a spec; 2 com lacuna de um ramo cada (Slug AC3: faixa `0-9`; Página AC2: beneficiada `CAUSA`). 1 spec-precision gap aberto (SP1); SP2 fechado.
**Sensor**: 30 injetados, 26 mortos, 2 sobreviventes (N13, N16), 2 equivalentes (N3, N15). Os 14 sobreviventes da rodada 1 morreram.
**Gate**: build/tsc/eslint 0; unit 704/704 (+15); e2e 507/546, com as 39 falhas atribuídas aos stubs de T20/T21 (estrutural, aceito).

**O que funciona**: tudo o que a rodada 1 já confirmava, mais o contrato completo da página pública (valores, `temLogo` nos dois sentidos, `situacao` com relógio fixado, filtro de status isolado do filtro de slug), dígitos e sufixos `-3`/`-4`, fallback por entidade nos dois casos de uso e o contrato de slug do double de empresa que a T20 vai seguir (prefixo, unicidade natural, autorregravação, conflito forçado).

**Próximo passo**: o grupo fecha T50 (Pessoa 4) e T51 (Pessoa 1), e o agente roda a **rodada 3, a última**, reexecutando N13 e N16. Se ela passar, a Fase 4 (T19–T28) fica liberada. Se falhar, o caso vai ao usuário.
