const AppError = require("../shared/errors/AppError");

/**
 * Serviço responsável por toda a comunicação com a API do Google.
 * 
 * Princípios aplicados:
 * - SRP: Classe faz apenas scraping.
 * - DIP: axios, urls e configs são injetados.
 * - Clean Code: nomes claros, validações explícitas.
 */
class ScraperService {

    /**
     * @param {import("axios").AxiosInstance} axios Instância HTTP injetada (DIP)
     * @param {string} searchUrl URL da API para buscar place_ids
     * @param {string} detailsUrl URL da API para buscar detalhes de empresas
     * 
     * @throws {AppError} Caso alguma dependência não seja fornecida
     */
    constructor(axios, searchUrl, detailsUrl) {
        if (!axios || !searchUrl || !detailsUrl) {
            throw AppError.dependencyNotProvided();
        }

        if (!process.env.GOOGLE_API_KEY) {
            throw AppError.customMessageError(
                "Chave GOOGLE_API_KEY não configurada.",
                "ENV_NOT_CONFIGURED",
                "Erro interno no servidor"
            );
        }

        this.http = axios;
        this.searchUrl = searchUrl;
        this.detailsUrl = detailsUrl;
    }

    /**
     * Busca todos os place_ids que correspondem à pesquisa no Google Maps.
     * 
     * @param {{ region: string, query: string }} params Região + termo buscado
     * @param {string} params.region Latitude e longitude no formato: "-16.4,-54.6"
     * @param {string} params.query Termo pesquisado: "empresa logística", "transportadora", etc.
     * 
     * @returns {Promise<string[]>} Lista de place_ids
     * 
     * @throws {AppError} Caso dados obrigatórios não sejam fornecidos
     * @throws {AppError} Caso a API do Google retorne erro
     */
    async getPlaceIdFromGoogle({ region, query }) {
        if (!region || !query) {
            throw AppError.dataRequiredNotProvided();
        }

        try {
            const response = await this.http.get(this.searchUrl, {
                params: {
                    query,
                    location: region,
                    key: process.env.GOOGLE_API_KEY
                }
            });

            const data = response.data;

            if (data.error_message) {
                throw AppError.customMessageError(
                    data.error_message,
                    "GOOGLE_API_ERROR",
                    "Erro na consulta Google Maps"
                );
            }

            return data.results.map((item) => item.place_id);

        } catch (error) {
            const msg = error?.response?.data?.error_message || error.message;

            throw AppError.customMessageError(
                msg,
                "INTERNAL_ERROR",
                "Erro na consulta Google Maps"
            );
        }
    }

    /**
     * Retorna detalhes completos de cada empresa encontrada.
     * 
     * @param {string[]} placeIds Lista de IDs retornados pelo Google
     * 
     * @returns {Promise<object[]>} Detalhes completos das empresas
     * 
     * @throws {AppError} Caso o Google retorne erro ao buscar algum ID
     */
    async getDetailCompany(placeIds) {
        try {
            const detailsList = [];

            for (const place_id of placeIds) {
                const response = await this.http.get(this.detailsUrl, {
                    params: {
                        place_id,
                        key: process.env.GOOGLE_API_KEY
                    }
                });

                if (response.data?.error_message) {
                    throw AppError.customMessageError(
                        response.data.error_message,
                        "GOOGLE_API_ERROR",
                        `Erro ao buscar detalhes do place_id: ${place_id}`
                    );
                }

                detailsList.push(response.data.result);
            }

            return detailsList;

        } catch (error) {
            const msg = error?.response?.data?.error_message || error.message;

            throw AppError.customMessageError(
                msg,
                "INTERNAL_ERROR",
                "Erro ao buscar detalhes das empresas"
            );
        }
    }
    
    /**
     * 
     * @param {{ region: string, query: string }} params
     * 
     * @returns {Promise<object[]>} Lista detalhada de empresas em JSON
     */
    async getFullDataFromGoogle({ region, query }) {
        const placeIds = await this.getPlaceIdFromGoogle({ region, query });

        const details = await this.getDetailCompany(placeIds);

        return details;
    }
}

module.exports = ScraperService;
