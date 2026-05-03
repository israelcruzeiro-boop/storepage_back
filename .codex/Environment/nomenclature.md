# Nomenclatura de Variáveis de Ambiente
## Catálogo agnóstico de stack para sistemas Frontend + Backend desacoplados

Este documento descreve **padrões** de nomenclatura, não nomes fixos. Os
nomes exatos vêm do `.env.example` do projeto. Quando não houver, use os
padrões aqui como referência — sempre confirmando com o usuário.

---

## Regras Universais

| Regra | Descrição | Exemplo |
|---|---|---|
| UPPER_SNAKE_CASE | Sempre maiúsculo com underscore | `DATABASE_URL` |
| Sem espaços ou hífens | Use underscore como separador | `MY_VAR` |
| Sem dígito inicial | Não iniciar com número | `API_V2_KEY` (não `2_API_KEY`) |
| Prefixo público quando aplicável | Vars do browser têm prefixo do framework | ver tabela abaixo |

---

## Prefixos Públicos por Framework

Variáveis que precisam ser lidas pelo navegador (cliente) **devem** ter um
prefixo específico para serem expostas no bundle. Sem o prefixo correto, a
variável é `undefined` no browser. Com o prefixo errado, ela vaza para o
código público.

| Framework | Prefixo público | Exemplo |
|---|---|---|
| Next.js | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_URL` |
| Nuxt 3 | `NUXT_PUBLIC_` | `NUXT_PUBLIC_API_URL` |
| Vite (React, Vue, etc) | `VITE_` | `VITE_API_URL` |
| SvelteKit | `PUBLIC_` | `PUBLIC_API_URL` |
| Astro | `PUBLIC_` | `PUBLIC_API_URL` |
| Remix | (sem prefixo — controlado em runtime) | `API_URL` |
| Create React App (legado) | `REACT_APP_` | `REACT_APP_API_URL` |
| Gatsby | `GATSBY_` | `GATSBY_API_URL` |

> Quando ler este documento, substitua `<PUB>_` pelo prefixo correto do
> framework do projeto. Se o framework for desconhecido, perguntar ao usuário
> ou inspecionar `package.json` / arquivo de config.

### Regra de ouro

```
Frontend → usa <PUB>_ apenas para o que o browser precisa ler
Backend  → NUNCA usa prefixo público, todas as vars são server-side
```

Qualquer secret (API key, senha, connection string) com prefixo público é uma
**vulnerabilidade exposta no bundle JS** enviado ao browser.

---

## FRONTEND — Padrões Comuns

### Comunicação com o backend (universal)

```
<PUB>_API_URL                → URL pública do backend
                               Ex: https://api.meuapp.com
                               Tipo: plain
                               Sem trailing slash
                               Onde obter: domínio do projeto backend na Vercel
```

### Identidade do frontend

```
<PUB>_APP_URL                → URL pública do próprio frontend
                               Ex: https://meuapp.com
                               Tipo: plain
                               Onde obter: domínio do projeto frontend na Vercel
```

### Banco de dados via SDK público (Supabase, Firebase)

```
<PUB>_SUPABASE_URL           → URL do projeto Supabase
                               Ex: https://abc123.supabase.co
                               Tipo: plain
                               Onde obter: Supabase → Settings → API → Project URL

<PUB>_SUPABASE_ANON_KEY      → Chave anônima (RLS-protected)
                               Tipo: plain
                               Onde obter: Supabase → Settings → API → anon/public key

<PUB>_FIREBASE_API_KEY       → API key do Firebase Web SDK
                               Tipo: plain
                               Onde obter: Firebase Console → Project Settings → General
```

> Service Role Keys NUNCA aparecem no frontend.

### Autenticação — chaves públicas

```
<PUB>_CLERK_PUBLISHABLE_KEY  → Chave pública do Clerk (pk_test_ ou pk_live_)
                               Tipo: plain
                               Onde obter: dashboard.clerk.com → API Keys

<PUB>_AUTH0_DOMAIN           → Domínio do tenant Auth0
                               Onde obter: dashboard Auth0

<PUB>_AUTH0_CLIENT_ID        → Client ID do Auth0
                               Tipo: plain
```

### Pagamentos — chaves públicas

```
<PUB>_STRIPE_PUBLISHABLE_KEY → Chave pública do Stripe (pk_live_ ou pk_test_)
                               Tipo: plain
                               Onde obter: dashboard.stripe.com → Developers → API keys
```

### Analytics e monitoramento

```
<PUB>_GOOGLE_ANALYTICS_ID    → ID do GA4 (G-XXXXXXXXXX)
                               Tipo: plain
                               Onde obter: analytics.google.com → Admin → Data Streams

<PUB>_POSTHOG_KEY            → Project API Key do PostHog
                               Tipo: plain
                               Onde obter: app.posthog.com → Project Settings

<PUB>_SENTRY_DSN             → DSN público do Sentry para o frontend
                               Tipo: plain
                               Onde obter: sentry.io → Settings → Client Keys
```

### NextAuth/AuthJS (caso especial — usa o frontend mas tem secret)

```
NEXTAUTH_URL                 → URL base do frontend (sem prefixo público mesmo)
                               Tipo: plain
                               Obrigatório em production

NEXTAUTH_SECRET              → Secret para JWTs (32+ chars)
                               Tipo: encrypted
                               Como gerar: openssl rand -base64 48

AUTH_SECRET                  → Equivalente em AuthJS v5
                               Tipo: encrypted
```

---

## BACKEND — Padrões Comuns

### Comunicação com o frontend (CORS)

```
CORS_ORIGIN                  → URL do frontend permitida no CORS
                               Ex: https://meuapp.com
                               Tipo: plain
                               Múltiplas origens: separadas por vírgula
                               DEVE coincidir com <PUB>_APP_URL do frontend
```

### Identidade do backend

```
NODE_ENV                     → production | development
                               Tipo: plain
                               (Vercel injeta VERCEL_ENV automaticamente)

API_VERSION                  → ex: v1 (opcional, versionamento de rotas)
                               Tipo: plain
```

### Banco de dados (qualquer ORM/cliente)

```
DATABASE_URL                 → Connection string principal
                               Tipo: encrypted
                               PostgreSQL: postgresql://user:pass@host:port/db
                               MySQL: mysql://user:pass@host:port/db
                               MongoDB: mongodb+srv://user:pass@cluster/db

DIRECT_URL                   → Connection string direta sem pooling
                               (Prisma usa para migrations)
                               Tipo: encrypted

DATABASE_AUTH_TOKEN          → Token de auth (Turso, PlanetScale)
                               Tipo: encrypted

REDIS_URL                    → Connection string Redis/Upstash
                               Tipo: encrypted
```

> NUNCA expor `DATABASE_URL` no frontend.

### Banco via SDK admin (Supabase)

```
SUPABASE_URL                 → Mesmo valor da pública (sem prefixo)
                               Tipo: plain

SUPABASE_SERVICE_ROLE_KEY    → Chave admin com bypass de RLS
                               Tipo: encrypted
                               Onde obter: Supabase → Settings → API → service_role

SUPABASE_JWT_SECRET          → Secret para verificar JWTs do Supabase
                               Tipo: encrypted
                               Onde obter: Supabase → Settings → API → JWT Secret
```

### Autenticação privada — JWT próprio

```
JWT_SECRET                   → Secret para assinar JWTs
                               Tipo: encrypted
                               Mínimo 32 chars, idealmente 64+
                               Como gerar: openssl rand -base64 48

JWT_EXPIRES_IN               → Ex: 7d, 24h, 3600
                               Tipo: plain

REFRESH_TOKEN_SECRET         → Secret separado para refresh tokens
                               Tipo: encrypted
```

### Autenticação privada — provedores

```
CLERK_SECRET_KEY             → Backend key do Clerk (sk_test_ ou sk_live_)
                               Tipo: encrypted
                               Onde obter: dashboard.clerk.com → API Keys

CLERK_WEBHOOK_SECRET         → Secret de verificação de webhooks
                               Tipo: encrypted

AUTH0_CLIENT_SECRET          → Client secret do Auth0
                               Tipo: encrypted

FIREBASE_SERVICE_ACCOUNT     → JSON da service account (string completa)
                               Tipo: encrypted
                               Onde obter: Firebase → Project Settings → Service accounts
```

### Pagamentos privados

```
STRIPE_SECRET_KEY            → Chave secreta (sk_live_ ou sk_test_)
                               Tipo: encrypted
                               Onde obter: dashboard.stripe.com → Developers → API keys

STRIPE_WEBHOOK_SECRET        → Secret de assinatura de webhooks (whsec_)
                               Tipo: encrypted
                               Onde obter: Stripe → Webhooks → [endpoint] → Signing secret

STRIPE_PRICE_ID_*            → IDs de preços/produtos (não-secret mas privados)
                               Tipo: plain
```

### E-mail transacional

```
RESEND_API_KEY               → API key do Resend (re_)
                               Tipo: encrypted
                               Onde obter: resend.com/api-keys

SENDGRID_API_KEY             → API key do SendGrid (SG.)
                               Tipo: encrypted
                               Onde obter: app.sendgrid.com → Settings → API Keys

POSTMARK_SERVER_TOKEN        → Token do Postmark
                               Tipo: encrypted

SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
                             → Credenciais SMTP genéricas
                               Tipo: encrypted (PASS), plain (resto)

EMAIL_FROM                   → Endereço remetente verificado
                               Tipo: plain
```

### Storage (objetos/arquivos)

```
AWS_ACCESS_KEY_ID            → Tipo: encrypted
AWS_SECRET_ACCESS_KEY        → Tipo: encrypted
AWS_REGION                   → Ex: us-east-1 — Tipo: plain
AWS_S3_BUCKET_NAME           → Tipo: plain

CLOUDFLARE_R2_ACCESS_KEY_ID  → Tipo: encrypted
CLOUDFLARE_R2_SECRET         → Tipo: encrypted
CLOUDFLARE_R2_BUCKET         → Tipo: plain

UPLOADTHING_SECRET           → Tipo: encrypted
UPLOADTHING_APP_ID           → Tipo: plain
```

### Provedores de IA

```
OPENAI_API_KEY               → Tipo: encrypted (sk-)
                               Onde obter: platform.openai.com/api-keys

ANTHROPIC_API_KEY            → Tipo: encrypted (sk-ant-)
                               Onde obter: console.anthropic.com → API Keys

GOOGLE_GENERATIVE_AI_API_KEY → Tipo: encrypted
                               Onde obter: aistudio.google.com/app/apikey

GROQ_API_KEY                 → Tipo: encrypted
COHERE_API_KEY               → Tipo: encrypted
REPLICATE_API_TOKEN          → Tipo: encrypted
```

### Monitoramento/observabilidade

```
SENTRY_DSN                   → DSN do Sentry para o backend
                               Tipo: plain (DSN é considerado público mesmo)

SENTRY_AUTH_TOKEN            → Token para upload de source maps no build
                               Tipo: encrypted

DATADOG_API_KEY              → Tipo: encrypted
NEW_RELIC_LICENSE_KEY        → Tipo: encrypted
AXIOM_TOKEN                  → Tipo: encrypted
```

### Filas, jobs e cache

```
UPSTASH_REDIS_REST_URL       → Tipo: plain
UPSTASH_REDIS_REST_TOKEN     → Tipo: encrypted

QSTASH_TOKEN                 → Tipo: encrypted
QSTASH_CURRENT_SIGNING_KEY   → Tipo: encrypted
QSTASH_NEXT_SIGNING_KEY      → Tipo: encrypted
```

---

## Mapa de Responsabilidades

Qual lado é dono de cada categoria.

| Categoria | Frontend | Backend |
|---|---|---|
| URL do backend | `<PUB>_API_URL` | — |
| URL do frontend | `<PUB>_APP_URL` | `CORS_ORIGIN` |
| Banco de dados | ❌ Nunca | `DATABASE_URL`, `DIRECT_URL` |
| Supabase público | `<PUB>_SUPABASE_URL`, `_ANON_KEY` | `SUPABASE_URL` (espelho) |
| Supabase admin | ❌ Nunca | `SERVICE_ROLE_KEY`, `JWT_SECRET` |
| Auth pública (Clerk/Auth0) | `PUBLISHABLE_KEY` / `CLIENT_ID` | — |
| Auth privada (Clerk/Auth0) | ❌ Nunca | `SECRET_KEY` / `CLIENT_SECRET` |
| JWT próprio | ❌ Nunca | `JWT_SECRET`, `REFRESH_TOKEN_SECRET` |
| NextAuth/AuthJS | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | — |
| Stripe público | `<PUB>_STRIPE_PUBLISHABLE_KEY` | — |
| Stripe privado | ❌ Nunca | `STRIPE_SECRET_KEY`, `WEBHOOK_SECRET` |
| E-mail | ❌ Nunca | `RESEND_API_KEY`, `EMAIL_FROM` |
| IA (OpenAI, Anthropic, etc) | ❌ Nunca | `*_API_KEY` |
| Storage (S3, R2) | ❌ Nunca | `ACCESS_KEY`, `SECRET`, `BUCKET` |
| Analytics público | `<PUB>_GA_ID`, `<PUB>_POSTHOG_KEY` | — |
| Sentry frontend | `<PUB>_SENTRY_DSN` | — |
| Sentry backend | — | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |

---

## Checklist de Auditoria

Ao revisar variáveis existentes, verificar:

- [ ] Variáveis client-side têm o prefixo público correto do framework?
- [ ] Secrets do frontend NÃO têm prefixo público?
- [ ] Secrets do backend existem APENAS no projeto backend?
- [ ] `CORS_ORIGIN` no backend bate com URL real do frontend?
- [ ] `<PUB>_API_URL` no frontend bate com URL real do backend?
- [ ] `DATABASE_URL` ausente do projeto frontend?
- [ ] Chaves test/live coerentes com cada environment?
- [ ] Nenhuma variável automática da Vercel redefinida manualmente?
- [ ] Todos os nomes em `UPPER_SNAKE_CASE` sem hífens?
- [ ] Targets cobrem todos os ambientes que a variável precisa?

---

## Quando o `.env.example` Existe

Se o repositório tem `.env.example`, ele é a fonte de verdade. Use este
documento apenas para:

1. Inferir o **tipo** correto de cada variável (`plain` vs `encrypted`)
2. Inferir o **target** padrão de cada variável
3. Validar que a variável está no projeto correto (frontend vs backend)
4. Explicar didaticamente onde obter cada valor (etapa 5 do AGENT.md)

Não adicione variáveis que não estão no `.env.example`. Não remova ou
renomeie variáveis do `.env.example`.
