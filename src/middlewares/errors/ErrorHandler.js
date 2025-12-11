const AppError = require("../../shared/errors/AppError");

/**
 * Middleware de manipulação de erro no Express. Deve ser o último middleware registrado na aplicação.
 * @param {object} req Objeto de requisição do Express.
 * @param {object} res Objeto de resposta do Express.
 * @param {function} next Função para passar o controle (normalmente não usada no ErrorHandler final).
 */
module.exports = (err, req, res, next) => {
    
    if (err instanceof AppError) {
        return res.status(err.status).json({
            success: false,
            error: {
                message: err.message,
                code: err.code,
                title: err.title,
                status: err.status
            }
        });
    }
    
    return res.status(500).json({
        success: false,
        error: {
            message: "Ocorreu um erro interno inesperado no servidor.",
            code: "INTERNAL_SERVER_ERROR",
            title: "Erro de Servidor"
        }
    });
};