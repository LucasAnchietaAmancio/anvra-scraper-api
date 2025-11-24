

class AppError extends Error {
    constructor(message, code, title){
        super(message)
        this.code = code
        this.title = title
    };

    static dependencyNotProvided() {
        return new AppError(
            "Alguma dependência obrigatória não foi fornecida.",
            "DEPENDENCY_NOT_PROVIDED",
            "Dependencia não fornecida"
        );
    };

    static dataRequiredNotProvided() {
        return new AppError(
            "Algum parâmetro obrigatório não foi fornecido.",
            "DATA_REQUIRED_NOT_PROVIDED",
            "Parâmetro não fornecido"
        );
    };

    static customMessageError(message, code, title){
        return new AppError(
            message,
            code,
            title
        );
    };
};

module.exports = AppError