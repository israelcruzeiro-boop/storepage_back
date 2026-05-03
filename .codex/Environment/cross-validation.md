# Cross-Validation: Frontend ↔ Backend
## Checklist de Consistência entre Projetos Vercel

Este arquivo define todas as validações que o agente deve executar para
garantir que as variáveis dos dois projetos são consistentes entre si.

Erros de cross-validation são a principal causa de falhas em sistemas
desacoplados — o frontend pode estar 100% correto, o backend pode estar 100%
correto, e mesmo assim o sistema quebra porque eles "não se enxergam".

> Notação: `<PUB>_` representa o prefixo público do framework do frontend
> (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, etc). Substituir conforme o projeto.

---

## Validação 1 — Comunicação Frontend → Backend

**Objetivo:** garantir que o frontend aponta para o backend correto.

### O que verificar

A variável pública de URL da API no frontend (tipicamente `<PUB>_API_URL`)
deve corresponder a um dos domínios reais do projeto backend.

### Como verificar

1. Identificar a variável de URL da API no frontend (do `.env.example` ou
   do levantamento da Etapa 1).
2. Pedir o valor ao usuário (a API não retorna valores de variáveis
   `encrypted`, e mesmo `plain` é boa prática reconfirmar).
3. Buscar todos os domínios de produção do backend:
   ```http
   GET https://api.vercel.com/v9/projects/{BACKEND_PROJECT_ID}
   ```
   Ler `alias[]` e filtrar por `target: "PRODUCTION"`.
4. Comparar valor com a lista de domínios.

### Erros comuns

```
Valor                                              Diagnóstico
----------------------------------------------------------
https://meuapp-api-git-main.vercel.app             URL de preview, não production
https://meuapp-api.vercel.app/                     trailing slash (rotas /v1/x viram //v1/x)
http://localhost:3001                              valor de dev em production
URL não definida                                   chamadas à API vão todas falhar
domínio antigo (api-old.meuapp.com)                aponta para projeto descontinuado
```

### Status no relatório

```
[OK]    URL da API aponta para domínio production correto do backend
[ERRO]  URL da API aponta para preview/branch URL em production
[ERRO]  URL da API não definida no projeto frontend
[AVISO] URL da API contém trailing slash — pode causar rotas duplicadas
[AVISO] URL da API usa .vercel.app em vez do domínio customizado
```

---

## Validação 2 — CORS Backend → Frontend

**Objetivo:** garantir que o backend aceita requisições do frontend correto.

### O que verificar

`CORS_ORIGIN` (ou equivalente — `ALLOWED_ORIGINS`, `CORS_WHITELIST`) no
backend deve corresponder ao domínio real do frontend. Em paralelo, deve
coincidir com `<PUB>_APP_URL` se essa variável existir no frontend.

### Como verificar

1. Pedir ao usuário o valor de `CORS_ORIGIN` no backend.
2. Buscar domínios de produção do frontend via `GET /v9/projects/{FRONTEND_PROJECT_ID}`.
3. Confirmar que `CORS_ORIGIN` bate com pelo menos um deles.
4. Se `<PUB>_APP_URL` existe no frontend, comparar os dois.

### Casos especiais

- **Múltiplas origens:** alguns backends aceitam lista separada por vírgula.
  Validar cada uma individualmente.
- **Wildcard `*`:** abre o backend para qualquer origem. Inseguro em production
  para APIs autenticadas.
- **Preview deployments:** se o frontend tem URLs dinâmicas de preview, o
  backend precisa de regex ou wildcard cuidadoso, não um domínio fixo.

### Status no relatório

```
[OK]    CORS_ORIGIN bate com domínio production do frontend
[OK]    CORS_ORIGIN e <PUB>_APP_URL são consistentes
[ERRO]  CORS_ORIGIN não definida — backend bloqueará todas as requisições do frontend
[ERRO]  CORS_ORIGIN aponta para localhost em production
[AVISO] CORS_ORIGIN = "*" — inseguro para APIs autenticadas
[AVISO] CORS_ORIGIN usa .vercel.app — confirmar se domínio customizado deveria ser usado
[AVISO] CORS_ORIGIN não cobre URLs de preview — preview deployments terão CORS bloqueado
```

---

## Validação 3 — Secrets no Projeto Errado

**Objetivo:** garantir que chaves privadas estão apenas no backend.

### Padrões que NUNCA devem existir no frontend

```
Conexões de banco:
  DATABASE_URL, DIRECT_URL, REDIS_URL, MONGODB_URI

Service roles e admin keys:
  SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
  FIREBASE_SERVICE_ACCOUNT, FIREBASE_PRIVATE_KEY

Auth privada:
  CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET
  AUTH0_CLIENT_SECRET
  JWT_SECRET, REFRESH_TOKEN_SECRET, NEXTAUTH_SECRET (se em projeto separado)

Pagamentos:
  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

E-mail / Storage / IA:
  RESEND_API_KEY, SENDGRID_API_KEY, POSTMARK_SERVER_TOKEN
  AWS_SECRET_ACCESS_KEY, CLOUDFLARE_R2_SECRET, UPLOADTHING_SECRET
  OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY

Monitoramento privado:
  SENTRY_AUTH_TOKEN, DATADOG_API_KEY, NEW_RELIC_LICENSE_KEY
```

### Heurística adicional

Qualquer variável no frontend que NÃO comece com o prefixo público do
framework (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, etc) é suspeita. Exceções
legítimas: `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (caso especial onde o secret
fica no projeto frontend porque o NextAuth roda nas API routes do Next).

### Status no relatório

```
[OK]      Nenhum secret detectado no projeto frontend
[CRÍTICO] DATABASE_URL encontrada no projeto frontend — remover imediatamente
[CRÍTICO] STRIPE_SECRET_KEY encontrada no projeto frontend — remover imediatamente
[AVISO]   Variável <NOME> sem prefixo público no frontend — confirmar se deveria estar lá
```

Achados `[CRÍTICO]` devem aparecer no topo do relatório, com instrução clara:

> Esta variável vaza no bundle JavaScript enviado ao browser. Qualquer pessoa
> pode ler abrindo as DevTools. Remover IMEDIATAMENTE e rotacionar o valor
> (gerar uma nova chave/secret e invalidar a antiga no provedor).

---

## Validação 4 — Variáveis Multi-projeto Coerentes

**Objetivo:** garantir que vars que existem nos dois lados têm valores
consistentes.

### Casos típicos

| Variável | Frontend | Backend | Devem bater? |
|---|---|---|---|
| URL pública do Supabase | `<PUB>_SUPABASE_URL` | `SUPABASE_URL` | Sim — mesmo projeto Supabase |
| URL do frontend | `<PUB>_APP_URL` | `CORS_ORIGIN` | Sim — mesmo domínio |
| Auth provider (Clerk pub key) | `<PUB>_CLERK_PUBLISHABLE_KEY` | (não existe) | N/A |
| Auth provider (Clerk secret) | (não deve existir) | `CLERK_SECRET_KEY` | N/A |
| Stripe environment | `<PUB>_STRIPE_PUBLISHABLE_KEY` (`pk_test_` ou `pk_live_`) | `STRIPE_SECRET_KEY` (`sk_test_` ou `sk_live_`) | Devem estar no MESMO modo |

### Status no relatório

```
[OK]    URLs do Supabase consistentes entre frontend e backend
[ERRO]  Stripe em modo TEST no frontend e LIVE no backend (ou vice-versa)
[AVISO] <PUB>_APP_URL e CORS_ORIGIN apontam para domínios diferentes
```

---

## Validação 5 — Targets Coerentes

**Objetivo:** garantir que cada variável existe nos environments certos.

### O que verificar

Para cada variável esperada, confirmar que `target` cobre todos os ambientes
necessários:

- Variáveis públicas de URL → geralmente `production, preview, development`
- Secrets de produção → no mínimo `production`
- Secrets que devem ser diferentes em test → mesma key, valores diferentes por target

### Como verificar

`GET /env` retorna `target: [...]` de cada variável. Para o conjunto esperado
da Etapa 1 do AGENT.md, validar cobertura.

### Erros comuns

```
DATABASE_URL existe apenas em production              → preview deploys quebram
PUBLIC_API_URL existe apenas em production            → vercel dev local quebra
JWT_SECRET com mesmo valor em prod e preview          → preview pode emitir tokens válidos em prod (separar)
```

### Status no relatório

```
[OK]    Targets cobrem todos os ambientes necessários
[AVISO] DATABASE_URL definida apenas para production — preview deploys vão falhar
[AVISO] JWT_SECRET com mesmo valor em production e preview — considerar valores distintos
```

---

## Validação 6 — Coerência de Valores Test/Live

**Objetivo:** garantir que valores de test não vazam para production.

### Padrões a detectar

| Prefixo | Environment esperado |
|---|---|
| `pk_test_`, `sk_test_` (Stripe) | preview, development |
| `pk_live_`, `sk_live_` (Stripe) | production |
| `re_test_` (Resend) | development |
| `whsec_` em ambiente errado | conferir endpoint do webhook |
| URLs `http://localhost:*` | development apenas |
| URLs `*.vercel.app` em produção quando há domínio customizado | aviso |

> Como a API não retorna valores de variáveis `encrypted`, parte dessa
> validação depende de perguntar ao usuário ou orientar a checagem visual no
> dashboard.

### Status no relatório

```
[OK]    Stripe em modo live em production e test em preview/development
[ERRO]  Chave Stripe test detectada em production
[AVISO] localhost detectado em preview ou production
```

---

## Validação 7 — Variáveis Automáticas da Vercel

**Objetivo:** garantir que variáveis injetadas pela Vercel não foram
sobrescritas manualmente em nenhum dos projetos.

### Lista de variáveis automáticas

```
VERCEL
VERCEL_ENV
VERCEL_URL
VERCEL_BRANCH_URL
VERCEL_GIT_COMMIT_SHA
VERCEL_GIT_COMMIT_REF
VERCEL_GIT_REPO_SLUG
VERCEL_GIT_PROVIDER
VERCEL_GIT_REPO_OWNER
VERCEL_REGION
```

### Status no relatório

```
[OK]    Nenhuma variável automática redefinida manualmente
[AVISO] VERCEL_ENV redefinida manualmente — pode causar comportamento inesperado
```

---

## Validação 8 — gitBranch Inesperado

**Objetivo:** detectar variáveis com escopo de branch específico que podem
causar comportamento inconsistente.

### O que verificar

Em `GET /env`, o campo `gitBranch` quando preenchido restringe a variável a
deployments daquele branch. Causa comum de "funciona em main mas não em
develop".

### Status no relatório

```
[OK]    Nenhuma variável com escopo de branch detectada
[AVISO] DATABASE_URL restrita ao branch main — outros branches usarão fallback ou falharão
```

---

## Relatório Final Consolidado

Apresentar ao final da Etapa 4 do AGENT.md, antes de qualquer ação:

```
=== CROSS-CHECK FRONTEND ↔ BACKEND ===

1. Comunicação (Frontend → Backend)
   [STATUS] [resultado]

2. CORS (Backend → Frontend)
   [STATUS] [resultado]

3. Segurança (secrets no projeto correto)
   Frontend: [STATUS] [resultado]
   Backend:  [STATUS] [resultado]

4. Variáveis multi-projeto
   [STATUS] [resultado]

5. Targets coerentes
   [STATUS] [resultado]

6. Valores test/live
   [STATUS] [resultado]

7. Variáveis automáticas
   [STATUS] [resultado]

8. gitBranch escopado
   [STATUS] [resultado]

RESULTADO GERAL: [OK / ATENÇÃO: N problemas / CRÍTICO: N achados graves]
```

Achados `[CRÍTICO]` (vazamento de secret) devem ser destacados no topo do
relatório, separados de `[ERRO]` e `[AVISO]`.

---

## Ordem de Redeploy

Quando ambos os projetos são alterados, a ordem importa:

```
1. Backend primeiro  → garante que novas rotas/configs estejam disponíveis
2. Frontend depois   → só então o frontend aponta para o backend já atualizado
```

Se apenas um lado foi alterado, redeploy só nele.

Se houve mudança em `<PUB>_API_URL` ou `CORS_ORIGIN`, redeploy obrigatório
nos dois — qualquer ordem, mas as duas pontas precisam ser refeitas.
