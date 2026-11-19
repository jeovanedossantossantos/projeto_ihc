# MentorIA · Frontend

React + Vite, responsivo (mobile-first, com layout próprio a partir de 1024px), seguindo o protótipo de alta fidelidade,
o guia de estilos e as diretrizes de acessibilidade (WCAG 2.1 AA).

## Rodando

```bash
cd frontEnd
npm install
cp .env.example .env   # ajuste VITE_API_URL se a API não estiver em http://localhost:4000
npm run dev            # http://localhost:5173
```

A API (`backEnd`) e o MongoDB precisam estar rodando para login e cadastro.

## Telas

| Protótipo | Rota | Desktop |
|---|---|---|
| 01 Login / Cadastro | `/login`, `/cadastro` | duas colunas |
| 02 Home | `/` | resumo (estatísticas), agenda da semana, dica + Pomodoro |
| 03 Buscar mentores | `/mentores` | painel de filtros + grade/lista |
| 04 Perfil do mentor | `/mentores/:id` | |
| 05 Agendar mentoria | `/mentores/:id/agendar` (`?reagendar=` para reagendar) | |
| 06 Meus grupos | `/grupos`, `/grupos/novo` | |
| 07 Kanban do grupo | `/grupos/:id` (abas Tarefas, Arquivos, Chat, Calendário, Integrantes) | 4 colunas, arrastar e soltar |
| 08 Chat | `/chat`, `/chat/grupo/:id`, `/chat/mentor/:id` | lista + conversa lado a lado |
| Calendário | `/calendario` | |
| Perfil | `/perfil` | |
| Configurações · Acessibilidade | `/configuracoes/:secao` (conta, notificacoes, privacidade, acessibilidade, idioma) | |

## Design system

Os tokens do guia de estilos ficam no topo de [src/styles.css](src/styles.css) (paleta Indigo/Slate, cores de status,
raios 8/12/14/24, sombra padrão). Os tamanhos de fonte são em `rem`, então o controle de tamanho da fonte escala o app inteiro.

## Acessibilidade

Em **Configurações → Acessibilidade** (salvo automaticamente neste dispositivo):

- Tamanho da fonte (90%–150%), fonte (Inter, Atkinson Hyperlegible, OpenDyslexic) e espaçamento entre linhas.
- Tema claro, escuro ou alto contraste; cursor grande.
- Modo foco (esconde a barra lateral e as notificações), reduzir animações, Pomodoro integrado,
  narração das mensagens recebidas, linguagem calma, silenciar notificações, anonimato em avaliações.

Também: foco visível em todos os controles, link "Pular para o conteúdo", alvos de toque de pelo menos 44px,
status sempre com ícone + texto (não só cor), presença "Online agora / Offline", rótulos ARIA e `prefers-reduced-motion`.

## Dados

- **Autenticação** usa a API real: `POST /login`, `POST /register`, `GET /me` (token JWT no `localStorage`).
- **Mentores, agendamentos, grupos, tarefas e mensagens** ainda não têm rotas no backend. Ficam em
  `src/context/DataContext.jsx` (dados iniciais em `src/data/mock.js`) e são salvos no `localStorage`.
  As respostas no chat são simuladas. Em **Perfil → Restaurar dados de demonstração** tudo volta ao estado inicial.
