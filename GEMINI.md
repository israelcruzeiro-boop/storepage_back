# GEMINI.md - StorePage_back Project Intelligence

> Este arquivo e a fonte da verdade do projeto **StorePage_back**. Ele descreve a arquitetura, os dominios da API, as regras de seguranca e as convencoes de implementacao do backend que vai desacoplar o frontend StorePage do acesso direto ao Supabase.

---

## VISAO GERAL DO PROJETO
**StorePage_back** e a nova aplicacao backend da plataforma StorePage.

### Objetivos Principais
- Centralizar toda a logica de negocio hoje espalhada no frontend.
- Expor endpoints de API para autenticacao, dados e operacoes de dominio.
- Garantir isolamento multi-tenant no backend, sem depender apenas de RLS.
- Servir como camada de orquestracao entre frontend, banco de dados e storage.
- Preparar a plataforma para evolucao futura sem acoplamento direto do client ao Supabase.

### Escopo Atual
- Projeto em fase de fundacao.
- O frontend `StorePage` continua existindo como cliente da API futura.
- O codigo e a estrutura do `StorePage` podem ser consultados como referencia, mas nao devem ser alterados neste projeto.

---

## STACK ATUAL

### Backend
- Node.js
- TypeScript
- Fastify
- Zod

### Infra e Dados
- Banco atual de referencia: Supabase/PostgreSQL
- Storage atual de referencia: Supabase Storage
- Inventario-base das consultas: `C:\Users\israe\Downloads\db_queries_inventory.md`
- Projeto de referencia funcional: `C:\Users\israe\Downloads\StorePage`

### Principio Arquitetural
- `Frontend -> StorePage_back -> Banco/Storage`
- O frontend nao deve acessar tabelas, RPCs ou buckets diretamente.

---

## DOMINIOS DO BACKEND

### 1. Auth e Sessao
- login
- provisionamento de usuarios convidados
- resolucao de perfil autenticado
- autorizacao por role

### 2. Tenants e Empresas
- companies
- resolucao por `slug` e `link_name`
- configuracoes publicas e privadas por tenant

### 3. Usuarios e Estrutura Organizacional
- users
- org_top_levels
- org_units
- convites provisionados

### 4. Repositorios e Conteudos
- repositories
- contents
- simple_links
- categories
- metricas de visualizacao e avaliacao

### 5. LMS
- courses
- course_modules
- course_contents
- course_phase_questions
- course_enrollments
- course_answers
- quizzes e tentativas

### 6. Checklists e Auditoria
- checklists
- checklist_folders
- checklist_sections
- checklist_questions
- checklist_submissions
- checklist_answers
- action plans

### 7. Surveys
- surveys
- survey_questions
- survey_responses
- survey_answers

### 8. Storage e Uploads
- upload de imagens e arquivos
- obtencao de URLs publicas/assinadas
- padronizacao de buckets e paths por tenant

---

## ESTRUTURA DE ARQUIVOS DESEJADA

Esta estrutura e a referencia para crescimento do backend:

| Diretorio | Responsabilidade |
| :--- | :--- |
| `src/app.ts` | bootstrap da aplicacao Fastify |
| `src/server.ts` | inicializacao HTTP |
| `src/routes/` | registro de rotas e agrupadores por dominio |
| `src/modules/` | dominios de negocio da aplicacao |
| `src/services/` | servicos de negocio/orquestracao |
| `src/repositories/` | acesso a dados e queries |
| `src/schemas/` | validacao de payloads com Zod |
| `src/types/` | contratos e tipos compartilhados |
| `src/plugins/` | plugins do Fastify e infraestrutura transversal |
| `src/lib/` | helpers tecnicos, clientes e utilitarios |
| `src/config/` | leitura e validacao de environment/config |
| `docs/` | documentacao tecnica do backend |
| `sql/` | SQL de apoio, consultas, migracoes propostas ou auditorias |

Observacao:
- Nao e obrigatorio criar todos esses diretorios imediatamente.
- A estrutura deve crescer de forma gradual, conforme o inventario for sendo implementado.

---

## REGRAS CRITICAS DE ARQUITETURA

### 1. API First
- Toda regra de negocio deve entrar no backend antes de chegar ao banco.
- O backend e a unica camada autorizada a falar com o banco e com o storage.

### 2. Multi-tenant
- Toda operacao precisa considerar o `company_id` efetivo do usuario.
- Nao confiar apenas em filtros enviados pelo client.
- O backend deve validar tenant, role e ownership em toda operacao sensivel.

### 3. Soft Delete
- Nunca remover registros fisicamente em entidades de negocio sem decisao explicita.
- Priorizar `deleted_at` e filtros consistentes em leitura.

### 4. Validacao
- Todo input externo deve ser validado com Zod antes de qualquer persistencia.
- Todo output critico pode ser normalizado quando ajudar a manter contrato estavel.

### 5. RPCs Legadas
- RPCs atuais do Supabase devem ser traduzidas para endpoints/servicos do backend.
- Nenhuma regra critica deve permanecer acessivel diretamente pelo browser.

### 6. Seguranca
- Nunca expor credenciais privilegiadas ao frontend.
- Evitar `select *` em queries de producao.
- Preferir selects explicitos e contratos de resposta pequenos.
- Sanitizar entrada, arquivos e parametros de busca.

---

## MAPEAMENTO INICIAL DE MIGRACAO

As operacoes abaixo ja foram identificadas no inventario e devem virar API:

1. `get_provisioned_user`
2. `provision_invite`
3. `increment_user_stats`
4. `submit_survey_response`
5. CRUDs administrativos hoje feitos direto no frontend
6. Uploads e recuperacao de URLs de storage
7. Leitura autenticada e publica por tenant

Prioridade sugerida de extracao:
1. auth, companies e users
2. repositories e contents
3. courses e enrollments
4. checklists
5. surveys
6. storage/upload

---

## PADROES DE CODIGO

- TypeScript estrito.
- Evitar `any`.
- Preferir funcoes pequenas e modulares.
- Separar claramente rota, validacao, servico e repositorio.
- Logs devem ser estruturados.
- Erros devem ser tratados com respostas HTTP coerentes.

---

## RELACAO COM O FRONTEND STOREPAGE

- O frontend `StorePage` e um projeto separado.
- Ele pode ser consultado como referencia de comportamento, fluxos e contratos esperados.
- Nenhuma alteracao deve ser feita la a partir deste projeto, salvo pedido explicito do usuario em outro fluxo.
- Ao desenhar endpoints, pensar no frontend futuro desacoplado, nao no client atual acessando Supabase.

---

## NOTAS OPERACIONAIS

- Antes de alterar schema ou comportamento do banco, documentar a proposta SQL.
- O inventario de consultas e a base inicial, mas nao substitui a leitura do codigo do frontend quando houver duvida de regra de negocio.
- Quando houver conflito entre praticidade e seguranca, priorizar seguranca e clareza contratual.
