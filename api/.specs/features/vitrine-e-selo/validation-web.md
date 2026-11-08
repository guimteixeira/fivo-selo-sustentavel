**Verdict**: FAIL

# Vitrine e Selo — Validação do `web` (T29–T44), rodada 1

**Veredito**: ❌ **FAIL**. O núcleo do `web` está bem feito. Os serviços batem com `design.md` §Contratos HTTP, e a área da empresa, o detalhe por status, a nova campanha, a fila do admin e a vitrine `/parceiros` têm testes que discriminam (19 dos 26 mutantes morreram). Três coisas bloqueiam o PASS:

1. **Done-when não cumprida em T34 e T40.** `web/src/app/parceiros/[id]/page.tsx` continua no repositório, ainda importa `mockPartnerCompanies` de `web/src/lib/mockPartners.ts` (`:16`) e serve dados fictícios numa rota pública. O teste estrutural "nenhum arquivo importa `mockPartners`" não existe.
2. **Página pública (VIT-07) com cobertura rasa.** `site`, descrição, beneficiada, vigência, a troca do logo quebrado pelas iniciais e a ausência da marcação "Campanha ainda não iniciada" em `EM_ANDAMENTO` não têm asserção. A rolagem até a campanha certa e a rota do QR no nível da página também não. São 6 sobreviventes: W8b, W9, W10, W11, W12 e W13.
3. **Gate `web` vermelho como está escrito.** O `tsc` quebra por causa do cache `.next` desatualizado, que ainda aponta para as páginas apagadas. Num checkout limpo ele quebra por falta dos tipos gerados (`LayoutProps`). Com `npx next typegen` antes, passa. Sob carga, o primeiro teste de `CampaignWizardNew.test.tsx` estoura o timeout de 5 s em 2 de 3 execuções.

**Data**: 2026-11-08
**Spec**: `.specs/features/vitrine-e-selo/spec.md` (VIT-03, 05, 07, 09, 10, 11, 12, só a parte `web`)
**Diff range**: `96c313f..ed49618 -- web` (55 arquivos, +4810/−2021)
**Verifier**: sub-agente independente (autor ≠ verificador), somente leitura sobre o código. Escreve só este arquivo.
**Escopo**: T29–T44. A infra do `api` (T19–T28) não existe, então o `web` foi verificado contra o contrato com `fetch` mockado. Sem UAT interativo: ele fica para o ponta a ponta de 10/11 (lista no fim).

Caminhos abreviados: `S/` = `web/src/`, `T/` = `web/tests/`.

---

## Gate Check

- **Gate command** (`tasks.md`, Web): `cd web && npx tsc --noEmit && npm run lint && npm test`, rodado na árvore real com a saída em arquivo no scratchpad.

| Etapa | Exit | Resultado |
| ----- | ---- | --------- |
| `tsc --noEmit` (árvore real) | 2 | `.next/types/validator.ts:60,78` e `.next/dev/types/validator.ts:60,78`: `Cannot find module '…/(app)/comprovantes/page.js'` e `'…/(app)/selos/page.js'`. É cache gerado (ignorado pelo git) que ainda referencia as páginas removidas na T38 |
| `tsc --noEmit` (worktree limpo, sem `.next`) | 2 | `S/app/layout.tsx:18` `Cannot find name 'LayoutProps'`. É tipo global gerado pelo Next. Já acontecia antes da feature, porque `layout.tsx` não está no diff |
| `npx next typegen && tsc --noEmit` (worktree limpo) | 0 | ok |
| `npm run lint` | 0 | 0 erros, 2 avisos em `T/unit/servicos-opcionais-contrato.conditional.test.ts`, que está fora do diff |
| `npm test`, execução 1 (real) | 1 | 69 arquivos, 316 ok, 3 falhas, 2 skip. Falhas por timeout: `T/component/CampaignWizardNew.test.tsx:113` (escopo), `FilaEmpresas.property-campos-essenciais` e `ui-states 6.4` (fora do escopo) |
| `npm test`, execução 2 (worktree limpo) | 1 | 316 ok, 3 falhas por timeout: de novo `CampaignWizardNew.test.tsx:113`, mais `FilaEmpresas.test.tsx (R8)` e `ui-states 6.4` |
| `npm test`, execução 3 (real) | 1 | 317 ok, 2 falhas por timeout, ambas fora do escopo (`FilaEmpresas.property`, `ui-states 6.4`). `CampaignWizardNew` passou |
| Os 3 arquivos que falharam, isolados | 0 | 15/15. O teste `:113` leva 832 ms |

- **Carga durante as execuções**: load average de 25 em 32 núcleos. Outro agente rodava ao mesmo tempo o gate e2e do `api` no mesmo scratchpad. Os timeouts dependem da carga, mas o de `CampaignWizardNew.test.tsx:113` é o primeiro teste do arquivo, que paga o aquecimento de MUI e jsdom, e caiu em 2 de 3 execuções. Isso pede ajuste (T64). `FilaEmpresas.property-campos-essenciais` já falhava por timeout na base (`96c313f`) e não é regressão.
- **Contagem de testes**: base `96c313f` com 199 testes (184 ok, 14 skip, 1 timeout pré-existente) → agora **321** (2 skip), ou seja **+122**. Os 12 skips a menos são os testes condicionais apagados.
- **Integridade**:
  - `T/unit/selos.conditional.test.ts` (−260) e `T/unit/comprovantes.conditional.test.ts` (−223) foram removidos na T38. A remoção está prevista na T38 e justificada no commit `efcf7ca`: os serviços `selos.ts` e `comprovantes.ts` saíram pelo AD-023. **Remoção justificada.**
  - `S/app/(app)/selos/page.tsx`, `S/app/(app)/comprovantes/page.tsx`, `CampaignWizard.tsx` e `StepModeloSelo.tsx` foram removidos, como pedem a T38, a T41 e o VIT-10 AC6.
  - Nos testes `wizard-*`, nenhum `it(` foi removido. Em `T/integration/wizard-bloqueio-avanco.test.tsx`, a Property 13 do wizard antigo (passo 2 sem beneficiada) virou "passo 2 sem data de início", já que no wizard único a beneficiada está no passo 1. Nenhum caso se perdeu.

---

## Task Completion

As caixas de T29–T44 em `tasks.md` estão desmarcadas, o que é esperado: pela memória do projeto, quem marca é o agente no handoff, não as PRs humanas. Conferi cada Done-when no código.

| Task | Status | Evidência / pendência |
| ---- | ------ | --------------------- |
| T29 serviço lista + selo | ✅ | URL, método e 200 em `T/unit/campanhas.test.ts:38-47`. 403/404/409 → `ApiError` com status em `:49-58` (lista) e `:94-111` (selo). O nome vem de `Content-Disposition` em `:64-82` (`nomeArquivo).toBe("selo-agua-limpa.svg")`), com fallback em `:84-92` |
| T30 formatação | ✅ | `T/unit/campanhas.formatacao.test.ts:9-20` (os 3 textos literais) e `:33-41` (os 4 rótulos) |
| T31 cards | ✅ | `T/component/CampaignCard.test.tsx`: textos `:156-169`, rótulos `:171-185`, botões só na APROVADA `:187-212`, download `:226-241`, vazio `:258-269`, sem "doados/QR gerado/comprovante" `:271-280`. Também `/campanhas` `:283-310` e dashboard `:312-371` |
| T32 serviço empresas públicas | ✅ | `T/unit/empresasPublicas.test.ts:21-31` (lista), `:33-62` (detalhe), `:64-72` (404 → `ApiError` 404), `:74-76` (`urlDoLogo`) |
| T33 página `/empresa/[slug]` | ⚠️ Parcial | Card com logo e link do `site`: **sem asserção** (W11). Descrição, beneficiada e vigência do subtópico: **sem asserção** (W12). Iniciais em "erro de imagem": **sem asserção** (W10). Os demais itens estão ok (tabela de ACs) |
| T34 rota do QR | ❌ | `scrollIntoView` é conferido só com `toHaveBeenCalled()` e uma única campanha (`T/component/EmpresaCampanhaScroll.test.tsx:54-61`), então não prova "no subtópico certo" (W8b). A página `S/app/empresa/[slug]/[slugCampanha]/page.tsx:12` não é testada (W13). `isPublicRoute` ok (`T/unit/routes.empresa.test.ts:5-11`). **`S/app/parceiros/[id]/page.tsx` não foi removido** |
| T35 serviço detalhe/edição | ✅ | `T/unit/campanhas.detalhe.test.ts:40-47` (GET), `:64-89` (PATCH + corpo), `:49-60`/`:101-112` (404), `:114-125` (409) |
| T36 página `/campanhas/[id]` | ✅ (1 sobrevivente) | Um teste por status em `T/component/DetalheCampanha.test.tsx:188-239`, submissão `:243-252`, 404 `:343-354`. W25 sobreviveu: o motivo aparece fora de `REJEITADA` (T63) |
| T37 serviço criar/capa/submeter | ✅ | `T/unit/campanhas.criacao.test.ts:23-43` (POST + corpo JSON), `:68-82` (PUT multipart no campo `capa`, sem Content-Type manual), `:86-93` (POST submissão sem corpo) |
| T38 remover `/selos` e `/comprovantes` | ✅ | Páginas apagadas. `S/lib/routes.ts:15-19` sem as chaves. Menu em `T/component/AppHeader.menu.test.tsx:38-65` (desktop, celular e nenhum `href`). Commit `efcf7ca` registra o motivo |
| T39 vitrine `/parceiros` | ✅ | `T/component/Parceiros.test.tsx:56-67` (cards), `:69-79` (`href` = `/empresa/{slug}`), `:81-102` (logo e iniciais), `:104-110` (vazio + `/cadastro`) |
| T40 parceiros da home | ❌ | O comportamento está ok em `T/component/PartnerCompanies.test.tsx:56-63`. **O teste estrutural "nenhum arquivo importa `mockPartners`" não existe**, e `S/lib/mockPartners.ts` continua importado por `S/app/parceiros/[id]/page.tsx:16` |
| T41 wizard ligado à API | ✅ (gate instável) | `T/component/CampaignWizardNew.test.tsx:113-132` (POST com os campos + `push('/campanhas/camp-1')`), `:156-168` (capa depois da criação), `:170-185` (submissão + mensagem literal), `:187-204` (erro mantém os campos), `:226-238` (sem modelo de selo, "Etapa 3 de 3"). O teste `:113` estoura o timeout sob carga (T64) |
| T42 serviço admin | ✅ | `T/unit/admin.campanhas.test.ts:50-59` (fila), `:63-87` (aprovações + 409), `:90-117` (rejeições com `{ motivo }` + 409) |
| T43 `/admin/campanhas` | ✅ | `T/component/FilaCampanhas.test.tsx:98-121` (ordem, rótulos e campos), `:130-149` (aprovar por tipo e retirar), `:151-172` (rejeitar por tipo), `:174-188` (19 → desabilitado, 20 → habilitado), `:190-208` (409 + recarga), `:123-128` (vazio) |
| T44 menu do admin | ✅ | `T/component/AdminHeader.campanhas.test.tsx:32-36` (`href` = `/admin/campanhas`). O item está em `S/components/layout/AdminHeader.tsx:20`, e não em `app/admin/layout.tsx` como diz o Where, mas fica no mesmo menu |

---

## Spec-Anchored Acceptance Criteria

### P1: Campanhas na área da empresa — `web` (VIT-03)

| Critério | Saída definida pela spec | `file:line` + asserção | Resultado |
| -------- | ------------------------ | ---------------------- | --------- |
| AC5 um card por campanha com nome, valor e status | card com os 3 | `T/component/CampaignCard.test.tsx:165` `expect(await cards()).toHaveLength(3)`; `:166-168` `within(card(...)).getByText("R$ 1,50 por unidade vendida")` | ✅ |
| AC6 texto do valor | "R$ 1,00 por unidade vendida" / "2,5% de cada venda" / "Regra de doação não definida" | `T/unit/campanhas.formatacao.test.ts:10-11` `toBe("R$ 1,00 por unidade vendida")`; `:16` `toBe("2,5% de cada venda")`; `:20` `toBe("Regra de doação não definida")` | ✅ |
| AC7 rótulos | "Rascunho", "Em análise", "Aprovada", "Rejeitada" | `T/unit/campanhas.formatacao.test.ts:33-41` `rotuloDoStatus(status)).toBe(rotulo)`; `T/component/CampaignCard.test.tsx:171-185` | ✅ |
| AC8 "Baixar selo" + "Ver página pública" (`urlPublica`) só na APROVADA | botões só em APROVADA; `href` = `urlPublica` | `CampaignCard.test.tsx:194` `getByRole("button", { name: "Baixar selo" })`; `:196` `toHaveAttribute("href", URL_PUBLICA)`; `:201-212` ausentes em RASCUNHO, EM_ANALISE e REJEITADA | ✅ |
| AC9 sem campanhas | "Você ainda não tem campanhas." + "Criar campanha" | `CampaignCard.test.tsx:263` `findByText("Você ainda não tem campanhas.")`; `:264-267` `link "Criar campanha"` → `/campanhas/nova` | ✅ |
| AC10 320 px sem rolagem horizontal | sem rolagem | sem evidência (jsdom não calcula layout) | ⚠️ UAT |

### P1: Selo genérico — botão no `web` (VIT-05)

| Critério | Saída | `file:line` + asserção | Resultado |
| -------- | ----- | ---------------------- | --------- |
| AC9 clicar "Baixar selo" baixa `selo-{slugCampanha}.svg` | download com o nome do `Content-Disposition` | `T/unit/campanhas.test.ts:80` `nomeArquivo).toBe("selo-agua-limpa.svg")`; `T/component/CampaignCard.test.tsx:239` `downloads[0]).toEqual({ href: "blob:selo", download: "selo-agua-limpa.svg" })` | ✅ |
| AC6/AC7 (409/404) chegam ao `web` como erro | `ApiError` com status e mensagem | `T/unit/campanhas.test.ts:94-111` `status).toBe(status)` + `message).toBe(mensagem)`; `CampaignCard.test.tsx:252-255` "Campanha não está aprovada" no card | ✅ |

### P1: Página pública da empresa — `web` (VIT-07)

| Critério | Saída | `file:line` + asserção | Resultado |
| -------- | ----- | ---------------------- | --------- |
| AC6 card: logo, `nomeFantasia`, cidade/UF, link do `site` | 4 elementos | `T/component/PaginaEmpresaPublica.test.tsx:63` `findByText("Café Serra Verde")`; `:64` `getByText("Campinas/SP")`. **Logo (`src`) com `temLogo` verdadeiro e `href` do `site`: sem asserção** (W11 sobreviveu) | ❌ GAP |
| AC6 subtópico: nome, descrição, beneficiada, valor, vigência | 5 elementos | `:65` `getByText("Água Limpa")`; `:66` `getByText(/R\$ 1,00 por unidade vendida/)`; `:67` `#agua-limpa` existe. **Descrição, beneficiada e vigência: sem asserção** (W12 sobreviveu) | ❌ GAP |
| AC7 `/empresa/{slug}/{slugCampanha}` rola até a campanha | `scrollIntoView` no subtópico daquele slug | `T/component/EmpresaCampanhaScroll.test.tsx:60` `expect(scrollSpy).toHaveBeenCalled()`, com uma campanha só e sem conferir o elemento (W8b sobreviveu). Slug inexistente → `:67` `not.toHaveBeenCalled()` (W8 morreu). A rota `S/app/empresa/[slug]/[slugCampanha]/page.tsx:12` não é testada (W13 sobreviveu) | ❌ GAP |
| AC8 `NAO_INICIADA` → "Campanha ainda não iniciada" | marcação só em `NAO_INICIADA` | `PaginaEmpresaPublica.test.tsx:85` `findByText("Campanha ainda não iniciada")`. Não há caso negativo em `EM_ANDAMENTO` (W9 sobreviveu) | ⚠️ Parcial |
| AC9 sem campanha | "Nenhuma campanha publicada até o momento" | `:96-98` `findByText("Nenhuma campanha publicada até o momento")` | ✅ |
| AC10 `temLogo` falso → iniciais | iniciais de `nomeFantasia` | `:108` `findByText("CS")`; `:109` `queryByRole("img")).toBeNull()` (W24 morreu) | ✅ |
| AC11 404 → "Empresa não encontrada" + link `/parceiros` | título + link | `:120` `findByText("Empresa não encontrada")`; `:122` `toHaveAttribute("href", "/parceiros")` | ✅ |
| AC12 aviso literal | texto exato | `:133` `findByText(AVISO_FIVO_LAB)`, com a constante idêntica à da spec em `:10-11` | ✅ |
| AC13 320 px | sem rolagem | sem evidência | ⚠️ UAT |
| Rota pública (design, risco `isPublicRoute`) | `/empresa/...` público | `T/unit/routes.empresa.test.ts:6` e `:10` `toBe(true)` (W22 morreu) | ✅ |

### P1: Vitrine de parceiros — `web` (VIT-09)

| Critério | Saída | `file:line` + asserção | Resultado |
| -------- | ----- | ---------------------- | --------- |
| AC3 card com logo, nome e cidade/UF → `/empresa/{slug}` | 3 elementos + link | `T/component/Parceiros.test.tsx:60-63` (nome e cidade/UF); `:74` `toHaveAttribute("href", "/empresa/cafe-serra-verde")`; `:86` `src` do logo (W19 e W20 mortos). Home: `T/component/PartnerCompanies.test.tsx:61` | ✅ |
| AC4 vazio | "Nenhuma empresa parceira ainda." + link para o cadastro | `Parceiros.test.tsx:108` `findByText("Nenhuma empresa parceira ainda.")`; `:109` `href` = `/cadastro` | ✅ |
| AC5 320 px | sem rolagem | `Parceiros.test.tsx:152-163`: heurística sem largura fixa ≥ 100 px | ⚠️ Parcial, confirmar no UAT |

### P1: Nova campanha ligada à API (VIT-10)

| Critério | Saída | `file:line` + asserção | Resultado |
| -------- | ----- | ---------------------- | --------- |
| AC1 POST com os campos do formulário | corpo com nome, descrição, `instituicaoId`/`causaId`, regra, meta e vigência | `T/component/CampaignWizardNew.test.tsx:122-129` `criarCampanha).toHaveBeenCalledWith({...})`; `:152-153` `causaId` sem `instituicaoId`; `T/unit/campanhas.criacao.test.ts:36-41` `corpoJson: dados` | ✅ |
| AC2 capa por PUT depois da criação | ordem criar → capa | `CampaignWizardNew.test.tsx:164-167` `enviarCapa).toHaveBeenCalledWith("camp-1", capa)` + `invocationCallOrder` (W18 morreu) | ✅ |
| AC3 "Salvar rascunho" → `/campanhas/{id}` | navegação | `:120` `push).toHaveBeenCalledWith("/campanhas/camp-1")` | ✅ |
| AC4 "Enviar para análise" → criação + submissão + "Campanha enviada para análise." | mensagem literal | `:178` `findByText("Campanha enviada para análise.")`; `:180-183` ordem | ✅ |
| AC5 erro → `mensagemDeErro`, mantendo os campos | texto + valores | `:194-202` `toHaveTextContent("Instituição ou causa indisponível")` + `toHaveValue("Água Limpa")` | ✅ |
| AC6 sem passo de modelo de selo | ausente | `:229-237` `queryByText(/modelo de selo/i)).not…` + "Etapa 3 de 3"; arquivos removidos | ✅ |

### P1: Detalhe e correção de campanha (VIT-11)

| Critério | Saída | `file:line` + asserção | Resultado |
| -------- | ----- | ---------------------- | --------- |
| AC1 nome, descrição, capa, beneficiada, valor, meta, vigência e status | todos | `T/component/DetalheCampanha.test.tsx:167-177` (descrição, "Casa do Bem", "R$ 1,50 por unidade vendida", `/R\$\s5\.000,00/`, "01/11/2026 a 31/01/2027", "Rascunho", capa `src`) | ✅ |
| AC2 REJEITADA → "Motivo da rejeição" + texto | só em REJEITADA | `:207-210` `getByText("Motivo da rejeição")` + texto. As ausências em `:195` usam `motivoUltimaRejeicao: null`, então "só em REJEITADA" não é provado (W25 sobreviveu) | ⚠️ Parcial |
| AC3 RASCUNHO/REJEITADA → PATCH + "Enviar para análise" → POST submissão | botões + chamadas | `:191-192`, `:211-212` (botões); `:264-267` `editarCampanha).toHaveBeenCalledWith("camp-1", { descricao })`; `:250` `submeterCampanha).toHaveBeenCalledWith("camp-1")` (W14 morreu) | ✅ |
| AC4 EM_ANALISE → sem edição + "Campanha em análise pela Fivo Lab." | texto literal | `:220-224` (W15 morreu) | ✅ |
| AC5 APROVADA → só leitura + "Baixar selo" + "Ver página pública" | botões | `:231-237` + `href` = `URL_PUBLICA`; download `:337` | ✅ |
| AC6 404 → "Campanha não encontrada" + link `/campanhas` | título + link | `:347-353` (W23 morreu) | ✅ |
| AC7 remover `/selos` e `/comprovantes` e os itens de menu | ausentes | `T/component/AppHeader.menu.test.tsx:44-45`, `:54-55`, `:63-64`; páginas apagadas | ✅ |

### P1: Fila de campanhas no admin (VIT-12)

| Critério | Saída | `file:line` + asserção | Resultado |
| -------- | ----- | ---------------------- | --------- |
| AC1 itens na ordem, com "Nova"/"Alteração", `empresa`, nome, beneficiada, valor, vigência e `submetidoEm` | todos | `T/component/FilaCampanhas.test.tsx:103-120` | ✅ |
| AC2 aprovar NOVA → `/aprovacao` + retirar | rota + saída | `:142-147` `rotaCerta).toHaveBeenCalledWith(item.campanhaId)`, `rotaErrada).not…`; `T/unit/admin.campanhas.test.ts:71` URL | ✅ |
| AC3 aprovar ALTERACAO → `/alteracao/aprovacao` | rota | mesmo `it.each` (W17 morreu); `admin.campanhas.test.ts:64` | ✅ |
| AC4 rejeitar → pedir o motivo + rota por tipo + `{ motivo }` | corpo | `FilaCampanhas.test.tsx:169`; `admin.campanhas.test.ts:103` `toEqual({ motivo: MOTIVO })` (W21 morreu) | ✅ |
| AC5 menos de 20 caracteres → confirmar desabilitado | 19 desabilitado, 20 habilitado | `:182-187` (W16 morreu) | ✅ |
| AC6 409 → `mensagemDeErro` + recarga | texto + 2ª chamada | `:201-207` | ✅ |
| AC7 vazio | "Nenhuma campanha aguardando análise." | `:127` | ✅ |
| AC8 item "Campanhas" no menu → `/admin/campanhas` | `href` | `T/component/AdminHeader.campanhas.test.tsx:35` | ✅ |

**Status**: ❌ Há lacunas. São 41 critérios de tela e serviço: 32 ✅, 3 ❌ (VIT-07 AC6 em dois critérios e AC7), 3 ⚠️ parciais (VIT-07 AC8, VIT-11 AC2, VIT-09 AC5) e 3 ⚠️ que dependem de UAT (320 px).

---

## Edge Cases

- [x] Slug de campanha inexistente na URL do QR → página no topo, sem erro: `T/component/EmpresaCampanhaScroll.test.tsx:63-68`.
- [ ] **Logo que não carrega → iniciais** na página pública: o código existe (`S/components/empresa/PaginaEmpresaPublica.tsx:122`), mas não há teste (W10). Em `/parceiros` e na home está coberto: `T/component/Parceiros.test.tsx:91-102` e `T/component/PartnerCompanies.test.tsx:74-84`.
- [~] Conteúdo com HTML ou script exibido como texto: o React escapa o texto. O `href` do `site` (`PaginaEmpresaPublica.tsx:153`) é dado da empresa, e o React 19.2 bloqueia URLs `javascript:`. Não há teste. Fica como follow-up 4.
- [x] Empresa suspensa / slug inexistente → 404 → página "Empresa não encontrada": `T/component/PaginaEmpresaPublica.test.tsx:112-123`.
- [n/a] Aprovações simultâneas e alteração pendente na página pública: são do `api`.

---

## Discrimination Sensor

Worktree temporário (`git worktree add --detach … HEAD`) com symlink de `web/node_modules`, e cada mutante rodado só contra os testes que o cobrem. O `git status --porcelain` da árvore real estava vazio antes da primeira execução. Depois da limpeza mostrou ` M api/.specs/LESSONS.md` e ` M api/.specs/lessons.json`, com mtime de 10:16:13. **Esses arquivos não foram tocados por este Verifier**, que nunca rodou `lessons.py` nem escreveu em `api/.specs/` antes deste relatório. A mudança veio do agente paralelo do `api`, que usava o mesmo scratchpad (`wt-sensor`, `g*.txt`). Os dois worktrees deste Verifier foram removidos com `worktree remove --force` + `prune`, e o `wt-sensor` do outro agente ficou intacto.

| ID | Alvo | Mutação | Resultado |
| -- | ---- | ------- | --------- |
| W1 | `S/lib/campanhas/formatacao.ts:7` | `minimumFractionDigits: 2` → `0` | ✅ Morto (4 testes) |
| W2 | `formatacao.ts:18` | "Em análise" → "Em analise" | ✅ Morto |
| W3 | `S/services/campanhas.ts:37` | nome sempre `selo.svg` | ✅ Morto |
| W4 | `campanhas.ts:29` | `/campanhas` → `/campanhas/empresa` | ✅ Morto |
| W5 | `S/components/dashboard/CampaignCard.tsx:48` | `=== "APROVADA"` → `!== "RASCUNHO"` | ✅ Morto |
| W6 | `CampaignCard.tsx:120` | `href` = `/campanhas/{id}` em vez de `urlPublica` | ✅ Morto |
| W7 | `CampaignCard.tsx:191` | texto do estado vazio alterado | ✅ Morto (5 testes) |
| W8 | `S/components/empresa/PaginaEmpresaPublica.tsx:79` | rola sempre para a 1ª campanha | ✅ Morto (só pelo caso "slug inexistente") |
| W8b | `PaginaEmpresaPublica.tsx:79` | se o slug existe, rola para a 1ª campanha, não para a do slug | ❌ **Sobreviveu** |
| W9 | `PaginaEmpresaPublica.tsx:182` | "Campanha ainda não iniciada" sempre visível | ❌ **Sobreviveu** |
| W10 | `PaginaEmpresaPublica.tsx:122` | remove o `onError` (logo quebrado não vira iniciais) | ❌ **Sobreviveu** |
| W11 | `PaginaEmpresaPublica.tsx:153` | `href` do site → `#` | ❌ **Sobreviveu** |
| W12 | `PaginaEmpresaPublica.tsx:192` | beneficiada mostra `tipo` em vez de `nome` | ❌ **Sobreviveu** |
| W13 | `S/app/empresa/[slug]/[slugCampanha]/page.tsx:12` | não repassa `slugCampanha` | ❌ **Sobreviveu**. Na 1ª execução o mutante pareceu morto por um timeout em `FilaEmpresas`, fora do escopo. Reexecutado só com os testes da página: 10/10 passaram |
| W14 | `S/components/campanhas/DetalheCampanha.tsx:179` | `corrigivel` só em RASCUNHO | ✅ Morto |
| W15 | `DetalheCampanha.tsx:272` | "Campanha em análise pela Fivo Lab." → "Campanha em análise." | ✅ Morto |
| W16 | `S/components/admin/FilaCampanhas.tsx:77` | `<` → `<=` no tamanho mínimo do motivo | ✅ Morto |
| W17 | `FilaCampanhas.tsx:149` | ALTERACAO aprova por `aprovarCampanha` | ✅ Morto |
| W18 | `S/components/campaign-wizard/CampaignWizardNew.tsx:66` | não envia a capa | ✅ Morto |
| W19 | `S/services/empresasPublicas.ts:42` | `urlDoLogo` sem `/api` | ✅ Morto |
| W20 | `S/app/parceiros/page.tsx:219` | card → `/parceiros/{slug}` | ✅ Morto |
| W21 | `S/services/admin.ts:126` (`rejeitarAlteracao`) | `/alteracao/rejeicao` → `/rejeicao` | ✅ Morto |
| W22 | `S/lib/routes.ts:43` | remove `/empresa/` de `isPublicRoute` | ✅ Morto |
| W23 | `DetalheCampanha.tsx:127` | 404 → 410 (vira erro genérico) | ✅ Morto |
| W24 | `PaginaEmpresaPublica.tsx:114` | ignora `temLogo` | ✅ Morto |
| W25 | `DetalheCampanha.tsx:260` | motivo exibido em qualquer status | ❌ **Sobreviveu** |

**Sensor depth**: lightweight-plus, com 26 mutantes cobrindo serviços, formatação, botões por status, textos literais, estados vazio e 404, rolagem e rotas.
**Result**: 26 injetados, 19 mortos, **7 sobreviventes** (W8b, W9, W10, W11, W12, W13, W25), 0 equivalentes. ❌ FAIL.

W25 não é equivalente. `motivoUltimaRejeicao` guarda a *última* rejeição e continua preenchido depois do reenvio (EM_ANALISE), e o mutante mostraria "Motivo da rejeição" numa campanha em análise.

---

## Divergências de contrato com `design.md`

Nenhuma divergência que quebre. Conferi URL, método, corpo, campos e códigos de erro de cada função contra §Contratos HTTP e contra o OpenAPI dos endpoints existentes (`api/src/infra/http/campanhas/campanhas.controller.ts:118-173`, `admin-campanhas.controller.ts:60-116`):

- `GET /campanhas`, `GET /campanhas/{id}/selo` (`credentials: include`, nome por `Content-Disposition`), `GET /empresas/publicas`, `GET /empresas/publicas/{slug}`, `/logo` e `POST/GET/PATCH/PUT /campanhas…`, `/submissao`, `/admin/campanhas/fila` e as 4 rotas de decisão batem.
- `CampanhaDetalhe` (`S/services/campanhas.ts:115-137`) bate com `RESPOSTA_CAMPANHA`. `ItemFilaCampanha` (`S/services/admin.ts`) bate com o schema da fila.
- Notas menores, sem quebra:
  - (a) `EmpresaPublica.site` está tipado como `string` (`S/services/empresasPublicas.ts:29`), mas o cadastro aceita `site: null` e o design não diz se é anulável. O código já protege com `empresa.site &&` (`PaginaEmpresaPublica.tsx:152`). Ver SP2.
  - (b) O detalhe busca `urlPublica` em `GET /campanhas`, porque o contrato do detalhe não a traz (`DetalheCampanha.tsx:80-84`). É coerente com o design, ao custo de uma requisição a mais.
  - (c) O 404 do selo aparece como "Não encontramos o que você procurava." e não como "Campanha não encontrada", porque `mensagemDeErro` troca a mensagem do 404 (`S/services/api.ts:28`). É comportamento de UX de `api.ts`, não do contrato.

---

## Code Quality

| Princípio | Status | Nota |
| --------- | ------ | ---- |
| Minimum code / no scope creep | ✅ | A busca de `/parceiros` e o contador já existiam na tela e foram mantidos com dados reais |
| Surgical changes | ⚠️ | `S/app/parceiros/[id]/page.tsx` e `S/lib/mockPartners.ts` ficaram para trás (T60) |
| Matches patterns | ⚠️ | Duplicações pequenas: `salvarNoComputador` em `CampaignCard.tsx:35` e `DetalheCampanha.tsx:86`; `iniciais` em 3 telas; `formatarData`/`textoDaVigencia` em 3 arquivos, com formato da vigência diferente na página pública ("até") e no detalhe e na fila ("a"). Indentação torta em `PaginaEmpresaPublica.tsx:71`, `:81` e `:160`. Nada bloqueia |
| Spec-anchored outcome check | ⚠️ | Os textos literais batem quando existe asserção. A falta de asserção está nas lacunas acima |
| Per-layer coverage | ❌ | Serviços: 100%. Componentes: a página pública não cobre todos os elementos do AC6 nem os erros |
| Todo teste mapeia para AC / edge / Done-when | ✅ | Os testes extras (busca, contador, 401 → login, retry de submissão) mapeiam para comportamento existente ou para o AC5 do wizard |
| Guidelines documentadas | ✅ | Nenhuma no projeto; segui os strong defaults da Test Coverage Matrix de `tasks.md` |
| Senior engineer aprovaria? | ⚠️ | Sim, depois de T60–T63 |

---

## Spec-Precision Gaps

| # | AC | Problema | Estado |
| - | -- | -------- | ------ |
| SP1 | VIT-07 AC6, VIT-11 AC1, VIT-12 AC1 | "Período de vigência" sem formato definido. O `web` usa "dd/mm/aaaa até dd/mm/aaaa" na página pública e "a" no detalhe e na fila | Aberto, não bloqueia. Uniformizar é follow-up |
| SP2 | VIT-07 AC1/AC6 | A spec não diz se `site` pode faltar na resposta pública | Aberto. O `web` trata a ausência |
| SP3 | VIT-03 AC10, VIT-07 AC13, VIT-09 AC5 | "320 px sem rolagem horizontal" não é verificável em jsdom | Vai para o UAT de 10/11 |
| SP4 | VIT-03 AC8 | Não define se "Ver página pública" abre em nova aba (o `web` abre) | Aberto, cosmético |

---

## Fix Plans

### T60: Remover `/parceiros/[id]` e `mockPartners`

**What**: Apagar `web/src/app/parceiros/[id]/page.tsx` (detalhe fictício substituído por `/empresa/{slug}`) e `web/src/lib/mockPartners.ts`. Acrescentar o teste estrutural que a T40 pede: nenhum arquivo de `web/src` importa `mockPartners`.
**Where**: `web/src/app/parceiros/[id]/page.tsx`, `web/src/lib/mockPartners.ts`, `web/tests/unit/` (teste estrutural novo)
**Depends on**: None
**Requirement**: VIT-07, VIT-09 (Done-when da T34 e da T40)
**Priority**: Major
**Tests**: unit (estrutural)
**Gate**: web
**Done when**:
- [ ] `parceiros/[id]` e `mockPartners.ts` não existem; nenhum link aponta para `/parceiros/{id}`
- [ ] Teste estrutural varre `web/src/**/*.{ts,tsx}` e falha se algum arquivo importar `mockPartners`
- [ ] Gate `web` passa

### T61: Cobrir o card e o subtópico da página pública

**What**: Em `PaginaEmpresaPublica.test.tsx`, conferir: `img` do logo com `src` = `/api/empresas/publicas/{slug}/logo` quando `temLogo`; link do `site` com `href`; a descrição, "Beneficiada: Instituto X" e a vigência do subtópico; o evento `error` na imagem trocando para as iniciais; e a ausência de "Campanha ainda não iniciada" em `EM_ANDAMENTO`.
**Where**: `web/tests/component/PaginaEmpresaPublica.test.tsx`
**Depends on**: None
**Requirement**: VIT-07 AC6, AC8, AC10; edge case "logo que não carrega"
**Priority**: Major
**Tests**: component
**Gate**: web
**Done when**:
- [ ] W9, W10, W11 e W12 morrem: chip sempre visível, `onError` removido, `href` do site trocado e beneficiada por `tipo` fazem algum teste falhar
- [ ] Gate `web` passa

### T62: Rolagem até a campanha certa e rota do QR

**What**: Fixture com 2 campanhas e `slugCampanha` = a 2ª. Conferir que `scrollIntoView` foi chamado no elemento cujo `id` é o da 2ª (por exemplo, `scrollSpy.mock.contexts[0]` com `id` = slug). Acrescentar um teste de `app/empresa/[slug]/[slugCampanha]/page.tsx` que renderiza a página com `params` resolvidos e prova que o `slugCampanha` chega ao componente, pela rolagem.
**Where**: `web/tests/component/EmpresaCampanhaScroll.test.tsx`
**Depends on**: None
**Requirement**: VIT-07 AC7 (Done-when da T34: "no subtópico certo")
**Priority**: Major
**Tests**: component
**Gate**: web
**Done when**:
- [ ] W8b (rolar para a 1ª campanha) e W13 (página sem `slugCampanha`) morrem
- [ ] Gate `web` passa

### T63: "Motivo da rejeição" só em `REJEITADA`

**What**: Teste com `EM_ANALISE` e `motivoUltimaRejeicao` preenchido (reenvio depois de rejeição) conferindo que "Motivo da rejeição" não aparece.
**Where**: `web/tests/component/DetalheCampanha.test.tsx`
**Depends on**: None
**Requirement**: VIT-11 AC2
**Priority**: Minor
**Tests**: component
**Gate**: web
**Done when**:
- [ ] W25 morre
- [ ] Gate `web` passa

### T64: Estabilizar o primeiro teste do wizard sob carga

**What**: `CampaignWizardNew.test.tsx:113` estoura os 5 s em 2 de 3 execuções completas do gate e passa em 832 ms isolado. Dar timeout explícito ao arquivo (por exemplo, `{ timeout: 15000 }` nos testes que percorrem os 3 passos, como `ui-states.test.tsx` já faz) ou aquecer os passos num `beforeAll`.
**Where**: `web/tests/component/CampaignWizardNew.test.tsx`
**Depends on**: None
**Requirement**: Gate `web` (T41)
**Priority**: Minor
**Tests**: component
**Gate**: web
**Done when**:
- [ ] Três execuções seguidas de `npm test` sem falha neste arquivo
- [ ] Gate `web` passa

### T65 (orquestrador): Gerar os tipos do Next antes do `tsc` no gate `web`

**What**: Trocar o gate `Web` em `tasks.md` (e nas próximas features) por `cd web && npx next typegen && npx tsc --noEmit && npm run lint && npm test`. Sem isso, o `tsc` falha num checkout limpo (`LayoutProps`, `S/app/layout.tsx:18`) e em toda máquina com `.next` anterior à T38 (validator com `selos`/`comprovantes`).
**Where**: `api/.specs/features/vitrine-e-selo/tasks.md` §Gate Check Commands
**Depends on**: None
**Priority**: Major (o gate não é reproduzível como está escrito)
**Done when**:
- [ ] O gate `Web` atualizado roda com exit 0 num worktree limpo

---

## Follow-ups não bloqueantes

1. **Wizard: edição depois da criação**. Se a capa ou a submissão falharem depois do `POST`, a nova tentativa reaproveita o `campanhaId` (`CampaignWizardNew.tsx:58-69`), mas não envia o que a empresa corrigiu nos campos entretanto (não há `PATCH`). Vale um `editarCampanha` com `alteracoes(...)` quando o `id` já existe, ou travar os campos depois da criação.
2. **Home**: o subtítulo "Veja campanhas em andamento e o que já foi doado." (`S/components/home/PartnerCompanies.tsx`, mantido de propósito em `T/component/PartnerCompanies.test.tsx:110`) promete o "valor doado", que saiu da v1 pelo AD-023. Revisar o texto.
3. **Download do selo**: `URL.revokeObjectURL` logo depois do `click()` (`CampaignCard.tsx:41`, `DetalheCampanha.tsx:92`) pode cancelar o download em alguns navegadores. Conferir no UAT (Chrome/Android e Safari/iOS).
4. **`site` da empresa**: validar o esquema `http(s)` no `api` ou no `web` antes de usar como `href` (`PaginaEmpresaPublica.tsx:153`). O React 19 bloqueia `javascript:`, mas outros esquemas passam.
5. **Beneficiada fora do catálogo no detalhe**: se a instituição for suspensa, `listarBeneficiadas` não a devolve e o detalhe mostra "—" (`DetalheCampanha.tsx:67-71`). Fica aceitável na v1.
6. **Duplicações** (`salvarNoComputador`, `iniciais`, `formatarData`) e formato da vigência uniforme (SP1): pode virar `lib/campanhas/formatacao.ts`.
7. **Testes flaky fora do escopo**: `FilaEmpresas.property-campos-essenciais` (já falhava na base) e `ui-states 6.4` estouram o timeout sob carga. Mesmo tratamento da T64, fora desta feature.

---

## UAT pendente (ponta a ponta de 10/11)

1. Área da empresa, `/campanhas/[id]`, `/empresa/{slug}` e `/parceiros` em 320 px, sem rolagem horizontal (VIT-03 AC10, VIT-07 AC13, VIT-09 AC5).
2. "Baixar selo" salva `selo-{slugCampanha}.svg` de verdade no Chrome desktop, Chrome Android e Safari iOS (VIT-05 AC9; follow-up 3).
3. QR do selo lido no celular abre `/empresa/{slug}/{slugCampanha}` sem login e rola até a campanha certa, inclusive com várias campanhas e com o cabeçalho fixo cobrindo o título (`scrollMarginTop: 16`).
4. Logo real carregado e logo quebrado viram iniciais na página pública.
5. Fluxo criar → enviar → aprovar no admin → selo disponível no card → "Ver página pública" abre a URL absoluta de `WEB_URL`.
6. Rejeitar com motivo → detalhe mostra "Motivo da rejeição" → corrigir → reenviar → volta à fila.

---

## Requirement Traceability Update

`spec.md` não foi editado. Status proposto para o orquestrador aplicar:

| Requirement | Status proposto (`web`) |
| ----------- | ----------------------- |
| VIT-03 | ✅ Verificado (AC10 no UAT) |
| VIT-05 | ✅ Botão verificado (download real no UAT) |
| VIT-07 | ❌ Needs Fix (T60, T61, T62) |
| VIT-09 | ❌ Needs Fix (T60); comportamento ✅ |
| VIT-10 | ✅ Verificado (T64 para estabilidade do gate) |
| VIT-11 | ⚠️ Verificado com T63 pendente |
| VIT-12 | ✅ Verificado |

---

## Summary

**Overall**: ❌ Not Ready. Faltam T60–T63 no código, T64 no teste e T65 no gate.

**Spec-anchored check**: 41 critérios: 32 ✅, 3 ❌, 3 ⚠️ parciais e 3 ⚠️ para UAT. 4 spec-precision gaps (SP1–SP4).
**Sensor**: 26 injetados, 19 mortos, 7 sobreviventes (W8b, W9, W10, W11, W12, W13, W25) e 0 equivalentes.
**Gate**: `tsc` ❌ como está escrito (cache `.next` / tipos não gerados) e ✅ com `next typegen`; lint ✅ (0 erros); testes 316–317/321 com 2 skip. As falhas são todas por timeout sob carga: uma no escopo (`CampaignWizardNew.test.tsx:113`, 2 de 3 execuções) e o resto fora dele. Contagem 199 → 321. Os únicos testes removidos são os dois condicionais da T38, com justificativa.

**O que funciona**: os serviços batem 1:1 com o contrato; a formatação de valor e de status é literal; os cards mostram os botões por status e baixam o selo pelo nome do `Content-Disposition`; o detalhe tem os 4 blocos de status, o `PATCH` só com o que mudou e o 404; o wizard único cria, envia a capa e submete sem recriar; a fila do admin roteia por tipo, exige no mínimo 20 caracteres no motivo e recarrega no 409; os menus estão limpos; `/parceiros` e a home usam dados reais.

**Próximos passos**: (1) o grupo executa T60–T64; (2) o orquestrador aplica T65 em `tasks.md`; (3) rodada 2 desta verificação; (4) UAT de 10/11 com a lista acima.
