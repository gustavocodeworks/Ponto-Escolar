# 04 - Seguranca do QR Token

## O que foi implementado

- Geracao de token forte com crypto.randomBytes.
- Armazenamento no banco apenas do hash SHA-256 do token.
- Expiracao obrigatoria por data e hora.
- Flags de ativacao/desativacao.
- Controle de max_uso e uso_atual para reduzir reutilizacao indevida.
- Endpoint de validacao com retorno de status (valido, expirado, desativado, limite_uso, inexistente).
- Auditoria para tentativas invalidas.

## Arquivos principais

- src/controllers/adminQrController.js
- src/utils/token.js
- ponto.sql

## Tabela de suporte

- qr_tokens
