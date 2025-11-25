const { Router } = require("express");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

/**
 * Configura as rotas e injeta o Middleware de autenticação.
 * @param {import('../controllers/ScraperController')} scraperController Instância do Controller responsável por executar a lógica das rotas.
 * @returns {Router} Retorna um objeto Router do Express com as rotas configuradas.
 * @throws {Error} Se o scraperController não for fornecido.
 */
module.exports = function scraperRoutes(scraperController) {
    if (!scraperController) {
        throw new Error("scraperController não foi fornecido.");
    }

    const router = Router();

    router.use(AuthMiddleware);

    /**
     * @route POST /search
     * @description Busca empresas no Google Maps com base na região e query fornecidas.
     */
    router.post("/search", scraperController.getDataFromSearch);

    return router;
};