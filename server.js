const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const ScraperService = require("./src/services/ScraperService");

const scraperService = new ScraperService(
    axios,
    process.env.GOOGLE_SEARCH_URL,
    process.env.GOOGLE_DETAILS_URL
);

(async () => {
    const data = await scraperService.getFullDataFromGoogle({
        region: "-16.4708,-54.6350",
        query: "Loja de tintas"
    });

    console.log(JSON.stringify(data, null, 2));
})();
