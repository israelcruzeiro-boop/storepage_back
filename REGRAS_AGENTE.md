# Regras do Projeto - StorePage_back

## Contexto
- **App**: StorePage_back - backend desacoplado da plataforma StorePage.
- **Objetivo**: concentrar autenticacao, autorizacao, regras de negocio, acesso a banco e integracao com storage.
- **Stack atual**: Node.js, TypeScript, Fastify e Zod.
- **Base de referencia**: `C:\Users\israe\Downloads\db_queries_inventory.md` e o projeto `C:\Users\israe\Downloads\StorePage`.
- **Restricao de escopo**: o projeto `StorePage` pode ser consultado, mas nao deve ser alterado neste fluxo.

## Regras de Estrutura - Obrigatorias
- **Bootstrap**: `src/app.ts` e `src/server.ts`.
- **Rotas**: ficam em `src/routes/`.
- **Dominios**: devem evoluir em `src/modules/`.
- **Servicos de negocio**: ficam em `src/services/`.
- **Acesso a dados**: fica em `src/repositories/`.
- **Validacao**: fica em `src/schemas/`.
- **Tipos compartilhados**: ficam em `src/types/`.
- **Infraestrutura transversal**: fica em `src/lib/`, `src/plugins/` e `src/config/`.
- **SQL e apoio tecnico**: podem ficar em `sql/` ou `docs/` quando fizer sentido.

## Regras de Codigo
- **TypeScript**: obrigatorio. Evitar `any`.
- **Validacao**: toda entrada externa deve passar por Zod.
- **Separacao de camadas**: rota nao contem regra de negocio pesada; servico nao contem parsing HTTP; repositorio nao contem regra de autorizacao.
- **Logs**: evitar `console.log` em codigo final. Preferir logger estruturado.
- **Contratos**: respostas HTTP devem ser consistentes e pequenas, com campos explicitos.

## Regras de Dados e Seguranca
- **API First**: o frontend nunca deve falar direto com banco ou storage.
- **Tenant Isolation**: toda operacao deve validar `company_id` no backend.
- **Autorizacao**: role e ownership devem ser verificados no servidor.
- **Soft Delete**: preferir `deleted_at` nas entidades de negocio.
- **Selects explicitos**: evitar `select *` em consultas produtivas.
- **Credenciais**: nunca expor chaves privilegiadas ao client.
- **RPCs legadas**: devem ser absorvidas como servicos/endpoints internos do backend.

## Regras de Banco
- **Schema**: qualquer mudanca estrutural deve ser registrada como SQL revisavel.
- **Execucao manual**: nao executar mudancas de schema em banco real sem alinhamento explicito.
- **Compatibilidade**: considerar o schema atual do Supabase como referencia, nao como contrato definitivo da API.

## Comportamento do Agente - Inegociaveis
- **Idioma**: responder em Portugues BR. Codigo e comentarios podem permanecer em Ingles.
- **Minimalismo com direcao**: criar a menor estrutura necessaria, mas sem sacrificar a arquitetura.
- **Seguranca primeiro**: em caso de duvida, priorizar isolamento, validacao e contratos claros.
- **Transparencia**: explicar quando uma decisao afetar contrato, schema ou integracao com o frontend.
- **Consulta cruzada**: quando necessario, consultar o `StorePage` para entender comportamento esperado, sem editar arquivos la.
- **Documentacao viva**: se surgir nova regra importante de dominio ou arquitetura, refletir isso nos arquivos-guia do backend.
