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
- `SCHOOL_LATITUDE` (aceita fallback legado `COMPANY_LATITUDE`)
- `SCHOOL_LONGITUDE` (aceita fallback legado `COMPANY_LONGITUDE`)
- `ALLOWED_RADIUS_METERS`
- `CORS_ORIGIN`

## Variaveis opcionais de performance
- `DB_CONNECTION_LIMIT` (padrao: `10`): quantidade maxima de conexoes simultaneas no pool MySQL.
- `POINT_RATE_LIMIT_WINDOW_MS` (padrao: `300000`): janela do limite de requisicoes para bater ponto.
- `POINT_RATE_LIMIT_MAX` (padrao: `500`): maximo de tentativas de batida por janela no mesmo IP.
- `FUNCIONARIO_JWT_EXPIRES_IN` (padrao: `20m`): duracao da sessao criada apos login do funcionario via QR Code.
- `SCHOOL_UNIT_CODE` (padrao: `DEFAULT`): codigo da unidade/local usado para validar se o QR Code pertence ao ambiente correto.

Para bancos ja existentes, aplique a migracao em `docs/sql/2026-05-18-otimizar-registro-pontos.sql` para atualizar os indices da tabela de batidas.
Voce pode executar arquivos SQL do projeto com `npm run db:run -- --file=caminho/do/arquivo.sql`.

## Rotas principais
Base: `/api`

### Publicas
- `GET /ponto/acessar?qr_code=<codigo>` (entrada via QR Code para login do funcionario)
- `POST /pontos/validar-qr`
- `POST /pontos/login`
- `POST /pontos/registrar`
- `POST /admin/auth/login`
- `GET /health` (fora de `/api`)

### Privadas (JWT Bearer)
- `GET /admin/auth/me`
- `GET /admin/funcionarios`
- `POST /admin/funcionarios`
- `PATCH /admin/funcionarios/:id`
- `PATCH /admin/funcionarios/:id/status`
- `GET /admin/qr-tokens` (lista QR Codes gerados)
- `POST /admin/qr-tokens` (gera QR Code valido para bater ponto)
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
- QR Code persistido em banco, com hash seguro, validade e unidade/local.
- Login do funcionario com senha hash `bcrypt` apos QR Code valido.
- Registro de ponto com funcionario autenticado, transacao + lock SQL + constraint unica (integridade concorrente).
- Auditoria de eventos criticos em `audit_logs`.

## Fluxo QR Code + funcionario
- O admin gera um QR Code em `POST /api/admin/qr-tokens`.
- A resposta inclui `qrCode.url`, que aponta para `/ponto/acessar?qr_code=<codigo>`.
- O funcionario escaneia o QR Code, abre a tela de login e informa CPF/senha.
- O backend valida QR Code, funcionario, senha, status ativo, localizacao e duplicidade antes de salvar o ponto.

## Exemplo de login admin
`POST /api/admin/auth/login`
```json
{
  "email": "admin@dominio.gov.br",
  "senha": "SenhaForteCom32+Caracteres!"
}
```

## Exemplo de login do funcionario
`POST /api/pontos/login`
```json
{
  "cpf": "12345678909",
  "senha": "SenhaDoFuncionario",
  "qrCode": "64_caracteres_hexadecimais"
}
```

## Exemplo de batida de ponto
`POST /api/pontos/registrar`
```json
{
  "latitude": -23.55052,
  "longitude": -46.633308
}
```

## Link simples para funcionario
- Link do QR Code: `/ponto/acessar?qr_code=<codigo_valido>`
- `/ponto` e `/bater-ponto` redirecionam para a tela de acesso, mas sem QR valido o login fica bloqueado.
- A localizacao e capturada automaticamente no clique de registrar ponto.
