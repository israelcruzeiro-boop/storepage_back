# Backlog Tecnico por Fases - StorePage_back

## Objetivo
Este documento transforma o contrato de API e a auditoria do projeto em um backlog tecnico executavel por fases.

Ele serve para orientar a implementacao incremental do `StorePage_back` com foco em:
- backend desacoplado
- seguranca por padrao
- performance mensuravel
- compatibilidade com o frontend futuro

Documentos-base:
- `GEMINI.md`
- `REGRAS_AGENTE.md`
- `AUDITORIA.MD`
- `API_ROUTING.md`
- `C:\Users\israe\Downloads\db_queries_inventory.md`

---

## Principios do Backlog

1. Cada fase deve entregar valor real e utilizavel.
2. Nenhum modulo entra em producao sem validacao, autorizacao e contrato definido.
3. O frontend nao deve depender de acesso direto ao Supabase.
4. Toda fase deve considerar backend, seguranca, performance e impacto de integracao no frontend.
5. A ordem prioriza reducao de risco arquitetural antes de expansao funcional.

---

## Definicao Global de Pronto

Uma entrega so pode ser considerada pronta quando atender, no minimo:

### Backend
- rota definida e documentada
- schema Zod de entrada e saida quando aplicavel
- camada separada em rota, servico e repositorio
- tratamento de erro consistente
- logs sem dados sensiveis

### Seguranca
- autenticacao aplicada quando exigida
- autorizacao por role e tenant quando exigida
- validacao de ownership quando houver recurso do usuario
- sem dependencia de filtro confiado no client

### Performance
- sem `select *` desnecessario
- sem padrao N+1 evidente
- paginação ou limites quando houver listas potencialmente grandes
- ponto de cache identificado quando fizer sentido

### Integracao com frontend
- contrato estavel e legivel
- payloads coerentes com os fluxos existentes do `StorePage`
- impacto de migracao conhecido

### Qualidade
- lint e typecheck verdes
- testes minimos do caminho critico
- documentacao atualizada

---

## Fase 0 - Fundacao da Aplicacao

### Objetivo
Preparar a base tecnica do backend para receber os modulos sem retrabalho estrutural.

### Escopo
- bootstrap HTTP
- configuracao de ambiente
- padrao de resposta
- base de erros
- logging estruturado
- autenticacao middleware base
- autorizacao base por role e tenant
- organizacao de pastas

### Entregas tecnicas
- `src/config/` para ambiente e validacao
- `src/lib/` para helpers transversais
- `src/plugins/` para autenticacao, erro e observabilidade
- `src/schemas/` para contratos compartilhados
- `src/modules/` com estrutura inicial
- middleware global de erro
- padrao de envelope de resposta

### Seguranca
- leitura de segredos apenas por env
- fail secure em middleware
- CORS e headers definidos
- politica de logs sem token, senha ou segredo

### Performance
- definir estrategia inicial de conexao com banco
- definir politica de timeout
- preparar pontos de cache para tenant branding e leitura publica

### Impacto no frontend
- nenhum endpoint funcional ainda
- prepara o terreno para migracao de services HTTP

### Dependencias
- nenhuma

### Pronto quando
- projeto suportar novos modulos sem improviso estrutural
- auth middleware base e envelope de resposta estiverem operacionais

---

## Fase 1 - Auth, Tenant, Perfil e Usuarios

### Objetivo
Remover do frontend as responsabilidades mais criticas de autenticacao, contexto de tenant e gestao de usuarios.

### Modulos
- auth e sessao
- companies basicas
- tenant branding
- profile/me
- users
- invites provisionados
- estrutura organizacional

### Endpoints alvo
- `/api/auth/login`
- `/api/auth/refresh`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/tenant/:slug`
- `/api/auth/invites/:token`
- `/api/auth/invites/activate`
- `/api/auth/profile`
- `/api/auth/password`
- `/api/companies/current`
- `/api/companies/public/:slug`
- `/api/admin/users*`
- `/api/admin/structure*`

### Entregas tecnicas
- contrato de sessao do usuario
- resolucao de tenant por slug e sessao
- servico de perfil autenticado consolidando `user + company`
- servico de convite/provisionamento substituindo RPC legada
- CRUD admin de usuarios
- CRUD admin de niveis e unidades

### Seguranca
- validacao rigorosa de credenciais e tenant no login
- autorizacao admin obrigatoria em users e structure
- protecao contra leitura cruzada entre tenants
- politicas claras para ativacao de convite
- hashing e troca segura de senha

### Performance
- cache curto para branding publico por slug
- selects explicitos em profile, company e users
- evitar consultas duplicadas de user + company em cadeia

### Impacto no frontend
- o `AuthContext` do frontend passa a depender da API em vez de `supabase.auth`
- o login deixa de conhecer RPC e schema do banco
- o painel de usuarios e estrutura ganha contrato estavel

### Dependencias
- Fase 0 concluida

### Riscos
- auth mal modelada contamina todas as fases seguintes
- tenant incorreto gera risco critico de isolamento

### Pronto quando
- frontend conseguir autenticar, carregar `me` e operar usuarios/estrutura sem acesso direto ao Supabase

---

## Fase 2 - Repositorios, Conteudos, Links, Categorias e Metrics

### Objetivo
Desacoplar o modulo de conteudo corporativo e as metricas de engajamento.

### Modulos
- repositories
- contents
- simple links
- categories
- metrics de views e ratings
- landing publica por tenant

### Endpoints alvo
- `/api/repositories`
- `/api/repositories/:id`
- `/api/repositories/:id/catalog`
- `/api/contents/:id`
- `/api/repositories/:id/categories`
- `/api/repositories/:id/simple-links`
- `/api/landing/:slug`
- `/api/landing/:slug/repositories`
- `/api/landing/repositories/:id/contents`
- `/api/landing/repositories/:id/simple-links`
- `/api/metrics/views`
- `/api/metrics/ratings`
- `/api/admin/repositories*`
- `/api/admin/categories*`
- `/api/admin/contents*`
- `/api/admin/simple-links*`
- `/api/admin/metrics*`

### Entregas tecnicas
- leitura autenticada e publica separadas
- agregacao de catalogo por repositorio
- CRUD administrativo de repositorios e itens
- servico de registro de visualizacao
- servico de avaliacao com update ou insert

### Seguranca
- validar visibilidade publica x autenticada
- proteger conteudos restritos por access type
- validar permissao admin em CRUDs
- evitar exposicao de metadados internos desnecessarios na landing

### Performance
- catalogo agregado para evitar excesso de requests do frontend
- indices e filtros por `company_id`, `repository_id`, `deleted_at`, `status`
- considerar cache para landing publica e repositorios publicos

### Impacto no frontend
- hooks de repositorio e conteudo deixam de usar `supabase.from()`
- landing pages passam a ler API publica por slug
- metrics deixam de gravar direto no banco pelo browser

### Dependencias
- Fase 1 concluida para auth e tenant

### Pronto quando
- frontend conseguir listar repositorios, conteudos e landing publica usando apenas endpoints do backend

---

## Fase 3 - LMS, Cursos, Matriculas, Progresso e Quizzes

### Objetivo
Migrar o modulo de treinamento, que hoje concentra muita regra de negocio no frontend.

### Modulos
- courses
- course_modules
- course_contents
- course_phase_questions
- enrollments
- course_answers
- quizzes
- quiz_attempts
- reward/xp

### Endpoints alvo
- `/api/courses`
- `/api/courses/:id`
- `/api/courses/:id/modules`
- `/api/courses/modules/:id/contents`
- `/api/courses/modules/:id/questions`
- `/api/courses/:id/enrollment`
- `/api/courses/:id/enroll`
- `/api/courses/enrollments/:id/progress`
- `/api/courses/enrollments/:id/answers`
- `/api/courses/enrollments/:id/complete`
- `/api/courses/:id/quiz`
- `/api/quizzes/:id/questions`
- `/api/quizzes/:id/attempts`
- `/api/admin/courses*`
- `/api/admin/modules*`
- `/api/admin/course-contents*`
- `/api/admin/course-questions*`
- `/api/admin/courses/:id/reset-enrollment`
- `/api/admin/courses/:id/dashboard`
- `/api/admin/courses/:id/analytics`

### Entregas tecnicas
- leitura consolidada de curso com progresso do usuario
- inicio e conclusao de matricula
- autosave de progresso
- registro de respostas do aluno
- tentativa de quiz
- dashboards administrativos de curso
- traducao da RPC de recompensa para servico interno

### Seguranca
- validar ownership da matricula
- impedir conclusao ou alteracao de progresso em matricula alheia
- proteger dashboards e reset de matricula para admin
- garantir que recompensa nao possa ser abusada pelo client

### Performance
- evitar N+1 em modulos, conteudos e perguntas
- endpoints agregados para navegação do player
- analytics com limites, filtros e possivel preagregacao futura

### Impacto no frontend
- `courseService` do frontend passa a falar com HTTP
- o player deixa de depender de schema e upsert direto
- dashboards admin ganham consultas dedicadas

### Dependencias
- Fase 1 concluida
- Fase 2 ajuda com patterns de leitura e metrics, mas nao bloqueia integralmente

### Pronto quando
- curso puder ser consumido de ponta a ponta sem nenhuma mutation direta ao Supabase no frontend

---

## Fase 4 - Checklists, Submissoes, Anexos e Action Plans

### Objetivo
Migrar o modulo operacional mais sensivel, incluindo autosave, anexos e nao conformidades.

### Modulos
- checklists
- checklist_folders
- checklist_sections
- checklist_questions
- checklist_submissions
- checklist_answers
- attachments
- action plans

### Endpoints alvo
- `/api/checklists`
- `/api/checklists/:id`
- `/api/checklists/submissions`
- `/api/checklists/submissions/:id`
- `/api/checklists/submissions/:id/answers`
- `/api/checklists/submissions/:id/answers/:questionId`
- `/api/checklists/submissions/:id/complete`
- `/api/checklists/attachments/sign`
- `/api/action-plans`
- `/api/action-plans/:id`
- `/api/admin/checklists*`
- `/api/admin/checklist-folders*`
- `/api/admin/checklist-sections*`
- `/api/admin/checklist-questions*`
- `/api/admin/checklist-sections/reorder`
- `/api/admin/checklist-questions/reorder`
- `/api/admin/checklists/dashboard`
- `/api/admin/checklists/submissions*`

### Entregas tecnicas
- estrutura completa do checklist para execucao
- inicio de submissao
- autosave de resposta individual
- conclusao de checklist
- assinatura de upload de anexos
- dashboard admin
- CRUD completo de modelos, folders, secoes e perguntas
- fluxo inicial de action plans

### Seguranca
- validar tenant, usuario e unidade permitida na submissao
- validar bucket/path de upload
- proteger leitura de respostas e fotos
- garantir que apenas admins ou donos autorizados acessem dashboards e detalhes completos

### Performance
- payloads estruturados para reduzir fan-out no frontend
- uploads assinados com expiração curta
- consultas de dashboard preparadas para filtros por periodo, unidade e status

### Impacto no frontend
- `useChecklists.ts` sai da dependencia direta de banco e storage
- player de checklist passa a usar backend para autosave e anexos
- dashboard admin ganha contratos claros

### Dependencias
- Fase 1 concluida
- Fase 0 para upload/signing e middleware

### Pronto quando
- checklist puder ser executado, salvo parcialmente, anexado e finalizado sem acesso direto ao Supabase

---

## Fase 5 - Surveys

### Objetivo
Migrar integralmente o modulo de pesquisas e dashboards associados.

### Modulos
- surveys
- survey_questions
- survey_responses
- survey_answers

### Endpoints alvo
- `/api/surveys`
- `/api/surveys/:id`
- `/api/surveys/:id/questions`
- `/api/surveys/:id/responses`
- `/api/users/me/surveys/responses`
- `/api/admin/surveys*`
- `/api/admin/survey-questions*`
- `/api/admin/surveys/:id/questions/reorder`
- `/api/admin/surveys/:id/responses`
- `/api/admin/surveys/:id/dashboard`

### Entregas tecnicas
- listagem e leitura de survey pelo usuario
- submissao de respostas substituindo RPC atual
- CRUD admin de surveys e perguntas
- reorder de perguntas
- dashboard de respostas

### Seguranca
- impedir envio duplicado indevido quando a regra exigir unicidade
- validar que usuario so responde surveys permitidas ao seu tenant
- proteger respostas consolidadas para admin

### Performance
- leitura leve para player de survey
- agregacoes do dashboard desenhadas para nao sobrecarregar consultas
- considerar resposta assíncrona ou preagregacao futura para analytics mais pesados

### Impacto no frontend
- `surveys.service.ts` deixa de falar direto com banco e RPC
- player e dashboard passam a depender do backend

### Dependencias
- Fase 1 concluida

### Pronto quando
- surveys estiverem 100% fora de RPC e queries diretas do frontend

---

## Fase 6 - Settings Avancados, Storage Generico, Super Admin e Hardening Final

### Objetivo
Fechar o backend desacoplado com capacidades administrativas globais e endurecimento final da plataforma.

### Modulos
- settings avancados
- storage generico
- super-admin
- observabilidade
- hardening final

### Endpoints alvo
- `/api/uploads/sign`
- `/api/uploads/public-url`
- `/api/uploads`
- `/api/super-admin/companies`
- `/api/super-admin/companies/:id`
- `/api/super-admin/companies/:id/provision-admin`
- `/api/super-admin/overview`
- ajustes finais em `/api/admin/settings*`

### Entregas tecnicas
- camada generica de upload com validacao de tenant e path
- operacoes globais de companies
- provisionamento de admin inicial do tenant
- visao consolidada global
- refinamento de logs, observabilidade e operacao

### Seguranca
- least privilege nas operacoes globais
- auditoria de rotas de super-admin
- revisão de segredos, envs e politicas de erro
- checklist final contra os riscos da auditoria

### Performance
- revisão de endpoints mais acessados
- estratégia de cache onde couber
- identificar hotspots para tuning de query
- preparar medição de uso real

### Impacto no frontend
- fecha os casos residuais de settings e visoes globais
- permite evolucao desacoplada entre front e back

### Dependencias
- Fases anteriores estabilizadas

### Pronto quando
- o frontend nao depender mais de acesso direto ao Supabase para nenhum fluxo principal
- o backend estiver operacionalmente pronto para crescer por dominio

---

## Trilhas Transversais

Estas trilhas rodam ao longo de todas as fases.

### Trilha A - Seguranca
- threat modeling dos endpoints de cada fase
- revisão de broken access control
- revisão de tenant isolation
- proteção contra mass assignment
- política de logs sem PII sensivel

### Trilha B - Performance
- revisar queries e cargas por endpoint
- definir cache por dominio
- evitar payload excessivo
- preparar paginação em listas administrativas

### Trilha C - Integracao Frontend
- mapear quais hooks/services do `StorePage` serão trocados em cada fase
- definir adaptadores temporários no frontend futuro
- evitar drift entre payload real e contrato

### Trilha D - Documentacao
- atualizar `API_ROUTING.md` quando contrato mudar
- atualizar `AUDITORIA.MD` quando risco mudar
- documentar decisões estruturais relevantes

---

## Ordem Recomendada de Execucao

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6

Motivo:
- reduz risco arquitetural primeiro
- antecipa auth e tenant, que sustentam todo o resto
- migra depois os modulos de maior volume funcional

---

## Parecer Final
Este backlog traduz o plano do `StorePage_back` em execucao faseada.

Ele ja incorpora a perspectiva dos perfis que voce apontou:
- backend-specialist: separacao de camadas, contratos, dominio e implementacao incremental
- security-auditor: zero trust, tenant isolation, authz e defesa em profundidade
- performance-optimizer: agregacao, cache, limites e evitacao de N+1
- frontend-specialist: contratos estaveis para migracao futura do frontend

O proximo passo natural e transformar a **Fase 0** e a **Fase 1** em tarefas tecnicas menores e sequenciadas.
