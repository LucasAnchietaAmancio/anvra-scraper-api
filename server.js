const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const ScraperService = require("./src/services/ScraperService");
const ScraperController = require("./src/controllers/ScraperController");
const scraperRoutes = require("./src/routes/ScraperRoutes");
const ErrorHandler = require("./src/middlewares/errors/ErrorHandler")

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 20
}));    

const http = axios.create({
    timeout: 8000
});

const scraperService = new ScraperService(
    http,
    process.env.GOOGLE_SEARCH_URL,
    process.env.GOOGLE_DETAILS_URL
);

const scraperController = new ScraperController(scraperService);

app.use("/api", scraperRoutes(scraperController));

app.use(ErrorHandler); 

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));