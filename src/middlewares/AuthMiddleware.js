const AppError = require("../shared/errors/AppError");

/**
 * Valida a presença e validade do token de autenticação 'Bearer' no header da requisição.
 * @param {object} res Objeto de resposta do Express.
 * @param {function} next Função para passar o controle ao próximo middleware/rota.
 * @throws {AppError} 401: AUTH_TOKEN_MISSING se o header estiver ausente.
 * @throws {AppError} 401: INVALID_AUTH_FORMAT se o formato não for 'Bearer <token>'.
 * @throws {AppError} 401: INVALID_AUTH_TOKEN se o token não corresponder à API_SECRET_KEY.
 */
module.exports = function AuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw AppError.customMessageError(
            "Token de autenticação não fornecido.",
            "AUTH_TOKEN_MISSING",
            "Acesso negado",
            401
        );
    };

    const parts = authHeader.split(" ");
    const type = parts[0];
    const token = parts[1];
    
    if (type !== "Bearer" || !token || parts.length !== 2) {
        throw AppError.customMessageError(
            "Formato do token inválido (esperado: Bearer <token>).",
            "INVALID_AUTH_FORMAT",
            "Acesso negado",
            401
        );
    };

    if (token !== process.env.API_SECRET_KEY) {
        throw AppError.customMessageError(
            "Token inválido ou não autorizado.",
            "INVALID_AUTH_TOKEN",
            "Acesso negado",
            401
        );
    };

    return next();
};