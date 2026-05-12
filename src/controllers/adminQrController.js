const { execute, executeOne } = require('../config/database');
const { generateSecureToken, hashToken, isTokenExpired, isValidTokenFormat } = require('../utils/token');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { registerAuditLog } = require('../services/auditLogService');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')?.[0]?.trim() || req.ip || null;
}

function mapQrToken(token) {
  return {
    id: token.id,
    token_hint: token.token_hint,
    contexto: token.contexto,
    ativo: Boolean(token.ativo),
    expira_em: token.expira_em,
    max_uso: token.max_uso,
    uso_atual: token.uso_atual,
    ultimo_uso_em: token.ultimo_uso_em,
    criado_em: token.criado_em,
    desativado_em: token.desativado_em
  };
}

function describeTokenStatus(token) {
  if (!token) {
    return 'inexistente';
  }
  if (!token.ativo) {
    return 'desativado';
  }
  if (isTokenExpired(token.expira_em)) {
    return 'expirado';
  }
  if (Number(token.uso_atual) >= Number(token.max_uso)) {
    return 'limite_uso';
  }
  return 'valido';
}

async function generateQrToken(req, res, next) {
  try {
    const ttlMinutos = Number(req.body.ttlMinutos || 10);
    const maxUso = Number(req.body.maxUso || 1);
    const contexto = String(req.body.contexto || 'BATIDA_PONTO').trim().toUpperCase().slice(0, 40);

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const tokenHint = `${rawToken.slice(0, 6)}...${rawToken.slice(-4)}`;
    const expiraEm = new Date(Date.now() + ttlMinutos * 60 * 1000);

    const result = await execute(
      `INSERT INTO qr_tokens
       (token_hash, token_hint, contexto, ativo, expira_em, max_uso, uso_atual, criado_por_admin_id)
       VALUES (?, ?, ?, 1, ?, ?, 0, ?)`,
      [tokenHash, tokenHint, contexto, expiraEm, maxUso, req.auth.id]
    );

    await registerAuditLog({
      evento: 'qr_token_gerado',
      adminId: req.auth.id,
      mensagem: 'QR token gerado pelo administrador',
      ipOrigem: getClientIp(req),
      metadados: { token_hint: tokenHint, expira_em: expiraEm.toISOString(), max_uso: maxUso }
    });

    return res.status(201).json({
      success: true,
      data: {
        qrToken: {
          id: result.insertId,
          token: rawToken,
          token_hint: tokenHint,
          expira_em: expiraEm.toISOString(),
          max_uso: maxUso,
          contexto
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function listQrTokens(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const offset = (page - 1) * limit;

    const totalRow = await executeOne('SELECT COUNT(*) AS total FROM qr_tokens');
    const items = await execute(
      `SELECT id, token_hint, contexto, ativo, expira_em, max_uso, uso_atual, ultimo_uso_em, criado_em, desativado_em
       FROM qr_tokens
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        items: items.map(mapQrToken),
        pagination: {
          page,
          limit,
          total: Number(totalRow?.total || 0)
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function deactivateQrToken(req, res, next) {
  try {
    const tokenId = Number(req.params.id);
    const result = await execute('UPDATE qr_tokens SET ativo = 0, desativado_em = NOW() WHERE id = ?', [tokenId]);

    if (!result.affectedRows) {
      throw new NotFoundError('QR token nao encontrado');
    }

    await registerAuditLog({
      evento: 'qr_token_desativado',
      adminId: req.auth.id,
      mensagem: 'QR token desativado',
      ipOrigem: getClientIp(req),
      metadados: { token_id: tokenId }
    });

    return res.status(200).json({
      success: true,
      data: { id: tokenId, ativo: false }
    });
  } catch (error) {
    return next(error);
  }
}

async function validateQrToken(req, res, next) {
  try {
    const qrToken = String(req.body.qrToken || '').trim();
    if (!isValidTokenFormat(qrToken)) {
      throw new BadRequestError('QR token malformado');
    }

    const token = await executeOne(
      `SELECT id, token_hint, contexto, ativo, expira_em, max_uso, uso_atual, ultimo_uso_em, criado_em, desativado_em
       FROM qr_tokens WHERE token_hash = ? LIMIT 1`,
      [hashToken(qrToken)]
    );

    const status = describeTokenStatus(token);
    if (status !== 'valido') {
      await registerAuditLog({
        evento: 'tentativa_qr_invalido',
        nivel: 'WARN',
        adminId: req.auth.id,
        mensagem: 'Tentativa de validacao de QR token invalido',
        ipOrigem: getClientIp(req),
        metadados: { status, token_id: token?.id || null }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        valido: status === 'valido',
        status,
        qrToken: token ? mapQrToken(token) : null
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  generateQrToken,
  listQrTokens,
  deactivateQrToken,
  validateQrToken,
  describeTokenStatus
};
