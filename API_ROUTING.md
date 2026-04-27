# Especificacao de Rotas API - StorePage_back

Este documento define o contrato funcional da API do `StorePage_back`.
O objetivo e cobrir todos os modulos necessarios para substituir o acesso direto do frontend ao Supabase.

Observacoes:
- este documento descreve o contrato alvo, nao obriga implementacao total em uma unica fase
- o backend continua sendo multi-tenant
- o frontend `StorePage` deve consumir estes contratos, nunca tabelas, RPCs ou buckets diretamente

---

## Padrao Global

### Envelope de sucesso
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Envelope de erro
```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

### Autenticacao
- rotas `Auth` exigem sessao valida
- rotas `Admin` exigem sessao valida e role administrativa no tenant
- rotas `Super Admin` exigem role global
- rotas `Public` nao exigem sessao

### Resolucao de tenant
- rotas autenticadas resolvem `company_id` pela sessao do usuario
- rotas publicas resolvem tenant por `slug`
- rotas administrativas nunca devem confiar apenas em `company_id` enviado pelo client

### Convencoes de implementacao
- soft delete com `deleted_at` nas entidades que suportam exclusao logica
- filtros explicitos por tenant
- selects explicitos
- validacao obrigatoria com Zod

---

## 1. Auth e Sessao

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/login` | Login por email ou identificador, com tratamento de usuario provisionado | Public |
| POST | `/api/auth/refresh` | Renova token/sessao | Public |
| POST | `/api/auth/logout` | Invalida sessao atual | Auth |
| GET | `/api/auth/me` | Retorna perfil autenticado e contexto da company | Auth |
| GET | `/api/auth/tenant/:slug` | Retorna dados publicos de marca para login/entrada | Public |
| GET | `/api/auth/invites/:token` | Valida token de convite antes da ativacao | Public |
| POST | `/api/auth/invites/activate` | Ativa conta provisionada ou convite valido | Public |
| PATCH | `/api/auth/profile` | Atualiza nome, avatar e demais dados editaveis do proprio usuario | Auth |
| PATCH | `/api/auth/password` | Atualiza senha do usuario autenticado | Auth |

### Exemplo de payload - login
```json
{
  "identifier": "usuario@empresa.com",
  "password": "secret",
  "company_slug": "tenant-xyz"
}
```

### Exemplo de resposta - me
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Fulano",
      "email": "fulano@empresa.com",
      "role": "ADMIN",
      "company_id": "company-uuid"
    },
    "company": {
      "id": "company-uuid",
      "name": "Empresa XPTO",
      "slug": "empresa-xpto",
      "theme": {
        "primary": "#111827"
      }
    }
  },
  "message": "OK"
}
```

---

## 2. Companies, Settings e White Label

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/companies/current` | Retorna company ativa do usuario autenticado | Auth |
| GET | `/api/companies/public/:slug` | Retorna configuracao publica da landing/login do tenant | Public |
| GET | `/api/settings/appearance/:slug` | Retorna aparencia publica do tenant | Public |
| GET | `/api/settings/features` | Retorna feature flags do tenant autenticado | Auth |
| PATCH | `/api/admin/settings/appearance` | Atualiza branding, hero e assets | Admin |
| PATCH | `/api/admin/settings/features` | Ativa ou desativa modulos do tenant | Admin |
| PATCH | `/api/admin/settings/general` | Atualiza configuracoes gerais da company | Admin |

---

## 3. Usuarios, Convites e Estrutura Organizacional

### Usuarios e convites

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/admin/users` | Lista usuarios ativos, inativos e convites pendentes do tenant | Admin |
| GET | `/api/admin/users/:id` | Retorna detalhes de um usuario especifico | Admin |
| POST | `/api/admin/users/invite` | Cria convite e provisiona usuario | Admin |
| PUT | `/api/admin/users/:id` | Atualiza role, status, lotacao e dados administrativos | Admin |
| DELETE | `/api/admin/users/:id` | Soft delete de usuario | Admin |
| DELETE | `/api/admin/users/invites/:id` | Cancela ou remove convite provisionado | Admin |

### Estrutura organizacional

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/admin/structure` | Retorna arvore completa de niveis e unidades | Admin |
| GET | `/api/admin/structure/top-levels` | Lista niveis superiores | Admin |
| GET | `/api/admin/structure/units` | Lista unidades | Admin |
| POST | `/api/admin/structure/top-levels` | Cria nivel superior | Admin |
| PUT | `/api/admin/structure/top-levels/:id` | Atualiza nivel superior | Admin |
| DELETE | `/api/admin/structure/top-levels/:id` | Soft delete de nivel superior | Admin |
| POST | `/api/admin/structure/units` | Cria unidade | Admin |
| PUT | `/api/admin/structure/units/:id` | Atualiza unidade | Admin |
| DELETE | `/api/admin/structure/units/:id` | Soft delete de unidade | Admin |

---

## 4. Repositorios, Conteudos, Links e Categorias

### Consumo autenticado

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/repositories` | Lista repositorios ativos visiveis ao usuario | Auth |
| GET | `/api/repositories/:id` | Retorna detalhes do repositorio com metadados | Auth |
| GET | `/api/repositories/:id/catalog` | Retorna categorias, contents e simple links estruturados | Auth |
| GET | `/api/contents/:id` | Detalhes de um conteudo especifico | Auth |
| GET | `/api/repositories/:id/categories` | Lista categorias do repositorio | Auth |
| GET | `/api/repositories/:id/simple-links` | Lista links simples do repositorio | Auth |

### Consumo publico

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/landing/:slug` | Dados da landing page publica do tenant | Public |
| GET | `/api/landing/:slug/repositories` | Repositorios publicos da landing | Public |
| GET | `/api/landing/repositories/:id/contents` | Conteudos publicos de um repositorio | Public |
| GET | `/api/landing/repositories/:id/simple-links` | Links publicos de um repositorio | Public |

### Gestao administrativa

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| POST | `/api/admin/repositories` | Cria repositorio | Admin |
| PUT | `/api/admin/repositories/:id` | Atualiza repositorio | Admin |
| DELETE | `/api/admin/repositories/:id` | Soft delete de repositorio | Admin |
| POST | `/api/admin/repositories/:id/categories` | Cria categoria | Admin |
| PUT | `/api/admin/categories/:id` | Atualiza categoria | Admin |
| DELETE | `/api/admin/categories/:id` | Soft delete de categoria | Admin |
| POST | `/api/admin/contents` | Cria conteudo e metadados | Admin |
| PUT | `/api/admin/contents/:id` | Atualiza conteudo | Admin |
| DELETE | `/api/admin/contents/:id` | Soft delete de conteudo | Admin |
| POST | `/api/admin/simple-links` | Cria link simples | Admin |
| PUT | `/api/admin/simple-links/:id` | Atualiza link simples | Admin |
| DELETE | `/api/admin/simple-links/:id` | Soft delete de link simples | Admin |

---

## 5. Metrics e Engajamento

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| POST | `/api/metrics/views` | Registra visualizacao de conteudo ou aula | Auth |
| POST | `/api/metrics/ratings` | Registra ou atualiza avaliacao por estrelas | Auth |
| GET | `/api/admin/metrics/repositories` | Consolida metricas de repositorios e conteudos | Admin |
| GET | `/api/admin/metrics/users/:id/activity` | Retorna atividade de consumo de um usuario | Admin |
| GET | `/api/admin/metrics/summary` | Resumo consolidado para dashboard administrativo | Admin |

### Exemplo de payload - rating
```json
{
  "content_id": "uuid",
  "rating": 5
}
```

---

## 6. LMS, Cursos e Quizzes

### Consumo do usuario

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/courses` | Lista cursos disponiveis com status de matricula do usuario | Auth |
| GET | `/api/courses/:id` | Retorna curso, modulos, conteudos, quiz e progresso atual | Auth |
| GET | `/api/courses/:id/modules` | Lista modulos do curso | Auth |
| GET | `/api/courses/modules/:id/contents` | Lista conteudos do modulo | Auth |
| GET | `/api/courses/modules/:id/questions` | Lista perguntas do modulo | Auth |
| GET | `/api/courses/:id/enrollment` | Retorna matricula atual do usuario no curso | Auth |
| POST | `/api/courses/:id/enroll` | Inicia matricula | Auth |
| PATCH | `/api/courses/enrollments/:id/progress` | Atualiza modulo atual, conteudo atual e progresso | Auth |
| POST | `/api/courses/enrollments/:id/answers` | Salva ou atualiza resposta do aluno | Auth |
| GET | `/api/courses/enrollments/:id/answers` | Lista respostas do aluno | Auth |
| POST | `/api/courses/enrollments/:id/complete` | Finaliza matricula e calcula score | Auth |
| GET | `/api/courses/:id/quiz` | Retorna quiz do conteudo ou curso quando aplicavel | Auth |
| GET | `/api/quizzes/:id/questions` | Retorna perguntas e opcoes do quiz | Auth |
| POST | `/api/quizzes/:id/attempts` | Registra tentativa de quiz | Auth |

### Gestao administrativa

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/admin/courses` | Lista cursos do tenant | Admin |
| GET | `/api/admin/courses/:id` | Retorna curso completo para edicao | Admin |
| POST | `/api/admin/courses` | Cria curso | Admin |
| PUT | `/api/admin/courses/:id` | Atualiza curso | Admin |
| DELETE | `/api/admin/courses/:id` | Soft delete de curso | Admin |
| POST | `/api/admin/courses/:id/modules` | Cria modulo | Admin |
| PUT | `/api/admin/modules/:id` | Atualiza modulo | Admin |
| DELETE | `/api/admin/modules/:id` | Soft delete de modulo | Admin |
| POST | `/api/admin/modules/:id/contents` | Cria conteudo do modulo | Admin |
| PUT | `/api/admin/course-contents/:id` | Atualiza conteudo do modulo | Admin |
| DELETE | `/api/admin/course-contents/:id` | Soft delete de conteudo do modulo | Admin |
| POST | `/api/admin/modules/:id/questions` | Cria pergunta do modulo | Admin |
| PUT | `/api/admin/course-questions/:id` | Atualiza pergunta do modulo | Admin |
| DELETE | `/api/admin/course-questions/:id` | Soft delete de pergunta do modulo | Admin |
| POST | `/api/admin/courses/:id/reset-enrollment` | Libera refazer curso para usuario | Admin |
| GET | `/api/admin/courses/:id/dashboard` | Dashboard do curso | Admin |
| GET | `/api/admin/courses/:id/analytics` | Analytics detalhado do curso | Admin |

---

## 7. Checklists, Submissoes, Anexos e Action Plans

### Consumo do usuario

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/checklists` | Lista modelos disponiveis ao usuario | Auth |
| GET | `/api/checklists/:id` | Retorna checklist completo com secoes e perguntas | Auth |
| GET | `/api/checklists/submissions/:id` | Retorna submissao especifica | Auth |
| GET | `/api/checklists/submissions/:id/answers` | Lista respostas da submissao | Auth |
| POST | `/api/checklists/submissions` | Inicia submissao de checklist | Auth |
| PATCH | `/api/checklists/submissions/:id` | Atualiza status, contexto ou metadados da submissao | Auth |
| PUT | `/api/checklists/submissions/:id/answers/:questionId` | Salva ou atualiza resposta individual com autosave | Auth |
| POST | `/api/checklists/submissions/:id/complete` | Finaliza auditoria | Auth |
| POST | `/api/checklists/attachments/sign` | Gera URL assinada para upload de foto/anexo | Auth |
| GET | `/api/action-plans` | Lista action plans do usuario | Auth |
| PATCH | `/api/action-plans/:id` | Atualiza status, responsavel ou prazo de action plan permitido ao usuario | Auth |

### Gestao administrativa

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/admin/checklists` | Lista modelos do tenant | Admin |
| GET | `/api/admin/checklists/:id` | Retorna modelo completo para edicao | Admin |
| POST | `/api/admin/checklists` | Cria checklist | Admin |
| PUT | `/api/admin/checklists/:id` | Atualiza checklist | Admin |
| DELETE | `/api/admin/checklists/:id` | Soft delete de checklist | Admin |
| GET | `/api/admin/checklist-folders` | Lista folders | Admin |
| POST | `/api/admin/checklist-folders` | Cria folder | Admin |
| PUT | `/api/admin/checklist-folders/:id` | Atualiza folder | Admin |
| DELETE | `/api/admin/checklist-folders/:id` | Soft delete de folder | Admin |
| GET | `/api/admin/checklists/:id/sections` | Lista secoes do checklist | Admin |
| POST | `/api/admin/checklists/:id/sections` | Cria secao | Admin |
| PUT | `/api/admin/checklist-sections/:id` | Atualiza secao | Admin |
| DELETE | `/api/admin/checklist-sections/:id` | Soft delete de secao | Admin |
| GET | `/api/admin/checklists/:id/questions` | Lista perguntas do checklist | Admin |
| POST | `/api/admin/checklists/:id/questions` | Cria pergunta | Admin |
| PUT | `/api/admin/checklist-questions/:id` | Atualiza pergunta | Admin |
| DELETE | `/api/admin/checklist-questions/:id` | Soft delete de pergunta | Admin |
| PATCH | `/api/admin/checklist-sections/reorder` | Reordena secoes | Admin |
| PATCH | `/api/admin/checklist-questions/reorder` | Reordena perguntas | Admin |
| GET | `/api/admin/checklists/dashboard` | Dashboard de conformidade | Admin |
| GET | `/api/admin/checklists/submissions` | Lista submissoes com filtros | Admin |
| GET | `/api/admin/checklists/submissions/:id` | Detalhes completos de submissao | Admin |

---

## 8. Surveys

### Consumo do usuario

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/surveys` | Lista surveys disponiveis ao usuario | Auth |
| GET | `/api/surveys/:id` | Retorna survey e metadados principais | Auth |
| GET | `/api/surveys/:id/questions` | Lista perguntas da survey | Auth |
| POST | `/api/surveys/:id/responses` | Submete respostas do usuario | Auth |
| GET | `/api/users/me/surveys/responses` | Lista respostas do usuario autenticado | Auth |

### Gestao administrativa

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/admin/surveys` | Lista surveys do tenant | Admin |
| GET | `/api/admin/surveys/:id` | Retorna survey para edicao | Admin |
| POST | `/api/admin/surveys` | Cria survey | Admin |
| PUT | `/api/admin/surveys/:id` | Atualiza survey | Admin |
| DELETE | `/api/admin/surveys/:id` | Soft delete de survey | Admin |
| GET | `/api/admin/surveys/:id/questions` | Lista perguntas da survey | Admin |
| POST | `/api/admin/surveys/:id/questions` | Cria pergunta | Admin |
| PUT | `/api/admin/survey-questions/:id` | Atualiza pergunta | Admin |
| DELETE | `/api/admin/survey-questions/:id` | Soft delete de pergunta | Admin |
| PATCH | `/api/admin/surveys/:id/questions/reorder` | Reordena perguntas | Admin |
| GET | `/api/admin/surveys/:id/responses` | Lista respostas consolidadas | Admin |
| GET | `/api/admin/surveys/:id/dashboard` | Dashboard e analytics da survey | Admin |

### Exemplo de payload - submit survey
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "value": 5
    },
    {
      "question_id": "uuid-2",
      "value": "Muito satisfeito"
    }
  ]
}
```

---

## 9. Storage e Uploads

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| POST | `/api/uploads/sign` | Gera URL assinada para upload generico | Auth/Admin |
| POST | `/api/uploads/public-url` | Resolve URL publica ou assinada para arquivo autorizado | Auth/Admin |
| DELETE | `/api/uploads` | Remove ou invalida arquivo controlado pela API | Admin |

Observacao:
- uploads de checklist e branding podem usar rotas especificas por dominio
- mesmo quando houver rota generica, o backend deve validar bucket, path e tenant

---

## 10. Super Admin

| Metodo | Rota | Descricao | Permissao |
| :--- | :--- | :--- | :--- |
| GET | `/api/super-admin/companies` | Lista empresas globais | Super Admin |
| GET | `/api/super-admin/companies/:id` | Detalhes de empresa | Super Admin |
| POST | `/api/super-admin/companies` | Cria empresa/tenant | Super Admin |
| PUT | `/api/super-admin/companies/:id` | Atualiza empresa/tenant | Super Admin |
| DELETE | `/api/super-admin/companies/:id` | Soft delete de empresa/tenant | Super Admin |
| POST | `/api/super-admin/companies/:id/provision-admin` | Provisiona admin inicial do tenant | Super Admin |
| GET | `/api/super-admin/overview` | Visao consolidada global | Super Admin |

---

## 11. Notas de Compatibilidade com o Frontend

1. O frontend deve migrar gradualmente de hooks/queries Supabase para `services` HTTP.
2. O contrato de retorno pode ser adaptado por endpoint, mas sempre dentro do envelope global.
3. Sempre que um fluxo atual do frontend depender de mais detalhes, o contrato deve ser expandido no backend antes da integracao.
4. O schema do banco e referencia de dados, nao contrato publico da API.

---

## Parecer Final
Este contrato cobre os modulos necessarios para o backend desacoplado:
- auth e sessao
- companies e settings
- users e estrutura
- repositories e contents
- metrics
- LMS
- checklists
- surveys
- storage
- super-admin

Ele deve ser usado como base de implementacao faseada, preservando:
- multi-tenant
- soft delete
- validacao com Zod
- contrato HTTP estavel
