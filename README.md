# StorePage_back

Base minima do novo backend desacoplado do frontend StorePage.

## Stack inicial
- Node.js + TypeScript
- Fastify
- Zod

## O que existe agora
- bootstrap HTTP
- rota `GET /`
- rota `GET /health`
- configuracao basica de build e desenvolvimento

## Dominios identificados no frontend atual
- autenticacao e sessao
- multi-tenant e empresas
- usuarios e convites provisionados
- repositorios e conteudos
- cursos, matriculas, quizzes e progresso
- checklists, respostas e planos de acao
- surveys e respostas
- storage de arquivos/imagens

## Observacao
Nada de dominio foi implementado aqui ainda. Esta pasta existe apenas como fundacao para receber o inventario e a extracao gradual das regras hoje acopladas ao frontend.
