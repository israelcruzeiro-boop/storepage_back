# Auditoria Tecnica - StorePage_back

## Objetivo
Este documento consolida a auditoria tecnica do contexto atual do projeto `StorePage_back`, considerando:
- o frontend de referencia `StorePage`
- o inventario de consultas em `C:\Users\israe\Downloads\db_queries_inventory.md`
- os guias internos `GEMINI.md` e `REGRAS_AGENTE.md` do backend

O foco desta auditoria e validar se o plano de desacoplamento esta coerente e quais contratos, modulos e riscos precisam ser absorvidos pelo backend.

---

## Status Executivo

| Item | Status | Observacao |
| :--- | :--- | :--- |
| Direcao arquitetural | Aprovada | O plano `Frontend -> StorePage_back -> Banco/Storage` esta correto. |
| Escopo funcional | Aprovado com ajustes | Todos os dominios principais foram identificados, mas o contrato de API precisava ser ampliado. |
| Mapeamento de dominio | Bom | Auth, tenants, users, repositories, LMS, checklists, surveys, metrics e settings ja estao claros. |
| Risco de acoplamento atual | Alto | O frontend ainda concentra regra de negocio, auth, queries, uploads e mutations diretas. |
| Prontidao para implementacao incremental | Alta | A fundacao do backend esta suficiente para iniciar a extracao por fases. |

---

## Escopo Auditado

### Fontes analisadas
- `C:\Users\israe\Downloads\db_queries_inventory.md`
- `C:\Users\israe\Downloads\StorePage\src\contexts\AuthContext.tsx`
- `C:\Users\israe\Downloads\StorePage\src\hooks\useSupabaseData.ts`
- `C:\Users\israe\Downloads\StorePage\src\hooks\useChecklists.ts`
- `C:\Users\israe\Downloads\StorePage\src\services\courseService.ts`
- `C:\Users\israe\Downloads\StorePage\src\services\surveys.service.ts`
- `C:\Users\israe\Downloads\StorePage\REVISAO_SEGURANCA.md`
- `C:\Users\israe\Downloads\StorePage\DIVIDA_TECNICA.md`

### Dominios confirmados
- autenticacao e sessao
- tenants e companies
- usuarios e convites provisionados
- estrutura organizacional
- repositorios, conteudos, links e categorias
- metricas e engajamento
- LMS, quizzes, matriculas e progresso
- checklists, respostas, anexos e action plans
- surveys e respostas
- settings e white label
- storage e uploads
- administracao global de empresas

---

## Achados Principais

### 1. Regra de negocio excessiva no frontend
O frontend atual nao atua apenas como camada de apresentacao. Ele tambem:
- autentica usuarios
- processa provisionamento
- grava progresso
- faz mutations administrativas
- chama RPCs diretamente
- envia arquivos ao storage

Impacto:
- alto acoplamento
- contratos instaveis
- dificuldade de auditoria
- risco de bypass de seguranca pelo client

Conclusao:
- o backend precisa absorver nao apenas leitura, mas tambem coordenacao de fluxo e autorizacao.

### 2. Dependencia excessiva de Supabase Client no browser
O modelo atual usa `supabase.from()`, `supabase.auth` e `supabase.rpc()` diretamente no frontend.

Impacto:
- a seguranca depende demais de RLS e RPCs internas
- o frontend conhece demais o schema
- mudancas de banco impactam diretamente o client

Conclusao:
- o backend deve isolar o frontend do banco e expor contratos HTTP estaveis.

### 3. Multi-tenant existe, mas precisa sair do client
O frontend ja faz validacoes boas de tenant e role, especialmente nas rotas. Ainda assim, essa protecao nao pode ser considerada suficiente.

Impacto:
- o client ajuda na UX, mas nao deve ser a ultima camada de controle

Conclusao:
- o backend deve validar tenant, role e ownership em todas as operacoes sensiveis.

### 4. Checklists e LMS sao os modulos mais sensiveis de migracao
Esses modulos concentram:
- varias tabelas relacionadas
- salvamento parcial
- upserts
- progresso de execucao
- calculos de score e tempo
- anexos e acao corretiva

Conclusao:
- precisam de contrato mais detalhado do que um CRUD simples.

### 5. Surveys e metrics nao podem ficar de fora do contrato
O inventario confirma consultas, dashboards e submissao de respostas por RPC.

Conclusao:
- `API_ROUTING.md` precisa cobrir esses dominios integralmente para evitar lacunas de implementacao.

### 6. Soft delete e selects explicitos sao obrigatorios no backend
Os documentos auditados ja apontam isso como divida tecnica e requisito de seguranca.

Conclusao:
- toda leitura deve considerar `deleted_at IS NULL` quando aplicavel
- toda query deve evitar `select *` sempre que possivel

---

## Riscos Tecnicos Prioritarios

| Prioridade | Risco | Impacto | Tratamento recomendado |
| :--- | :--- | :--- | :--- |
| Critica | Regra critica no client | Exposicao de logica e fragilidade de seguranca | Migrar auth, users e companies primeiro |
| Critica | Contract drift entre frontend e backend | Retrabalho e integracao instavel | Formalizar contrato em `API_ROUTING.md` |
| Alta | Checklists e LMS incompletos na API | Front futuro nao consegue operar fluxos reais | Cobrir autosave, progresso, anexos e dashboards |
| Alta | Ambiguidade na resolucao de tenant | Risco de vazamento entre empresas | Definir resolucao por token, slug e contexto de rota |
| Media | Dependencia de RPC legada | Dificulta manutencao e portabilidade | Traduzir RPCs para servicos internos da API |
| Media | Storage acoplado ao browser | Uploads e URLs fora do controle do backend | Centralizar assinatura e validacao de uploads |

---

## Avaliacao dos Documentos do Backend

### GEMINI.md
Status: adequado

Pontos positivos:
- define o backend como fonte central de regra de negocio
- cobre os dominios principais
- reforca API first, multi-tenant e soft delete
- organiza a estrutura alvo do projeto

### REGRAS_AGENTE.md
Status: adequado

Pontos positivos:
- separa rota, servico e repositorio
- reforca validacao com Zod
- reforca isolamento de tenant e proibicao de acesso direto do frontend ao banco

### API_ROUTING.md
Status: adequado apos revisao

Ajustes necessarios identificados antes da revisao:
- ausencia de surveys
- cobertura parcial de checklists
- ambiguidade em settings por tenant
- falta de modulo super-admin

### AUDITORIA.MD
Status anterior: inadequado
Status atual: adequado

Motivo:
- o arquivo anterior era apenas um prompt de extracao
- agora passa a funcionar como documento final de auditoria

---

## Contrato de API - Validacao de Aderencia

O contrato de rotas do backend deve obedecer aos principios abaixo:
- o frontend nao acessa banco, storage ou RPC diretamente
- todo endpoint autenticado resolve o tenant a partir da sessao e do contexto permitido
- rotas publicas por tenant usam slug explicito
- operacoes administrativas ficam em namespace `admin`
- operacoes globais ficam em namespace `super-admin`
- respostas usam envelope padrao
- uploads e URLs assinadas passam pelo backend

Conclusao:
- esse padrao esta alinhado com o plano e com a estrutura alvo do projeto

---

## Ordem Recomendada de Implementacao

### Fase 1
- auth
- tenant branding
- me/profile
- companies basicas
- users e invites

### Fase 2
- repositories
- contents
- categories
- simple links
- metrics

### Fase 3
- courses
- modules
- contents
- questions
- enrollments
- answers
- quiz attempts

### Fase 4
- checklists
- sections
- questions
- submissions
- answers
- attachments
- action plans

### Fase 5
- surveys
- survey questions
- responses
- dashboards

### Fase 6
- settings
- feature flags
- storage policies
- super-admin

---

## Recomendacoes Finais

1. Considerar `API_ROUTING.md` como contrato vivo do backend.
2. Tratar o inventario de banco como referencia de extracao, nao como contrato definitivo de API.
3. Modelar auth, tenant e permissao antes de qualquer modulo de negocio pesado.
4. Implementar contratos pensando no frontend futuro desacoplado, nao no frontend atual acessando Supabase.
5. Manter a documentacao sincronizada sempre que um dominio entrar em implementacao real.

---

## Parecer Final
O plano do `StorePage_back` esta correto e suficientemente maduro para iniciar implementacao incremental.

O principal trabalho agora nao e redefinir arquitetura, e sim transformar o conhecimento ja extraido em:
- contratos de API consistentes
- servicos backend por dominio
- protecoes reais de tenant, role e ownership
- migracao gradual dos fluxos hoje acoplados ao frontend

Parecer final: **aprovado para execucao**, com foco em implementacao faseada e contrato de API como guia central.
