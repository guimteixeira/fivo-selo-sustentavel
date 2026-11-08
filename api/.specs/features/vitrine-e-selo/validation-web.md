**Verdict**: FAIL

# Vitrine e Selo — Validação do `web` (T29–T44), rodada 2

**Veredito**: ❌ **FAIL**, por pouco. As correções da rodada 1 entregam o que prometem. T60–T64 cumprem a Done-when item a item, T34 e T40 agora fecham, os 7 sobreviventes da rodada 1 (W8b, W9–W13, W25) morrem e o gate novo passa 3 vezes seguidas sob carga. O que segura o PASS são **2 sobreviventes novos**, ambos na página pública `S/components/empresa/PaginaEmpresaPublica.tsx`, em ramos que nenhum teste exercita:

1. **X4, vigência sem `fim`** (`:40`). O `design.md:86` declara `fim` opcional na resposta pública, e o ramo "A partir de dd/mm/aaaa" não tem asserção. Trocar o texto, ou até esvaziá-lo, passa. É o "período de vigência" do VIT-07 AC6 num caso que o contrato prevê.
2. **X11, erro que não é 404** (`:61`). Tratar qualquer `ApiError` ≥ 400 como 404 passa. Na prática, um 500 ou 503 da API mostraria "Empresa não encontrada" ao consumidor que acabou de ler o QR, em vez do erro com "Tentar novamente" do `AsyncState`. A Test Coverage Matrix de `tasks.md` exige o estado de erro em toda tela.

Os dois cabem numa fix task pequena, só de teste: a **T66**.

**Data**: 2026-11-08
**Spec**: `.specs/features/vitrine-e-selo/spec.md` (VIT-03, 05, 07, 09, 10, 11, 12, só a parte `web`)
**Diff range**: `96c313f..d937a94 -- web` (61 arquivos, +4983/−2475). As correções desta rodada estão em `ed49618..d937a94`: T64 `b1244db`, T60 `3bbc2dd`, T61 `c32a70a`, T62 `a46064e` e T63 `d937a94`.
**Verifier**: sub-agente independente (autor ≠ verificador), com leitura apenas sobre o código. Escreve só este arquivo.
**Escopo**: T29–T44 mais as correções T60–T64. A infra do `api` (T19–T28) não entra: o `web` foi verificado contra o contrato, com `fetch` mockado. O UAT interativo fica para o ponta a ponta de 10/11 (lista no fim).

Caminhos abreviados: `S/` = `web/src/`, `T/` = `web/tests/`.

---

## Histórico

| Rodada | Data | Veredito | Sensor | Gate | Pendências |
| ------ | ---- | -------- | ------ | ---- | ---------- |
| 1 | 2026-11-08 | ❌ FAIL | 26 injetados, 19 mortos, 7 sobreviventes (W8b, W9, W10, W11, W12, W13, W25) | `tsc` vermelho sem `next typegen`; timeout em `CampaignWizardNew.test.tsx:113` em 2 de 3 execuções | Done-when de T34 e T40 não cumprida (`parceiros/[id]` e `mockPartners` vivos). Abertas T60–T65 |
| 2 | 2026-11-08 | ❌ FAIL | 7 sobreviventes reexecutados, todos mortos; 13 novos, 11 mortos, 2 sobreviventes (X4, X11) | ✅ 3/3 (gate novo, com load de 17 a 22) | T66 (X4, X11) |

---

## Gate Check

- **Gate command** (`tasks.md:89`, Web, com a T65 aplicada): `cd web && npx next typegen && npx tsc --noEmit && npm run lint && npm test`. A saída de cada execução está num arquivo do scratchpad.
- **Máquina**: 32 núcleos, compartilhada com processos de outro projeto e com o Verifier do `api`, que rodava em paralelo.

| # | Onde | Início → fim | `uptime` (load 1/5/15) no início → no fim | Exit | Resultado |
| - | ---- | ------------ | ------------------------------------------ | ---- | --------- |
| 1 | árvore real (com `.next` antigo) | 11:07:19 → 11:08:23 | 5.78 / 13.70 / 14.94 → 17.42 / 16.11 / 15.72 | 0 | 70 arquivos, **329 ok, 2 skip**, 0 falhas (54,9 s) |
| 2 | árvore real | 11:08:23 → 11:09:25 | 17.42 / 16.11 / 15.72 → 22.19 / 18.39 / 16.56 | 0 | 329 ok, 2 skip, 0 falhas (51,5 s) |
| 3 | worktree limpo **sem `.next`** (Done-when da T65) | 11:10 → 11:12:42 | → 19.48 / 19.83 / 17.49 | 0 | 329 ok, 2 skip, 0 falhas. Rodou em paralelo com o sensor |

- **`tsc`**: exit 0 nas 3 execuções, inclusive no checkout limpo. O `next typegen` resolve o `LayoutProps` e o validator antigo do `.next`, que eram as duas quebras da rodada 1. **T65 ✅.**
- **Lint**: 0 erros, 2 avisos em `T/unit/servicos-opcionais-contrato.conditional.test.ts:71,74`, arquivo fora do diff (sem mudança desde a rodada 1).
- **Skips**: 2, os mesmos da rodada 1. São testes condicionais anteriores à feature.
- **Contagem**: base `96c313f` = 199 → rodada 1 = 321 → agora **331**, ou seja **+10** nesta rodada. São 4 do estrutural da T60 (`T/unit/mock-partners-removido.structural.test.ts:26,30,34,49`), 4 da T61 (`T/component/PaginaEmpresaPublica.test.tsx:70,86,99,114`), 1 da T62 (`T/component/EmpresaCampanhaScroll.test.tsx:75`, e o `:65` reescreveu o caso antigo) e 1 da T63 (`T/component/DetalheCampanha.test.tsx:199`).
- **Integridade**: nesta rodada nenhum `it(` foi removido e nenhuma asserção foi enfraquecida. A T64 removeu os `15000` explícitos de `T/integration/ui-states.test.tsx:417,454`, mas o novo `testTimeout: 30000` global (`web/vitest.config.ts:27`) é maior. Não há perda.

### T64: a correção global é aceitável?

**Sim, com uma ressalva registrada.** O que mudou:

- `web/vitest.config.ts:27`: `testTimeout: 30000`.
- `T/setup.ts:19`: `configure({ asyncUtilTimeout: 5000 })`.
- `T/integration/ui-states.test.tsx:417,454`: os `15000` saíram.

Por que aceitar:

- A causa é ambiental, e o desvio está registrado na seção **Execução** da T64 (`tasks.md`). O aquecimento local não bastava, porque o gate também caía em `waitFor` de 1 s fora do wizard.
- Nenhuma asserção mudou. Só o prazo mudou.
- A Done-when foi cumprida: houve 3 execuções completas seguidas sem falha em `CampaignWizardNew.test.tsx` nem em qualquer outro arquivo, com load entre 17 e 22, contra 2 falhas em 3 na rodada 1. O follow-up 7 da rodada 1 (`FilaEmpresas.property` e `ui-states 6.4` estourando o timeout) também sumiu.

Ressalva: um teste que trava agora leva 30 s para falhar, e um `findBy` que nunca acha leva 5 s. Isso deixa o diagnóstico mais lento, mas não esconde regressão, porque a asserção continua a mesma. Não bloqueia.

### Propriedades que dependem da semente

`SeletorCausa.property-selecao` e `CadastroInstituicao.property-envio-valido` são da feature `seletor-causa-cadastro-instituicao`. **Nem os testes nem os componentes que eles exercitam estão no diff**: `git log 96c313f..HEAD` não tem nenhum commit nesses dois arquivos, e `S/components/**/SeletorCausa*` e `CadastroInstituicao*` não mudaram. Elas não falharam em nenhuma das 3 execuções do gate desta rodada.

Para comparar com a base, cada propriedade virou `it.each` com 30 sementes fixas (1–30, `numRuns: 10`, `--testTimeout=60000`). Foi uma cópia temporária dentro do worktree, rodada no HEAD e em `96c313f`:

| Propriedade | HEAD `d937a94` | Base `96c313f` | Leitura |
| ----------- | -------------- | -------------- | ------- |
| `SeletorCausa.property-selecao` | 30/30 ok | 30/30 ok | Nenhuma semente reproduz a falha nos dois commits. A falha observada pelo autor da T64 depende da carga, não da semente |
| `CadastroInstituicao.property-envio-valido` | **falha nas sementes 18 e 23** | **falha na semente 23** (a 18 passa) | Mesmo contraexemplo nos dois: `[[{"id":" ","nome":"a","descricao":""}],0]`. **Falha na base, então não é regressão.** A diferença na semente 18 mostra que o caso `id` só de espaços também depende do tempo de execução |

As dependências são idênticas nos dois commits (`git diff 96c313f d937a94 -- web/package.json web/package-lock.json` vazio). Os logs estão em `…/scratchpad/wr2-seed-head.txt` e `wr2-seed-base.txt`. **Conclusão**: as duas falhas são anteriores à feature e ficam fora do escopo (follow-up 7). Não bloqueiam este veredito.

---

## Task Completion

As caixas de T29–T44 em `tasks.md` continuam desmarcadas, o que segue a memória do projeto: quem marca é o agente no handoff. As de T60–T64 já estão marcadas pelo autor. Conferi cada uma no código.

### Fix tasks da rodada 1

| Task | Done-when | Evidência | Status |
| ---- | --------- | --------- | ------ |
| T60 | `parceiros/[id]` e `mockPartners.ts` não existem | `ls S/app/parceiros` → só `page.tsx`; `S/lib/` sem `mockPartners.ts`; `grep -rn "mockPartners\|/parceiros/" S` → vazio. Asserções em `T/unit/mock-partners-removido.structural.test.ts:27` (`existsSync(…mockPartners.ts)).toBe(false)`) e `:31` (`…parceiros/[id]`) | ✅ |
| T60 | nenhum link para `/parceiros/{id}` | `:49-59` regex `/["'`]\/parceiros\/(\$\{|[\w-])/` sobre todo `S/**/*.{ts,tsx}` → `toEqual([])`. X2 (home → `/parceiros/${slug}`) morreu aqui e em `PartnerCompanies.test.tsx` | ✅ |
| T60 | teste estrutural varre `web/src/**/*.{ts,tsx}` e falha com import de `mockPartners` | `:13-19` varredura recursiva, `:34-47` `ofensores).toEqual([])`, com o guarda `arquivos.length).toBeGreaterThan(0)` em `:36` contra varredura vazia. X1 (reimportar `mockPartners`) e X13 (recriar `parceiros/[id]`) morreram | ✅ |
| T60 | gate passa | execuções 1–3 | ✅ |
| T61 | W9 morre (chip sempre visível) | `T/component/PaginaEmpresaPublica.test.tsx:123` `queryByText("Campanha ainda não iniciada")).toBeNull()` em `EM_ANDAMENTO` | ✅ |
| T61 | W10 morre (`onError` removido) | `:108` `fireEvent.error(logo)` → `:110` `findByText("CS")` + `:111` `queryByRole("img")).toBeNull()` | ✅ |
| T61 | W11 morre (`href` do site trocado) | `:80-83` `getByRole("link", { name: "https://cafeserraverde.com.br" })).toHaveAttribute("href", "https://cafeserraverde.com.br")` | ✅ |
| T61 | W12 morre (beneficiada por `tipo`) | `:95` `getByText("Beneficiada: Instituto X")` | ✅ |
| T61 | (What) logo com `src` da rota pública; descrição e vigência | `:79` `toHaveAttribute("src", "/api/empresas/publicas/cafe-serra-verde/logo")` (X6 morreu); `:94` descrição; `:96` `"Vigência: 01/11/2026 até 31/01/2027"` (X3 morreu) | ✅ |
| T61 | gate passa | execuções 1–3 | ✅ |
| T62 | W8b morre (rola para a 1ª) | `T/component/EmpresaCampanhaScroll.test.tsx:12-39` fixture com 2 campanhas; `:66` `slugCampanha = "mata-viva"` (a 2ª); `:69` `toHaveBeenCalledTimes(1)`; `:70-72` `scrollSpy.mock.contexts[0].id).toBe("mata-viva")` e `toBe(document.getElementById("mata-viva"))` | ✅ |
| T62 | W13 morre (página sem `slugCampanha`) | `:75-91` renderiza `S/app/empresa/[slug]/[slugCampanha]/page.tsx` com `params` em `Promise` dentro de `Suspense` e confere `:90` `contexts[0].id).toBe("mata-viva")`. X5 (efeito sem a dependência `empresa`) também morreu | ✅ |
| T62 | gate passa | execuções 1–3 | ✅ |
| T63 | W25 morre | `T/component/DetalheCampanha.test.tsx:199-211`: `EM_ANALISE` com `motivoUltimaRejeicao` preenchido → `:207` `queryByText("Motivo da rejeição")).not.toBeInTheDocument()` + `:208-210` texto ausente. X7 (`!== "APROVADA"`) também morreu | ✅ |
| T63 | gate passa | execuções 1–3 | ✅ |
| T64 | 3 execuções seguidas de `npm test` sem falha no arquivo | execuções 1–3 sem falha nenhuma, com load de 17 a 22 | ✅ |
| T64 | gate passa (exceto as 2 propriedades por semente) | passou inteiro nas 3 execuções; a exceção não precisou ser usada | ✅ |
| T65 | gate `Web` atualizado com exit 0 num worktree limpo | `tasks.md:89`; execução 3 num worktree sem `.next` → exit 0 | ✅ |

### Reavaliação das tasks da rodada 1

| Task | Rodada 1 | Rodada 2 | Evidência |
| ---- | -------- | -------- | --------- |
| T33 página `/empresa/[slug]` | ⚠️ Parcial | ⚠️ Parcial | Os itens que faltavam no card e no subtópico agora estão cobertos (T61, linhas acima). Faltam o ramo da vigência sem `fim` (X4) e o estado de erro que não é 404 (X11). Ver T66 |
| T34 rota do QR | ❌ | ✅ | Rolagem "no subtópico certo" provada pelo elemento (`EmpresaCampanhaScroll.test.tsx:70-72`), página da rota testada (`:75-91`), `parceiros/[id]` removido (T60). `isPublicRoute` continua em `T/unit/routes.empresa.test.ts:5-11` |
| T36 página `/campanhas/[id]` | ✅ (1 sobrevivente) | ✅ | W25 morto (T63) |
| T40 parceiros da home | ❌ | ✅ | Teste estrutural em `T/unit/mock-partners-removido.structural.test.ts:34-47`; comportamento em `T/component/PartnerCompanies.test.tsx:56-63`. X2 e X8 mortos |
| T41 wizard ligado à API | ✅ (gate instável) | ✅ | Estável nas 3 execuções (T64) |

As demais (T29–T32, T35, T37–T39, T42–T44) seguem ✅ como na rodada 1. Nenhum arquivo de produção delas mudou nesta rodada: `git diff ed49618..HEAD -- web/src` só remove `parceiros/[id]` e `mockPartners`.

---

## Spec-Anchored Acceptance Criteria

Esta rodada só mexe na VIT-07 e na VIT-11 AC2. Os demais critérios seguem como na rodada 1, e a evidência deles continua válida porque os testes e o código não mudaram (VIT-03 AC5–AC9, VIT-05 AC6/AC7/AC9, VIT-09 AC3/AC4, VIT-10 AC1–AC6, VIT-11 AC1/AC3–AC7, VIT-12 AC1–AC8: todos ✅).

### P1: Página pública da empresa — `web` (VIT-07)

| Critério | Saída definida pela spec | `file:line` + asserção | Rodada 1 | Rodada 2 |
| -------- | ------------------------ | ---------------------- | -------- | -------- |
| AC6 card: logo, `nomeFantasia`, cidade/UF, link do `site` | 4 elementos | `T/component/PaginaEmpresaPublica.test.tsx:63` `findByText("Café Serra Verde")`; `:64` `getByText("Campinas/SP")`; `:78-79` `img` "Logo de Café Serra Verde" com `src` = `/api/empresas/publicas/cafe-serra-verde/logo`; `:80-83` link com `href` do site | ❌ | ✅ |
| AC6 subtópico: nome, descrição, beneficiada, valor, vigência | 5 elementos | `:65` nome; `:94` `findByText("Cada café vendido ajuda.")`; `:95` `"Beneficiada: Instituto X"`; `:66` valor; `:96` `"Vigência: 01/11/2026 até 31/01/2027"`. **O ramo sem `fim` (`design.md:86`, "opcional") não tem asserção** (X4 sobreviveu) | ❌ | ⚠️ Parcial → T66 |
| AC7 `/empresa/{slug}/{slugCampanha}` rola até a campanha | `scrollIntoView` no subtópico daquele slug | `T/component/EmpresaCampanhaScroll.test.tsx:70-72` `alvo.id).toBe("mata-viva")` com 2 campanhas e alvo na 2ª; rota `:75-91` → `:90`; slug inexistente `:93-99` `not.toHaveBeenCalled()` | ❌ | ✅ |
| AC8 `NAO_INICIADA` → "Campanha ainda não iniciada" | marcação só em `NAO_INICIADA` | positivo `:141` `findByText("Campanha ainda não iniciada")`; negativo em `EM_ANDAMENTO` `:123` `toBeNull()` | ⚠️ | ✅ |
| AC9 sem campanha | "Nenhuma campanha publicada até o momento" | `:152-154` | ✅ | ✅ |
| AC10 `temLogo` falso → iniciais | iniciais | `:164` `findByText("CS")`; `:165` `queryByRole("img")).toBeNull()` | ✅ | ✅ |
| AC11 404 → "Empresa não encontrada" + link `/parceiros` | título + link | `:176` + `:178` `toHaveAttribute("href", "/parceiros")`. **Não há caso que prove que um erro diferente de 404 não cai nessa página** (X11 sobreviveu) | ✅ | ⚠️ Parcial → T66 |
| AC12 aviso literal | texto exato | `:189` `findByText(AVISO_FIVO_LAB)` (constante idêntica à spec em `:10-11`) | ✅ | ✅ |
| AC13 320 px | sem rolagem | jsdom não calcula layout | ⚠️ UAT | ⚠️ UAT |
| Edge case: logo que não carrega → iniciais | iniciais no lugar da imagem | `:108-111` `fireEvent.error(logo)` → `"CS"` e nenhum `img` (W10 morto) | ❌ | ✅ |

### P1: Detalhe e correção de campanha (VIT-11)

| Critério | Saída | `file:line` + asserção | Rodada 1 | Rodada 2 |
| -------- | ----- | ---------------------- | -------- | -------- |
| AC2 REJEITADA → "Motivo da rejeição" + texto, só em REJEITADA | só em REJEITADA | positivo `T/component/DetalheCampanha.test.tsx:221` `getByText("Motivo da rejeição")`; negativo com o motivo preenchido em `EM_ANALISE` `:207-210` (W25 e X7 mortos) | ⚠️ | ✅ |

**Status**: ⚠️ Há lacunas. São 41 critérios de tela e serviço: **36 ✅** (eram 32), 0 ❌ (eram 3), **2 ⚠️ parciais** (VIT-07 AC6 no ramo sem `fim` e VIT-07 AC11 no erro que não é 404, ambos na T66), 1 ⚠️ heurístico (VIT-09 AC5, que vai para o UAT) e 3 ⚠️ que dependem de UAT (320 px).

---

## Edge Cases

- [x] Slug de campanha inexistente na URL do QR → página no topo, sem erro: `T/component/EmpresaCampanhaScroll.test.tsx:93-99`.
- [x] **Logo que não carrega → iniciais**: na página pública em `T/component/PaginaEmpresaPublica.test.tsx:99-112` (fechado nesta rodada), em `/parceiros` em `T/component/Parceiros.test.tsx:91-102` e na home em `T/component/PartnerCompanies.test.tsx:74-84` (X8 morto).
- [~] Conteúdo com HTML ou script exibido como texto: o React escapa o texto. Não há teste, e o caso segue como follow-up 4.
- [x] Empresa suspensa / slug inexistente → 404 → "Empresa não encontrada": `T/component/PaginaEmpresaPublica.test.tsx:168-179`.
- [n/a] Aprovações simultâneas e alteração pendente na página pública: são do `api`.

---

## Discrimination Sensor

**Isolamento.** O sensor rodou num worktree temporário em `…/scratchpad/wt-r2-web` (`git worktree add --detach … HEAD`), com symlink para `web/node_modules`. Cada mutante foi aplicado por substituição exata e única de texto, rodado contra os testes que o cobrem e revertido com `git checkout -- . && git clean -fd -- web/src`, tudo dentro do worktree. A linha de base sem mutação, nos 33 arquivos de teste usados, deu 180 ok e 2 skip. Sem `git stash`, sem tocar na árvore real e sem tocar no `wt-r2-dom` do outro Verifier. O `git status --porcelain` da árvore real estava vazio antes. Depois, mostrou ` M api/.specs/features/vitrine-e-selo/validation-web.md` (este relatório) e ` M api/.specs/features/vitrine-e-selo/validation-dominio.md`. **Este Verifier não tocou o segundo arquivo**: ele é do Verifier do `api`, que roda em paralelo. Nenhum arquivo de `web/` mudou na árvore real. No fim, `git worktree remove --force` + `git worktree prune`.

Toda morte abaixo foi conferida no log: a falha vem de uma asserção (`AssertionError` ou `TestingLibraryElementError` no teste esperado), não de timeout.

### Reexecução dos sobreviventes da rodada 1

| ID | Alvo | Mutação | Rodada 1 | Rodada 2 | Morto por |
| -- | ---- | ------- | -------- | -------- | --------- |
| W8b | `S/components/empresa/PaginaEmpresaPublica.tsx:79` | slug existente → rola para a 1ª campanha | ❌ | ✅ Morto | `EmpresaCampanhaScroll.test.tsx:71` e `:90` (`expected 'agua-limpa' to be 'mata-viva'`) |
| W9 | `PaginaEmpresaPublica.tsx:182` | chip "Campanha ainda não iniciada" sempre visível | ❌ | ✅ Morto | `PaginaEmpresaPublica.test.tsx:123` |
| W10 | `PaginaEmpresaPublica.tsx:122` | remove o `onError` | ❌ | ✅ Morto | `:110` (não acha "CS") |
| W11 | `PaginaEmpresaPublica.tsx:153` | `href` do site → `#` | ❌ | ✅ Morto | `:80-83` |
| W12 | `PaginaEmpresaPublica.tsx:192` | beneficiada por `tipo` | ❌ | ✅ Morto | `:95` |
| W13 | `S/app/empresa/[slug]/[slugCampanha]/page.tsx:12` | não repassa `slugCampanha` | ❌ | ✅ Morto | `EmpresaCampanhaScroll.test.tsx:89` (spy chamado 0 vez) |
| W25 | `S/components/campanhas/DetalheCampanha.tsx:260` | motivo em qualquer status | ❌ | ✅ Morto | `DetalheCampanha.test.tsx:207` |

### Mutantes novos (arquivos das correções e ramos ainda fracos)

| ID | Alvo | Mutação | Resultado | Morto por |
| -- | ---- | ------- | --------- | --------- |
| X1 | `S/app/parceiros/page.tsx` + `S/lib/mockPartners.ts` | recria `mockPartners.ts` e o importa na vitrine | ✅ Morto | `mock-partners-removido.structural.test.ts:27` e `:46` (`['app/parceiros/page.tsx', …]`) |
| X2 | `S/components/home/PartnerCompanies.tsx:147` | card da home → `/parceiros/${slug}` | ✅ Morto | estrutural `:58` + `PartnerCompanies.test.tsx` |
| X3 | `PaginaEmpresaPublica.tsx:39` | vigência "até" → "a" | ✅ Morto | `PaginaEmpresaPublica.test.tsx:96` |
| X4 | `PaginaEmpresaPublica.tsx:40` | vigência sem `fim`: "A partir de" → "Desde" | ❌ **Sobreviveu** | nenhum teste tem campanha pública sem `fim` com asserção de vigência. `EmpresaCampanhaScroll.test.tsx:26,35` usa `vigencia: { inicio }`, mas não confere o texto |
| X5 | `PaginaEmpresaPublica.tsx:80` | efeito de rolagem só com `[slugCampanha]` (sem `empresa`) | ✅ Morto | `EmpresaCampanhaScroll.test.tsx:69` e `:89` |
| X6 | `PaginaEmpresaPublica.tsx:117` | `urlDoLogo(empresa.nomeFantasia)` | ✅ Morto | `PaginaEmpresaPublica.test.tsx:79` |
| X7 | `DetalheCampanha.tsx:260` | `=== "REJEITADA"` → `!== "APROVADA"` | ✅ Morto | `DetalheCampanha.test.tsx:207` |
| X8 | `PartnerCompanies.tsx:45` | remove o `onError` do logo da home | ✅ Morto | `PartnerCompanies.test.tsx` (sem `iniciais-logo`) |
| X9 | `S/components/admin/FilaCampanhas.tsx:136` | não recarrega a fila no 409 | ✅ Morto | `FilaCampanhas.test.tsx` ("expected spy to be called 2 times") |
| X10 | `S/lib/campanhas/edicao.ts` (`alteracoes`) | PATCH com todos os campos | ✅ Morto | `DetalheCampanha.test.tsx` ("PATCH só com o campo alterado", 3 testes) |
| X11 | `PaginaEmpresaPublica.tsx:61` | `e.status === 404` → `e.status >= 400` | ❌ **Sobreviveu** | nenhum teste da página pública responde 5xx (ou 4xx ≠ 404) |
| X12 | `S/components/campaign-wizard/CampaignWizardNew.tsx:61` | `if (!id)` → `if (true)` (recria no retry) | ✅ Morto | `CampaignWizardNew.test.tsx:206` ("called 1 times, but got 2") |
| X13 | `S/app/parceiros/[id]/page.tsx` | recria a rota | ✅ Morto | estrutural `:31` |

Equivalentes que ficaram de fora: o chip `=== "NAO_INICIADA"` → `!== "EM_ANDAMENTO"`, porque `situacao` só tem os dois valores, e o guarda `!empresa` do efeito, porque a dependência em `empresa` refaz o efeito quando os dados chegam.

**Sensor depth**: lightweight-plus. Foram 7 reexecuções e 13 mutantes novos, cobrindo os arquivos das correções (estrutural, página pública, rota do QR, detalhe) e ramos ainda fracos (vigência aberta, erro não 404, retry do wizard, PATCH parcial, recarga da fila, logo da home).
**Result**: 20 injetados, 18 mortos, **2 sobreviventes (X4, X11)**, 0 equivalentes contados. ❌ FAIL.

---

## Divergências de contrato com `design.md`

Nenhuma nova. As notas (a)–(c) da rodada 1 continuam valendo: `site` tipado como `string` (SP2), `urlPublica` buscada em `GET /campanhas` e a mensagem do 404 do selo trocada por `mensagemDeErro`. O `fim` opcional da vigência pública (`design.md:86`) está tipado certo em `S/services/empresasPublicas.ts:20` (`fim?: string`) e tratado em `PaginaEmpresaPublica.tsx:38-40`. Só falta o teste (X4).

---

## Code Quality

| Princípio | Status | Nota |
| --------- | ------ | ---- |
| Minimum code / no scope creep | ✅ | T61–T63 são só teste. A T60 só remove código. A T64 mexe só em configuração de teste |
| Surgical changes | ✅ | `parceiros/[id]` e `mockPartners` saíram (era ⚠️ na rodada 1) |
| Matches patterns | ⚠️ | As duplicações da rodada 1 continuam (follow-up 6), assim como a indentação torta em `PaginaEmpresaPublica.tsx:71`, `:81` e `:160`. `EmpresaCampanhaScroll.test.tsx:57` atribui `Element.prototype.scrollIntoView` sem restaurar, e o `vi.restoreAllMocks()` não desfaz isso. O vazamento fica contido no arquivo, porque o Vitest isola por arquivo. Nada bloqueia |
| Spec-anchored outcome check | ✅ | Os textos novos batem literalmente com a spec ("Beneficiada: …", "Campanha ainda não iniciada", "Motivo da rejeição") |
| Per-layer coverage | ⚠️ | Serviços em 100%. Na página pública falta o estado de erro que não é 404 e a vigência aberta (T66) |
| Todo teste mapeia para AC / edge / Done-when | ✅ | Os 10 testes novos mapeiam para VIT-07 AC6/AC7/AC8, o edge case do logo, VIT-11 AC2 e a Done-when da T40/T60 |
| Guidelines documentadas | ✅ | Nenhuma no projeto. Segui os strong defaults da Test Coverage Matrix de `tasks.md` |
| Senior engineer aprovaria? | ✅ | Sim, depois da T66, que é pequena |

---

## Spec-Precision Gaps

| # | AC | Problema | Estado |
| - | -- | -------- | ------ |
| SP1 | VIT-07 AC6, VIT-11 AC1, VIT-12 AC1 | "Período de vigência" sem formato definido. O `web` usa "dd/mm/aaaa até dd/mm/aaaa" e "A partir de dd/mm/aaaa" na página pública, e "a" no detalhe e na fila | Aberto, não bloqueia. A T66 trava o formato atual da página pública, sem decidir o formato canônico |
| SP2 | VIT-07 AC1/AC6 | A spec não diz se `site` pode faltar | Aberto. O `web` trata a ausência (`PaginaEmpresaPublica.tsx:152`) |
| SP3 | VIT-03 AC10, VIT-07 AC13, VIT-09 AC5 | 320 px não é verificável em jsdom | Vai para o UAT de 10/11 |
| SP4 | VIT-03 AC8 | Não define se "Ver página pública" abre em nova aba | Aberto, cosmético |
| SP5 | VIT-07 AC11 | A spec só define o 404. Não diz o que a página pública mostra em 5xx ou falha de rede | Aberto. O `web` já mostra o erro genérico com "Tentar novamente" (`AsyncState`), e a T66 trava esse comportamento |

---

## Fix Plans

### T66: Página pública — vigência sem `fim` e erro que não é 404

**What**: Em `PaginaEmpresaPublica.test.tsx`, acrescentar dois casos:

- (a) Campanha com `vigencia: { inicio: "2026-11-01" }` (sem `fim`, que `design.md:86` declara opcional), conferindo `getByText("Vigência: A partir de 01/11/2026")`.
- (b) `GET /empresas/publicas/{slug}` respondendo 500, conferindo que "Empresa não encontrada" **não** aparece e que aparece o estado de erro do `AsyncState`, com o botão de nova tentativa. Se der, conferir também que o clique refaz a requisição.

**Where**: `web/tests/component/PaginaEmpresaPublica.test.tsx`
**Depends on**: None
**Requirement**: VIT-07 AC6 (vigência) e AC11; Test Coverage Matrix ("estados vazio/erro/carregando")
**Priority**: Minor
**Tests**: component
**Gate**: web
**Done when**:
- [ ] X4 morre (`"A partir de"` → `"Desde"` em `S/components/empresa/PaginaEmpresaPublica.tsx:40` faz algum teste falhar)
- [ ] X11 morre (`e.status === 404` → `e.status >= 400` em `PaginaEmpresaPublica.tsx:61` faz algum teste falhar)
- [ ] Gate `web` passa

---

## Follow-ups não bloqueantes

1. **Wizard: edição depois da criação.** Se a capa ou a submissão falharem depois do `POST`, a nova tentativa reaproveita o `campanhaId` (`S/components/campaign-wizard/CampaignWizardNew.tsx:58-69`), mas não envia o que a empresa corrigiu nos campos entretanto, porque não há `PATCH`. Vale um `editarCampanha` com `alteracoes(...)` quando o `id` já existe, ou travar os campos depois da criação.
2. **Home**: o subtítulo "Veja campanhas em andamento e o que já foi doado." (`S/components/home/PartnerCompanies.tsx`) promete o "valor doado", que saiu da v1 pelo AD-023. Revisar o texto.
3. **Download do selo**: `URL.revokeObjectURL` logo depois do `click()` (`CampaignCard.tsx:41`, `DetalheCampanha.tsx:92`) pode cancelar o download em alguns navegadores. Conferir no UAT.
4. **`site` da empresa**: validar o esquema `http(s)` antes de usar como `href` (`PaginaEmpresaPublica.tsx:153`).
5. **Beneficiada fora do catálogo no detalhe**: se a instituição for suspensa, o detalhe mostra "—" (`DetalheCampanha.tsx:67-71`). Fica aceitável na v1.
6. **Duplicações** (`salvarNoComputador`, `iniciais`, `formatarData`) e formato da vigência uniforme (SP1): pode virar `lib/campanhas/formatacao.ts`. Corrigir de passagem a indentação de `PaginaEmpresaPublica.tsx:71,81,160`.
7. **Propriedades por semente fora do escopo**: `SeletorCausa.property-selecao` e `CadastroInstituicao.property-envio-valido` (feature `seletor-causa-cadastro-instituicao`). Ver §Propriedades que dependem da semente. Pedem uma task própria nessa feature: corrigir o gerador de `id` ou o componente para `id` só de espaços.
8. **Timeouts globais da T64**: com `testTimeout: 30000` e `asyncUtilTimeout: 5000`, um teste travado demora até 30 s para falhar. Se o gate ficar lento para diagnosticar, avaliar timeouts por projeto do Vitest (componentes vs. unit).
9. **`EmpresaCampanhaScroll.test.tsx:57`**: guardar e restaurar o `Element.prototype.scrollIntoView` original no `afterEach`.

---

## UAT pendente (ponta a ponta de 10/11)

1. Área da empresa, `/campanhas/[id]`, `/empresa/{slug}` e `/parceiros` em 320 px, sem rolagem horizontal (VIT-03 AC10, VIT-07 AC13, VIT-09 AC5).
2. "Baixar selo" salva `selo-{slugCampanha}.svg` de verdade no Chrome desktop, Chrome Android e Safari iOS (VIT-05 AC9; follow-up 3).
3. QR do selo lido no celular abre `/empresa/{slug}/{slugCampanha}` sem login e rola até a campanha certa, inclusive com várias campanhas e com o cabeçalho fixo cobrindo o título (`scrollMarginTop: 16`).
4. Logo real carregado e logo quebrado viram iniciais na página pública.
5. Fluxo criar → enviar → aprovar no admin → selo disponível no card → "Ver página pública" abre a URL absoluta de `WEB_URL`.
6. Rejeitar com motivo → detalhe mostra "Motivo da rejeição" → corrigir → reenviar → volta à fila e o detalhe em análise **não** mostra mais o motivo.
7. Com a API fora do ar (ou respondendo 500), `/empresa/{slug}` mostra o erro com "Tentar novamente", e não "Empresa não encontrada".

---

## Requirement Traceability Update

`spec.md` não foi editado. Status proposto para o orquestrador aplicar:

| Requirement | Rodada 1 | Status proposto (`web`, rodada 2) |
| ----------- | -------- | --------------------------------- |
| VIT-03 | ✅ (AC10 no UAT) | ✅ Verificado (AC10 no UAT) |
| VIT-05 | ✅ | ✅ Botão verificado (download real no UAT) |
| VIT-07 | ❌ Needs Fix | ⚠️ Needs Fix menor (T66); AC7, AC8 e edge do logo ✅ |
| VIT-09 | ❌ Needs Fix (T60) | ✅ Verificado (AC5 no UAT) |
| VIT-10 | ✅ (T64) | ✅ Verificado, gate estável |
| VIT-11 | ⚠️ (T63) | ✅ Verificado |
| VIT-12 | ✅ | ✅ Verificado |

---

## Summary

**Overall**: ❌ Not Ready, falta uma task de teste. T60–T65 estão cumpridas e verificadas, e falta só a T66.

**Spec-anchored check**: 41 critérios: 36 ✅, 0 ❌, 2 ⚠️ parciais (T66), 1 ⚠️ heurístico e 3 ⚠️ para UAT. São 5 spec-precision gaps (SP1–SP5).
**Sensor**: 20 injetados (7 reexecuções e 13 novos), 18 mortos, 2 sobreviventes (X4, X11), 0 equivalentes.
**Gate**: ✅ 3/3 com exit 0 (329 ok, 2 skip, 0 falhas), com load de 17 a 22, inclusive num worktree sem `.next`. A contagem foi 199 → 321 → 331.

**O que funciona**: tudo o que a rodada 1 já tinha verificado. Além disso, `parceiros/[id]` e `mockPartners` saíram, e um teste estrutural impede a volta. O card e o subtópico da página pública têm asserção em cada elemento do AC6. A rolagem do QR é provada pelo elemento certo e pela rota real. O motivo da rejeição só aparece em `REJEITADA`. O gate é reproduzível e estável sob carga.

**Próximos passos**: (1) o grupo executa a T66; (2) rodada 3 desta verificação, que pode se limitar a X4, X11 e ao gate; (3) UAT de 10/11 com a lista acima; (4) follow-up 7 na feature `seletor-causa-cadastro-instituicao`.
