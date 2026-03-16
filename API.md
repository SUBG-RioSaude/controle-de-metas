# Controle de Progresso — Plano de Ação

## API Documentation

**Base URL:** `http://localhost:5100`
**Swagger UI:** `http://localhost:5100/swagger`
**Versão:** v1

---

## Índice

1. [Arquitetura Geral](#1-arquitetura-geral)
2. [Autenticação](#2-autenticação)
3. [Modos de Operação (PRODUCTION flag)](#3-modos-de-operação)
4. [Roles e Permissões](#4-roles-e-permissões)
5. [Modelo de Dados](#5-modelo-de-dados)
6. [Formato de Resposta](#6-formato-de-resposta)
7. [Endpoints — Auth](#7-endpoints--auth)
8. [Endpoints — Users](#8-endpoints--users)
9. [Endpoints — Temas](#9-endpoints--temas)
10. [Endpoints — Tópicos](#10-endpoints--tópicos)
11. [Endpoints — Metas](#11-endpoints--metas)
12. [Endpoints — Stats](#12-endpoints--stats)
13. [WebSockets / SignalR](#13-websockets--signalr)
14. [Fluxo Completo de Autenticação](#14-fluxo-completo-de-autenticação)
15. [Variáveis de Ambiente](#15-variáveis-de-ambiente)

---

## 1. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next)                    │
│                                                             │
│  1. Google Sign-In SDK  →  ID Token                        │
│  2. POST /auth/google   →  JWT                              │
│  3. Bearer <JWT>        →  todos os outros endpoints        │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP + WebSocket
┌───────────────────────────────▼─────────────────────────────┐
│                    ControleAcao.Api (.NET 9)                 │
│                                                             │
│  Controllers  →  Application Services  →  Repositories      │
│  SignalR Hubs                                               │
│  JWT Middleware  /  PendingUser Middleware                   │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│             PostgreSQL — schema: controle_acao               │
│                                                             │
│  users  │  temas  │  topicos  │  pontos_focais  │  metas    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Autenticação

A API utiliza exclusivamente **Google OAuth2** com fluxo de **ID Token** (frontend-first).
Não existe autenticação por e-mail/senha.

### Fluxo detalhado

```
Frontend                      Google                    Backend
   │                             │                          │
   │  1. Clica "Login Google"    │                          │
   │ ─────────────────────────► │                          │
   │                             │                          │
   │  2. credential (ID Token)   │                          │
   │ ◄───────────────────────── │                          │
   │                             │                          │
   │  3. POST /auth/google                                  │
   │     { "idToken": "eyJ..." } │                          │
   │ ───────────────────────────────────────────────────► │
   │                             │                          │
   │                             │  4. Valida token         │
   │                             │ ◄──────────────────────  │
   │                             │  GoogleJsonWebSignature  │
   │                             │ ───────────────────────► │
   │                             │                          │
   │                             │  5. Cria/atualiza user   │
   │                             │     no PostgreSQL        │
   │                             │                          │
   │  6. { token, userId,        │                          │
   │       name, email,          │                          │
   │       picture, role }       │                          │
   │ ◄─────────────────────────────────────────────────── │
   │                             │                          │
   │  7. Salva JWT               │                          │
   │     localStorage/cookie     │                          │
```

### Usando o JWT

Após o login, inclua o JWT em todas as requisições:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O token é válido por **7 dias** e contém as claims:

| Claim | Valor |
|---|---|
| `nameidentifier` | UUID do usuário |
| `email` | E-mail do usuário |
| `name` | Nome completo |
| `role` | Role atual |
| `picture` | URL da foto |

### Configuração no Google Cloud Console

| Campo | Valor |
|---|---|
| Authorized JavaScript origins | `http://localhost:3000` (URL do frontend) |
| Authorized redirect URIs | `http://localhost:3000` |
| **NÃO configurar** | ~~`http://localhost:5100/auth/google`~~ |

> O endpoint `/auth/google` é uma API REST normal — **não** é um redirect URI OAuth.

---

## 3. Modos de Operação

Controlado pela variável `PRODUCTION` no `.env`:

| `PRODUCTION` | Comportamento |
|---|---|
| `TRUE` (padrão) | JWT obrigatório, roles validadas, PendingUser bloqueado |
| `FALSE` | **Auth desativada** — todos requests entram como Admin automaticamente |

```env
# .env
PRODUCTION=FALSE   # desenvolvimento
PRODUCTION=TRUE    # produção
```

> Em modo `PRODUCTION=FALSE` o Swagger não exige Bearer token.

---

## 4. Roles e Permissões

### Hierarquia de Roles

```
Admin
  └── Aprovador
        └── Analista
              └── Visualizador
                    └── Pending  (acesso bloqueado)
```

### Tabela de permissões por endpoint

| Endpoint | Pending | Visualizador | Analista | Aprovador | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `POST /auth/google` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /users/me` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `GET /users` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `PATCH /users/{id}/role` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /temas` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /temas` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /topicos` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /topicos` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /metas` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `POST /metas` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PATCH /metas/{id}/status` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `POST /metas/{id}/approve` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `POST /metas/{id}/return` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `DELETE /metas/{id}` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /stats/*` | ❌ | ✅ | ✅ | ✅ | ✅ |

### Fluxo de aprovação de acesso (role Pending)

```
Novo usuário faz login
        │
        ▼
  Role = Pending
  Acesso bloqueado (403)
  Tela: "Aguardando aprovação"
        │
        │  Admin acessa GET /users
        │  Admin chama PATCH /users/{id}/role
        │  { "role": "Analista" }
        │
        ▼
  SignalR: UserRoleChanged → frontend
  Frontend atualiza role automaticamente
  Usuário obtém acesso
```

---

## 5. Modelo de Dados

### Hierarquia

```
Tema
├── id: UUID
├── nome: string
└── Topicos[]
    ├── id: UUID
    ├── temaId: UUID
    ├── descricao: string
    ├── setorResponsavel: string
    ├── PontosFocais[]: string[]  (texto livre)
    └── Metas[]
        ├── id: UUID
        ├── topicoId: UUID
        ├── descricao: string
        ├── status: MetaStatus
        ├── documentUrl?: string
        └── approverComment?: string
```

### MetaStatus

| Valor | Descrição |
|---|---|
| `NaoIniciada` | Meta criada, ainda não iniciada |
| `EmAndamento` | Meta em execução |
| `PendenteAprovacao` | Aguardando aprovação do Aprovador |
| `Concluido` | Aprovada e concluída |
| `AguardandoRetorno` | Devolvida para revisão |

### Fluxo de status de uma Meta

```
NaoIniciada
    │
    ▼
EmAndamento
    │
    ▼
PendenteAprovacao
    │
    ├── Aprovador aprova  →  Concluido ✅
    │
    └── Aprovador devolve →  AguardandoRetorno
                                   │
                                   └── Analista corrige → EmAndamento
```

---

## 6. Formato de Resposta

Todos os endpoints retornam o mesmo envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Em caso de erro:

```json
{
  "success": false,
  "data": null,
  "error": "Mensagem de erro legível"
}
```

---

## 7. Endpoints — Auth

### `POST /auth/google`

Autentica com Google ID Token e retorna JWT.

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "João Silva",
    "email": "joao@example.com",
    "picture": "https://lh3.googleusercontent.com/...",
    "role": "Pending"
  },
  "error": null
}
```

**Response 401:**
```json
{
  "success": false,
  "data": null,
  "error": "Token inválido ou expirado."
}
```

---

## 8. Endpoints — Users

### `GET /users/me`
Retorna dados do usuário autenticado.

### `GET /users` *(Admin)*
Lista todos os usuários.

### `PATCH /users/{id}/role` *(Admin)*

**Request:**
```json
{ "role": "Analista" }
```

Após a alteração, o usuário recebe notificação SignalR `UserRoleChanged`.

---

## 9. Endpoints — Temas

### `GET /temas`
Retorna todos os temas com tópicos e metas aninhados.

### `GET /temas/{id}`
Retorna um tema específico completo.

### `POST /temas` *(Admin)*
```json
{ "nome": "Gestão das Contratações (Estratégico)" }
```

### `PATCH /temas/{id}` *(Admin)*
```json
{ "nome": "Novo nome do tema" }
```

### `DELETE /temas/{id}` *(Admin)*
Remove o tema e todos seus tópicos e metas (cascade).

---

## 10. Endpoints — Tópicos

### `GET /topicos`
Lista todos os tópicos com pontos focais e metas.

### `GET /topicos/{id}`
Retorna um tópico com setor, pontos focais e metas.

### `POST /topicos` *(Admin)*
```json
{
  "temaId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "descricao": "Promover medidas que reduzam as contratações emergenciais...",
  "setorResponsavel": "Secretaria de Licitações e Contratos",
  "pontosFocais": ["João Silva", "Maria Souza"]
}
```

### `PATCH /topicos/{id}` *(Admin)*
```json
{
  "descricao": null,
  "setorResponsavel": "Nova Secretaria",
  "pontosFocais": ["Carlos Ferreira"]
}
```
> Campos `null` são ignorados. `pontosFocais` substitui a lista inteira quando informado.

### `DELETE /topicos/{id}` *(Admin)*
Remove o tópico e todas suas metas.

---

## 11. Endpoints — Metas

### `GET /metas`
Lista todas as metas.

### `GET /metas/{id}`
Retorna uma meta específica.

### `POST /metas` *(Analista+)*
```json
{
  "topicoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "descricao": "Diminuição dos valores empenhados das contratações emergenciais..."
}
```

### `PATCH /metas/{id}/status` *(Analista+)*
```json
{ "status": "EmAndamento" }
```

### `PATCH /metas/{id}/document` *(Analista+)*
```json
{ "documentUrl": "https://drive.google.com/..." }
```

### `POST /metas/{id}/approve` *(Aprovador+)*
```json
{ "comment": "Meta concluída conforme critérios estabelecidos." }
```

### `POST /metas/{id}/return` *(Aprovador+)*
```json
{ "comment": "Documentação insuficiente. Favor anexar relatório atualizado." }
```

### `DELETE /metas/{id}` *(Admin)*

---

## 12. Endpoints — Stats

### `GET /stats/overview`

```json
{
  "success": true,
  "data": {
    "totalMetas": 42,
    "percentualConcluidas": 61.9,
    "naoIniciadas": 8,
    "emAndamento": 10,
    "pendentesAprovacao": 2,
    "concluidas": 26,
    "aguardandoRetorno": 4
  }
}
```

### `GET /stats/por-tema`

```json
{
  "success": true,
  "data": [
    {
      "temaId": "3fa85f64-...",
      "temaName": "Gestão das Contratações (Estratégico)",
      "totalMetas": 10,
      "concluidas": 7,
      "percentualConcluidas": 70.0
    }
  ]
}
```

---

## 13. WebSockets / SignalR

**Hub URL:** `ws://localhost:5100/hubs/role`

**Autenticação:** Passe o JWT via query string:
```
ws://localhost:5100/hubs/role?access_token=eyJ...
```

### Eventos emitidos pelo servidor

| Evento | Quando | Payload |
|---|---|---|
| `UserRoleChanged` | Admin altera role de um usuário | `{ userId, newRole }` |
| `StepStatusChanged` | Status de uma meta é alterado | `{ metaId, status }` |
| `StepApproved` | Meta é aprovada | `{ metaId }` |
| `StepReturned` | Meta é devolvida para revisão | `{ metaId, comment }` |

### Exemplo de conexão (JavaScript)

```javascript
import * as signalR from "@microsoft/signalr"

const token = localStorage.getItem("token")

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5100/hubs/role", {
    accessTokenFactory: () => token
  })
  .withAutomaticReconnect()
  .build()

connection.on("UserRoleChanged", ({ userId, newRole }) => {
  console.log(`Role alterada: ${newRole}`)
  // Forçar re-login ou refresh do token
})

connection.on("StepStatusChanged", ({ metaId, status }) => {
  console.log(`Meta ${metaId}: ${status}`)
  // Atualizar UI
})

await connection.start()
```

---

## 14. Fluxo Completo de Autenticação

### Primeiro acesso (novo usuário)

```
1. Usuário clica "Entrar com Google"
2. Google retorna ID Token
3. Frontend: POST /auth/google { idToken }
4. Backend: valida token no Google
5. Usuário não existe → cria com role=Pending
6. Backend retorna JWT com role=Pending
7. Frontend detecta role=Pending → exibe tela "Aguardando aprovação"
8. Admin recebe notificação → acessa GET /users → vê novo usuário
9. Admin: PATCH /users/{id}/role { role: "Analista" }
10. SignalR emite UserRoleChanged para o cliente do usuário
11. Frontend recebe evento → re-faz GET /users/me → obtém nova role
12. Usuário obtém acesso ao sistema
```

### Login recorrente (usuário existente)

```
1. Usuário clica "Entrar com Google"
2. Google retorna ID Token
3. Frontend: POST /auth/google { idToken }
4. Backend: valida token, encontra usuário, atualiza foto/nome
5. Backend retorna JWT com role atual
6. Frontend armazena token e redireciona conforme role
```

### Refresh de token

O JWT expira em 7 dias. Estratégia recomendada:
- Armazenar a data de expiração no frontend
- Antes de expirar, re-executar o fluxo de login silencioso do Google
- Enviar novo ID Token para `/auth/google`

---

## 15. Variáveis de Ambiente

```env
# Google OAuth2
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# JWT
JWT_SECRET=chave_secreta_longa_e_segura_minimo_32_caracteres

# Banco de dados (Npgsql connection string)
DATABASE_URL=Host=postgres-develop.rio.rj.gov.br;Port=5432;Username=admin;Password=senha;Database=controle_metas

# Modo de operação
PRODUCTION=TRUE   # FALSE para desativar auth em desenvolvimento
```
