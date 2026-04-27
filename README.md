# StorePage_back

Backend desacoplado da plataforma StorePage.

## Stack
- Node.js + TypeScript estrito
- Fastify
- REST
- Zod
- JWT com `jose`

## Fases implementadas

### Fase 0
- bootstrap HTTP com `src/app.ts` e `src/server.ts`
- configuracao centralizada de ambiente com validacao
- logger estruturado com redacao de campos sensiveis
- envelope padrao de sucesso/erro
- tratamento centralizado de erros e `404`
- plugins base para CORS, security headers, auth context e tenant context
- rotas `GET /`, `GET /health`, `GET /readyz` e `GET /api`

### Fase 1
- auth e sessao com login, refresh, logout, `me`, profile e password
- tenant branding publico por slug/link_name
- companies basicas e settings iniciais
- CRUD admin de users e invites provisionados
- CRUD admin de estrutura organizacional
- middleware JWT validando assinatura + sessao ativa + usuario ativo

## Endpoints principais da Fase 1
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/tenant/:slug`
- `GET /api/auth/invites/:token`
- `POST /api/auth/invites/activate`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`
- `GET /api/companies/current`
- `GET /api/companies/public/:slug`
- `GET /api/settings/appearance/:slug`
- `GET /api/settings/features`
- `PATCH /api/admin/settings/appearance`
- `PATCH /api/admin/settings/features`
- `PATCH /api/admin/settings/general`
- `GET|POST|PUT|DELETE /api/admin/users*`
- `GET|POST|PUT|DELETE /api/admin/structure*`

## Persistencia
- `REPOSITORY_DRIVER=memory` usa `src/repositories/memory` e continua sendo o padrao dos testes.
- `REPOSITORY_DRIVER=supabase` usa o adapter server-side em `src/repositories/supabase`.
- Antes de ligar o driver Supabase, rode as migrations da pasta `supabase/` em ordem cronologica:
  - `20260426_phase1_backend_adapter.sql`
  - `20260427_add_users_onboarding_completed.sql`
  - `20260427_phase5_surveys_adapter.sql`
- Services e rotas continuam falando apenas com os contratos em `src/repositories/contracts`.
- A chave Supabase usada pelo backend deve ser `SUPABASE_SERVICE_ROLE_KEY` somente em ambiente server-side.
- Uploads passam por `POST /api/storage/upload`; o frontend nao precisa de acesso direto ao Supabase Storage.

## Readiness com Supabase real
Para homologar `REPOSITORY_DRIVER=supabase`, configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SCHEMA`, `SUPABASE_STORAGE_BUCKET` e `SUPABASE_STORAGE_ALLOWED_BUCKETS` no backend. Nao coloque service role nem anon key no frontend.

Checklist de smoke test recomendado apos aplicar migrations:
- login e refresh/logout
- `GET /api/auth/me`
- `PATCH /api/users/me/profile` com `onboardingCompleted`
- repositories, contents e landing publica
- courses, enrollments e quizzes
- checklists, submissions e action plans
- surveys, questions, responses e answers
- upload via `POST /api/storage/upload`
- Super Admin companies/users/provisionamento

## Estrutura
- `src/routes`
- `src/modules`
- `src/services`
- `src/repositories`
- `src/schemas`
- `src/config`
- `src/lib`
- `src/plugins`
- `src/types`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run check`

## Variaveis de ambiente
Use `.env.example` como base.

### Base
- `NODE_ENV`
- `HOST`
- `PORT`
- `API_PREFIX`
- `LOG_LEVEL`
- `REQUEST_TIMEOUT_MS`
- `CORS_ORIGINS`
- `CORS_ALLOW_CREDENTIALS`

### Persistencia
- `REPOSITORY_DRIVER` (`memory` ou `supabase`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SCHEMA`
- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_STORAGE_ALLOWED_BUCKETS`
- `SUPABASE_STORAGE_MAX_UPLOAD_BYTES`

### JWT e sessao
- `JWT_AUTH_MODE`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `JWT_ALLOWED_ALGORITHMS`
- `JWT_SHARED_SECRET`
- `JWT_JWKS_URL`
- `JWT_ROLE_CLAIM`
- `JWT_COMPANY_ID_CLAIM`
- `JWT_EMAIL_CLAIM`
- `JWT_CLOCK_TOLERANCE_SECONDS`
- `ACCESS_TOKEN_TTL_MINUTES`
- `REFRESH_TOKEN_TTL_DAYS`

### Cache publico
- `PUBLIC_TENANT_CACHE_TTL_SECONDS`

## Observacoes operacionais
- `JWT_AUTH_MODE=shared-secret` e o modo que suporta emissao de tokens de sessao da API nesta fase.
- `JWT_AUTH_MODE=jwks` continua suportando verificacao de tokens, mas login/refresh da propria API dependem do modo com segredo simetrico ate a estrategia final de emissao ser definida.
- O adapter Supabase usa PostgREST via `fetch`, com filtros por `company_id` nos repositories tenant-scoped e sem expor secrets ao frontend.
- O storage server-side usa a API Supabase Storage com service role. Configure buckets publicos/permitidos em `SUPABASE_STORAGE_ALLOWED_BUCKETS`; os paths novos sao prefixados por `companies/{companyId}` para preservar isolamento de tenant.
