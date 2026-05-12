# Ponto Escolar - Backend Seguro

Backend Node.js/Express com foco em seguranca para controle de ponto institucional.

## Requisitos
- Node.js 20+
- MySQL/MariaDB

## Setup rapido
1. Instale dependencias:
```bash
npm install
```
2. Crie o arquivo de ambiente:
```bash
cp .env.example .env
```
3. Preencha a `.env` com valores reais e seguros.
4. Inicialize o banco a partir do `ponto.sql`:
```bash
npm run db:init
```
5. Crie o primeiro admin:
```bash
npm run admin:create -- --name=Administrador --email=admin@dominio.gov.br --password=SenhaForteCom32+Caracteres!
```
6. Inicie a API:
```bash
npm start
```

## Variaveis obrigatorias
- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `COMPANY_LATITUDE`
- `COMPANY_LONGITUDE`
- `ALLOWED_RADIUS_METERS`
- `CORS_ORIGIN`

## Rotas principais
Base: `/api`

### Publicas
- `POST /pontos/bater`
- `POST /admin/auth/login`
- `GET /health` (fora de `/api`)

### Privadas (JWT Bearer)
- `GET /admin/auth/me`
- `GET /admin/funcionarios`
- `POST /admin/funcionarios`
- `PATCH /admin/funcionarios/:id`
- `PATCH /admin/funcionarios/:id/status`
- `GET /admin/qr-tokens`
- `POST /admin/qr-tokens`
- `PATCH /admin/qr-tokens/:id/desativar`
- `POST /admin/qr-tokens/validar`
- `GET /admin/pontos/resumo`
- `GET /admin/pontos/hoje`
- `GET /admin/pontos/relatorio`

## Front-end conectado
- Login web: `/` ou `/index.html`
- Painel admin: `/admin/dashboard.html`
- O front consome a API no mesmo host (`/api`) e usa JWT em `Authorization: Bearer`.
- Sessao armazenada em `localStorage` e validada em cada pagina admin via `/api/admin/auth/me`.

## Seguranca implementada
- JWT para autenticacao admin.
- Senhas somente com hash `bcrypt`.
- `helmet` para headers de seguranca.
- `express-rate-limit` (global, login, rotas sensiveis e ponto).
- CORS restritivo por `CORS_ORIGIN`.
- Validacao/sanitizacao com `express-validator`.
- Queries parametrizadas com `mysql2`.
- Middleware global de erros (sem stack trace em producao).
- CPF mascarado nas respostas.
- Fluxo de QR token com aleatoriedade forte, hash, expiracao, desativacao e limite de uso.
- Registro de ponto com transacao + lock SQL + constraint unica (integridade concorrente).
- Auditoria de eventos criticos em `audit_logs`.

## Exemplo de login admin
`POST /api/admin/auth/login`
```json
{
  "email": "admin@dominio.gov.br",
  "senha": "SenhaForteCom32+Caracteres!"
}
```

## Exemplo de batida de ponto
`POST /api/pontos/bater`
```json
{
  "cpf": "12345678909",
  "qrToken": "64_caracteres_hexadecimais",
  "latitude": -23.55052,
  "longitude": -46.633308
}
```
