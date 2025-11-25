class AppError extends Error {
    
    /**
     * Construtor da classe AppError.
     * @param {string} message Mensagem de erro detalhada e legível (pode ser vista pelo cliente).
     * @param {string} code Código de erro único e programático (ex: 'DATA_MISSING', 'AUTH_TOKEN_MISSING').
     * @param {string} title Título curto e descritivo do tipo de erro.
     * @param {number} [status=500] Status HTTP a ser retornado (ex: 400, 401, 503).
     */
    constructor(message, code, title, status = 500) {
        super(message);
        this.code = code;
        this.title = title;
        this.status = status; 
    }

    /**
     * Cria uma instância de erro para dependências de inicialização não fornecidas.
     * @returns {AppError} Com status 500 (Erro interno de configuração).
     */
    static dependencyNotProvided() {
        return new AppError(
            "Alguma dependência obrigatória não foi fornecida.",
            "DEPENDENCY_NOT_PROVIDED",
            "Dependência não fornecida",
            500
        );
    }

    /**
     * @returns {AppError} Com status 400 (Bad Request).
     */
    static dataRequiredNotProvided() {
        return new AppError(
            "Algum parâmetro obrigatório não foi fornecido.",
            "DATA_MISSING",
            "Parâmetro não fornecido",
            400
        );
    }

    /**
     * Cria uma instância de erro customizada para casos específicos, permitindo definir 
     * @param {string} message Mensagem de erro detalhada.
     * @param {string} code Código de erro único.
     * @param {string} title Título do erro.
     * @param {number} [status=500] Status HTTP.
     * @returns {AppError} Instância AppError com os campos definidos.
     */
    static customMessageError(message, code, title, status = 500) {
        return new AppError(message, code, title, status);
    }
}

module.exports = AppError;