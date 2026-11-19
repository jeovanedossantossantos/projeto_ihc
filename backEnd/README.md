# MentorIA · Backend (protótipo)

API REST + Socket.IO em **Node.js (Express) + MongoDB (Mongoose)**, baseada no diagrama
*Fluxos de Usuário — MentorIA*: Fluxo 1 (buscar e agendar mentoria), Fluxo 2 (grupo + Kanban + entrega)
e as 5 abas (Início, Mentores, Grupos, Chat, Perfil).

## Rodar

```bash
Opcional: docker compose up -d       # MongoDB (ou use um Mongo local / Atlas e ajuste MONGO_URI)
npm install
cp .env.example .env
npm run seed                # dados de exemplo (apaga as coleções!)
npm run dev                 # http://localhost:3000
```

Logins do seed (senha `123456`): alunos `joao@`, `maria@`, `pedro@`, `lia@mentoria.dev`; mentores `ana@`, `bruno@`, `carla@mentoria.dev`.

Todas as rotas (exceto `/auth/register` e `/auth/login`) exigem `Authorization: Bearer <token>`.

## Mapa do fluxo → endpoints

### Fluxo 1 · Buscar e agendar mentoria
| Etapa do diagrama                   | Endpoint                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Login                               | `POST /api/auth/login` · `POST /api/auth/register`                         |
| Home / Dashboard                    | `GET /api/home`                                                            |
| Filtrar por chip                    | `GET /api/subjects` → `GET /api/mentors?subject=calculo`                   |
| Buscar matéria (barra)              | `GET /api/mentors?search=calc`                                             |
| Lista de mentores (por nota)        | `GET /api/mentors` (ordenada por `ratingAvg`)                              |
| Perfil do mentor / avaliações       | `GET /api/mentors/:id`                                                     |
| Agendar: data + horário             | `GET /api/mentors/:id/availability?date=YYYY-MM-DD` → `POST /api/bookings` |
| Minhas mentorias                    | `GET /api/bookings?upcoming=true` · `PATCH /api/bookings/:id/cancel`       |
| (mentor) concluir / (aluno) avaliar | `PATCH /api/bookings/:id/complete` · `POST /api/mentors/:id/reviews`       |

### Fluxo 2 · Grupo e trabalho acadêmico
| Etapa do diagrama                               | Endpoint                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Meus grupos                                     | `GET /api/groups` (com % de progresso)                                                                 |
| Criar grupo (nome, matéria, prazo, integrantes) | `POST /api/groups`                                                                                     |
| Adicionar (convites)                            | `POST /api/groups/:id/invites` · `GET /api/groups/invites/me` · `POST /api/groups/:id/invites/respond` |
| Kanban (A fazer / Fazendo / Feito)              | `GET /api/groups/:id/tasks`                                                                            |
| Criar tarefas (responsável + prazo)             | `POST /api/groups/:id/tasks`                                                                           |
| Mover / editar tarefa                           | `PATCH /api/groups/:id/tasks/:taskId` (`status: todo\|doing\|done`)                                    |
| Chat do grupo                                   | `GET/POST /api/chat/conversations/:id/messages` (o `conversationId` vem em `GET /api/groups/:id`)      |
| Acompanhar (% progresso, notificações)          | `GET /api/groups/:id` · `GET /api/notifications`                                                       |
| ENTREGA                                         | `POST /api/groups/:id/deliver`                                                                         |

### Demais abas
- **Chat**: `GET /api/chat/conversations`, `POST /api/chat/conversations {userId}` (1:1), `POST /api/uploads` (anexos, campo `file`).
- **Perfil**: `GET /api/auth/me`, `PATCH /api/users/me`, `PATCH /api/users/me/privacy`, `PATCH /api/users/me/password`, `GET /api/users/me/history`, `GET /api/users/me/progress`, `PATCH /api/users/me/mentor-profile` (mentor).
- **Notificações**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.

### Tempo real (Socket.IO)
```js
const socket = io('http://localhost:3000', { auth: { token } });
socket.on('message:new', (msg) => {});        // novas mensagens das suas conversas
socket.on('notification:new', (n) => {});     // convites, tarefas, mentorias...
```

## Exemplo rápido (Fluxo 1)
```bash
TOKEN=$(curl -s localhost:3000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"joao@mentoria.dev","password":"123456"}' | jq -r .token)
curl -s "localhost:3000/api/mentors?search=calculo" -H "Authorization: Bearer $TOKEN"
curl -s "localhost:3000/api/mentors/<MENTOR_ID>/availability?date=2026-11-23" -H "Authorization: Bearer $TOKEN"
curl -s localhost:3000/api/bookings -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"mentorId":"<MENTOR_ID>","subjectId":"<SUBJECT_ID>","startsAt":"<slot.startsAt>"}'
```

## Decisões do protótipo
- **Horários**: o mentor define disponibilidade semanal; os *slots* livres são calculados (disponibilidade − agendamentos − passado) no fuso `TZ_OFFSET_MINUTES` (padrão `-180`). Um índice único parcial impede reserva dupla.
- **Progresso do grupo** = tarefas `done` / total, calculado por agregação (sem campo redundante).
- **Convites por e-mail** funcionam mesmo para quem ainda não tem conta (vinculados no cadastro).
- **Uploads** ficam em `/uploads` no disco e são servidos publicamente por URL.

## Fora do escopo (próximos passos)
Testes automatizados, refresh token / recuperação de senha, rate limit, storage em nuvem (S3) com URLs assinadas, lembretes de prazo (cron), chamadas de áudio/vídeo (o diagrama cita "chamadas" no Chat), indicador de mensagens não lidas, e o "IA" do MentorIA (ex.: recomendação de mentores).


MongoDB conectado: mentoria
Seed ok. Login com qualquer e-mail abaixo, senha 123456:
  alunos : joao@ maria@ pedro@ lia@ mentoria.dev
  mentores: ana@ bruno@ carla@ mentoria.dev