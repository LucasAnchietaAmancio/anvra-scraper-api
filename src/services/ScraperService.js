const AppError = require("../shared/errors/AppError");

class ScraperService {

    /**
     * @param {import("axios").AxiosInstance} axios Instância HTTP injetada para comunicação externa (DIP).
     * @param {string} searchUrl URL da API para buscar place_ids.
     * @param {string} detailsUrl URL da API para buscar detalhes de empresas.
     * @throws {AppError} Caso alguma dependência não seja fornecida.
     * @throws {AppError} Caso a variável de ambiente GOOGLE_API_KEY não esteja configurada.
     */
    constructor(axios, searchUrl, detailsUrl) {
        
        if (!axios || !searchUrl || !detailsUrl) {
            throw AppError.dependencyNotProvided();
        }

        if (!process.env.GOOGLE_API_KEY) {
            throw AppError.customMessageError(
                "Chave GOOGLE_API_KEY não configurada.",
                "ENV_NOT_CONFIGURED",
                "Erro interno no servidor",
                500
            );
        }

        this.http = axios;
        this.searchUrl = searchUrl;
        this.detailsUrl = detailsUrl;
    }
    
    /**
     * @private
     * Auxiliar para extrair a mensagem de erro da resposta do Axios ou do Google.
     * @param {any} error Objeto de erro (Axios ou genérico).
     * @returns {string} Mensagem de erro.
     */
    _extractErrorMessage(error) {
        return error?.response?.data?.error_message || error.message;
    }

    /**
     * Busca todos os place_ids que correspondem à pesquisa no Google Maps.
     * @param {string} params.region Latitude e longitude no formato: "-16.4,-54.6".
     * @param {string} params.query Termo pesquisado: "empresa logística", "transportadora", etc.
     * @param {string} params.nextpagetoken Token de paginação: "'AZLasHq4iSvR4tUF4...'"
     * @returns {Promise<string[]>} Lista de place_ids.
     * @throws {AppError} Caso dados obrigatórios não sejam fornecidos (400).
     * @throws {AppError} Caso a API do Google retorne erro de negócio (400).
     * @throws {AppError} Caso haja falha de comunicação ou infraestrutura (503).
     */
    async getPlaceIdFromGoogle({ region, query, nextpagetoken }) {
        if (!region || !query) {
            throw AppError.dataRequiredNotProvided();
        }

        try {
            const params = nextpagetoken ? {pagetoken: nextpagetoken, key: process.env.GOOGLE_API_KEY} : {query, location:region, key: process.env.GOOGLE_API_KEY}

            const response = await this.http.get(this.searchUrl, {
                params
            });
            
            const data = response.data;

            if (data.error_message) {
                throw AppError.customMessageError(
                    data.error_message,
                    "GOOGLE_API_ERROR",
                    "Erro na consulta Google Maps",
                    400 
                );
            }

            return {
                placeID:response.data.results.map((item) => item.place_id),
                nextPage: response.data.next_page_token
            } 

        } catch (error) {
            const msg = this._extractErrorMessage(error);

            throw AppError.customMessageError(
                msg,
                "EXTERNAL_API_CALL_FAILED",
                "Erro na consulta Google Maps",
                503 
            );
        }
    }

    /**
     * Retorna detalhes completos para uma lista de place_ids, executando as requisições em paralelo.
     * @param {string[]} placeIds Lista de IDs retornados pelo Google (máximo 20 por chamada).
     * @returns {Promise<object[]>} Detalhes completos das empresas (array de objetos JSON).
     * @throws {AppError} Caso o Google retorne erro de negócio para algum ID específico (400).
     * @throws {AppError} Caso haja falha de comunicação ou infraestrutura no bloco Promise.all (503).
     */
    async getDetailCompany(placeIds,nextPage) {
        try {
            const detailPromises = placeIds.map(place_id => 
                this.http.get(this.detailsUrl, {
                    params: {
                        place_id,
                        key: process.env.GOOGLE_API_KEY,
                        fields:"name,formatted_address,place_id,type,formatted_phone_number,website,rating,user_ratings_total"
                    }
                })
            );

            const responses = await Promise.all(detailPromises);
            
            const detailsList = responses.map((response, index) => {
                const place_id = placeIds[index];
                
                if (response.data?.error_message) {
                    throw AppError.customMessageError(
                        response.data.error_message,
                        "GOOGLE_API_ERROR",
                        `Erro ao buscar detalhes do place_id: ${place_id}`,
                        400
                    );
                }
                return response.data.result
            });

            return {
                    next_page:nextPage,
                    results:detailsList,
                };

        } catch (error) {
            const msg = this._extractErrorMessage(error);
            
            throw AppError.customMessageError(
                msg,
                "EXTERNAL_API_CALL_FAILED",
                "Erro ao buscar detalhes das empresas",
                503
            );
        }
    }
    
    /**
     * Realiza a busca completa por empresa
     * @param {string} params.region Latitude e longitude.
     * @param {string} params.query Termo de busca.
     * @returns {Promise<object[]>} Lista detalhada de empresas em JSON.
     */
    async getFullDataFromGoogle({ region, query, nextpagetoken }) {

        const { placeID, nextPage } = await this.getPlaceIdFromGoogle({ region, query, nextpagetoken });

        const details = await this.getDetailCompany(placeID, nextPage);

        return details;
    }
}

module.exports = ScraperService;