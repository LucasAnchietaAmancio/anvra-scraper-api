const axios = require("axios");
const ScraperService = require("../ScraperService");
const AppError = require("../../shared/errors/AppError");
const dotenv = require("dotenv");

dotenv.config();
jest.mock("axios");

describe("ScraperService", () => {
    let sut;

    beforeEach(() => {
        sut = new ScraperService(axios, process.env.URL_API);
        jest.clearAllMocks();
    });

    test("Deve retornar um JSON válido ao consultar a API do Google Maps", async () => {
        axios.get.mockResolvedValue({
            data: {
                results: [{ name: "Empresa Teste" }]
            }
        });

        const output = await sut.getData({
            region: "-16.4708,-54.6350",
            query: "teste"
        });

        expect(output).toHaveProperty("results");
        expect(output.results[0].name).toBe("Empresa Teste");
    });

    test("Deve retornar AppError caso ScraperService não seja instanciado corretamente", () => {
        expect(() => new ScraperService()).toThrow(AppError);
    });

    test("Deve retornar AppError caso os dados obrigatórios não sejam fornecidos", async () => {
        await expect(sut.getData({})).rejects.toBeInstanceOf(AppError);
    });

    test("Deve lançar AppError quando o Google retornar error_message", async () => {
        axios.get.mockResolvedValue({
            data: {
                error_message: "Invalid API Key"
            }
        });

        await expect(
            sut.getData({
                region: "-16.4708,-54.6350",
                query: "teste"
            })
        ).rejects.toBeInstanceOf(AppError);
    });

    test("Deve lançar AppError quando axios lançar erro", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));

        await expect(
            sut.getData({
                region: "-16.4708,-54.6350",
                query: "teste"
            })
        ).rejects.toBeInstanceOf(AppError);
    });
});
