# Referência da API Vercel — Environment Variables

Base URL: `https://api.vercel.com`
Auth Header: `Authorization: Bearer {VERCEL_TOKEN}`

Documentação oficial: https://vercel.com/docs/rest-api

---

## Limites Importantes

| Limite | Valor |
|---|---|
| Variáveis por projeto | 1.000 |
| Tamanho total de variáveis decryptadas | 64 KB por deployment |
| Rate limit padrão | ~600 requests/minuto por token |
| Tamanho de uma variável individual | 64 KB |

---

## Autenticação e Validação de Token

### Verificar usuário autenticado
```http
GET /v2/user
```
**Uso:** validar token antes de qualquer operação.

**Resposta de sucesso (200):**
```json
{
  "user": {
    "id": "usr_xxx",
    "name": "Israel",
    "email": "israel@email.com",
    "username": "israel"
  }
}
```

**Erros comuns:**
- `401` → Token inválido ou expirado
- `403` → Token sem permissão suficiente

---

## Times (Teams)

### Listar times do usuário
```http
GET /v2/teams
```

### Obter ID do time por slug
```http
GET /v2/teams?slug={team-slug}
```

> Para projetos pessoais, omitir `teamId` em todas as chamadas.
> Para projetos de time, todo endpoint de projeto/env aceita `?teamId={TEAM_ID}`.

---

## Projetos

### Listar projetos
```http
GET /v9/projects?teamId={TEAM_ID}&limit=20
```

### Buscar por nome (search)
```http
GET /v9/projects?search={nome-parcial}
```

### Obter projeto por ID ou nome
```http
GET /v9/projects/{projectIdOrName}?teamId={TEAM_ID}
```

**Resposta (campos relevantes):**
```json
{
  "id": "prj_xxxxxxxxxxxx",
  "name": "meuapp",
  "framework": "nextjs",
  "rootDirectory": null,
  "alias": [
    {
      "domain": "meuapp.com",
      "target": "PRODUCTION",
      "configuredBy": "CNAME"
    },
    {
      "domain": "meuapp.vercel.app",
      "target": "PRODUCTION"
    }
  ],
  "targets": {
    "production": {
      "url": "meuapp-abc123.vercel.app",
      "alias": ["meuapp.com", "meuapp.vercel.app"]
    }
  },
  "latestDeployments": [...]
}
```

**Para descobrir os domínios reais do projeto:**
- Use `alias[].domain` filtrando por `target: "PRODUCTION"` para listar todos
  os domínios de produção (incluindo customizados e `.vercel.app`).
- O domínio "principal" geralmente é o customizado (`configuredBy: "CNAME"` ou `"A"`).
- O domínio `.vercel.app` sempre existe como fallback.

---

## Environment Variables

### Listar variáveis do projeto
```http
GET /v9/projects/{projectId}/env
```

Parâmetros:
- `?teamId={TEAM_ID}` → projetos de time
- `?decrypt=true` → tenta retornar valores em texto puro (ver nota abaixo)

**Resposta:**
```json
{
  "envs": [
    {
      "id": "env_abc123",
      "key": "DATABASE_URL",
      "value": "",
      "type": "encrypted",
      "target": ["production", "preview"],
      "gitBranch": null,
      "configurationId": null,
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000
    }
  ],
  "pagination": {
    "count": 10,
    "next": null
  }
}
```

#### Sobre `decrypt=true`

A flag existe mas é uma má prática para uso geral:
- Requer token com escopo `Full Account` ou equivalente
- Pode falhar com `403` mesmo em tokens válidos
- Variáveis `sensitive` NUNCA são retornadas, mesmo com decrypt
- O agente deste sistema NÃO deve usar essa flag — política de segurança

#### Sobre `gitBranch`

Quando `gitBranch` está preenchido, a variável só vale para deployments daquele
branch específico. Causa comum de "funciona em prod mas não em preview" e
vice-versa. Auditar sempre.

---

### Adicionar variável (única)
```http
POST /v9/projects/{projectId}/env
Content-Type: application/json
```

**Body:**
```json
{
  "key": "MINHA_VARIAVEL",
  "value": "meu_valor_secreto",
  "type": "encrypted",
  "target": ["production", "preview", "development"]
}
```

### Adicionar variáveis em LOTE

A API aceita um array de objetos no mesmo endpoint — preferir sempre que
houver mais de uma adição:

```http
POST /v9/projects/{projectId}/env
Content-Type: application/json
```

```json
[
  {
    "key": "DATABASE_URL",
    "value": "postgresql://...",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  },
  {
    "key": "PUBLIC_APP_URL",
    "value": "https://meuapp.com",
    "type": "plain",
    "target": ["production"]
  }
]
```

**Resposta (201):**
```json
{
  "created": [
    { "id": "env_xyz789", "key": "DATABASE_URL", ... },
    { "id": "env_xyz790", "key": "PUBLIC_APP_URL", ... }
  ],
  "failed": []
}
```

Em batch, falhas individuais aparecem em `failed[]` sem abortar o conjunto.

### Tipos de variável (`type`)

| Tipo | Uso | Recuperação do valor |
|---|---|---|
| `plain` | URLs públicas, IDs, flags | Retornado em `GET /env` |
| `encrypted` | Padrão para secrets | NÃO retornado pela API (apenas o nome) |
| `sensitive` | Ultra-secreto, write-only | Nunca retornado, nem com decrypt |

> Importante: `encrypted` é o padrão e o mais comum. Mesmo sendo "criptografado",
> ele continua acessível pela aplicação em runtime — a criptografia é só "at rest".
> O nome "encrypted" se refere ao armazenamento, não ao acesso.

### Targets disponíveis

- `production` → ambiente de produção
- `preview` → pull requests e branches não-main
- `development` → `vercel dev` local

### Erros comuns no POST

- `400 already exists` → variável já existe → usar PATCH ou DELETE+POST
- `400 invalid key` → nome inválido (caracteres não permitidos, dígito inicial)
- `401` → token inválido
- `403` → sem permissão para o projeto
- `409 conflict` → duplicata por race condition

---

### Atualizar variável existente
```http
PATCH /v9/projects/{projectId}/env/{envId}
Content-Type: application/json
```

**Body:**
```json
{
  "value": "novo_valor",
  "type": "encrypted",
  "target": ["production", "preview", "development"]
}
```

> O `envId` vem do campo `id` retornado em `GET /env`.

> Para variáveis `sensitive`, o valor anterior não é recuperável — qualquer
> PATCH é uma sobrescrita total.

---

### Deletar variável
```http
DELETE /v9/projects/{projectId}/env/{envId}
```

**Resposta (200):**
```json
{
  "id": "env_abc123",
  "key": "VARIAVEL_DELETADA"
}
```

⚠️ Operação irreversível. Sempre confirmar com o usuário antes.

---

## Deployments

### Listar deployments recentes
```http
GET /v6/deployments?projectId={projectId}&limit=5
```

### Sobre o redeploy

A API permite triggerar redeploys, mas o agente deste sistema **não** dispara
redeploys automaticamente — apenas avisa o usuário no relatório final:

> Mudanças em variáveis de ambiente só entram em vigor após um novo deploy.
> Acesse o Dashboard → projeto → Deployments → ⋯ → Redeploy.

A justificativa é que redeploys podem rodar testes, migrations e outras
operações sensíveis — disparar isso sem intervenção humana é arriscado.

---

## Códigos de Erro

| Código | Significado | Ação recomendada |
|---|---|---|
| 400 | Body inválido ou variável duplicada | Verificar payload ou usar PATCH |
| 401 | Token inválido/expirado | Solicitar novo token |
| 402 | Limite do plano atingido | Informar usuário, sem retry |
| 403 | Sem permissão / escopo insuficiente | Verificar escopos do token |
| 404 | Projeto ou variável não encontrada | Verificar IDs |
| 409 | Conflito (duplicata em race condition) | Recarregar e usar PATCH |
| 429 | Rate limit | Aguardar 60s e retomar |
| 500 | Erro interno Vercel | Retry com backoff (3 tentativas) |
| 502/503/504 | Indisponibilidade temporária | Retry com backoff |

### Política de retry sugerida

```
401, 402, 403, 404 → não tentar novamente, reportar
429              → aguardar 60s, tentar 1x mais
500, 502-504     → backoff exponencial, máx 3 tentativas
Outros           → reportar e seguir
```

---

## Criação de Token

Orientar o usuário em:
`https://vercel.com/account/tokens`

**Recomendações:**
- Nome identificável: `env-manager-{projeto}`
- Escopo: específico do team se for projeto de time
- Expiração: definir prazo (90d ou menos)
- Salvar em local seguro — token só é exibido uma vez

---

## Rate Limits

- ~600 requests/minuto por token (varia por plano)
- 429 retorna header `Retry-After` com segundos de espera
- Operações em batch contam como 1 request, não N — preferir sempre
