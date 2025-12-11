const AppError = require("../shared/errors/AppError");

class ScraperController {

    /**
     * @param {import("../services/ScraperService")} scraperService Instancia do service injetada (DIP)
     * @throws {AppError} Caso alguma dependência não seja fornecida
     */
    constructor(scraperService) {

        if (!scraperService) throw AppError.dependencyNotProvided();

        this.scraperService = scraperService;

        this.getDataFromSearch = this.getDataFromSearch.bind(this);
    }

    /**
     * Endpoint POST /search
     * Busca dados de empresas no Google Maps através do ScraperService.
     * @param {object} req.body Corpo da requisição
     * @param {string} req.body.region Região (Latitude,Longitude) para a busca.
     * @param {string} req.body.query Termo de busca.
     * @param {object} res Objeto de resposta do Express
     */
    async getDataFromSearch(req, res) { 
        const { region, query, nextpagetoken } = req.query;

        if (!region || !query) {
            throw AppError.dataRequiredNotProvided();
        }

        const data = await this.scraperService.getFullDataFromGoogle({
            region,
            query,
            nextpagetoken,
        });

        return res.status(200).json({
            success: true,
            total: data.results.length,
            data
        });
    }
}

module.exports = ScraperController;