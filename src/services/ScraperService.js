const AppError = require("../shared/errors/AppError");

class ScraperService {
    
    constructor(axios, baseURL) {
        if (!axios || !baseURL) {
            throw AppError.dependencyNotProvided();
        }

        if (!process.env.GOOGLE_API_KEY) {
            throw AppError.customMessageError(
                "Chave GOOGLE_API_KEY não configurada.",
                "ENV_NOT_CONFIGURED",
                "Erro interno no servidor"
            );
        }
        this.baseURL = baseURL;
        this.axios = axios;
    }

    /**
     * @typedef {Object} GoogleMapsResponse
     * @property {Array} results
     * @property {string} [error_message]
     */
    /**
     * Consulta a API do Google Maps.
     * @param {{region:string, query:string}} params
     * @returns {Promise<GoogleMapsResponse>}
     */
    async getData({ region, query }) {
        if (!region || !query) {
            throw AppError.dataRequiredNotProvided();
        }

        try {
            const response = await this.axios.get(this.baseURL, {
                params: {
                    query,
                    location: region,
                    key: process.env.GOOGLE_API_KEY
                }
            });

            const data = response.data;

            if (data?.error_message) {
                throw AppError.customMessageError(
                    data.error_message,
                    "GOOGLE_API_ERROR",
                    "Erro na consulta Google Maps"
                );
            }

            return data;

        } catch (error) {
            const message = error?.response?.data?.error_message || error.message;

            throw AppError.customMessageError(
                message,
                "INTERNAL_ERROR",
                "Erro na consulta Google Maps"
            );
        }
    }
}

module.exports = ScraperService;
