const axios = require("axios");
const ScraperService = require("../ScraperService");
const AppError = require("../../shared/errors/AppError");
const dotenv = require("dotenv");

dotenv.config();
jest.mock("axios");

describe("ScraperService", () => {
    let sut;

    const SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
    const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

    beforeEach(() => {
        sut = new ScraperService(axios, SEARCH_URL, DETAILS_URL);
        jest.clearAllMocks();
    });

    test("Deve lançar erro caso dependências não sejam informadas", () => {
        expect(() => new ScraperService()).toThrow(AppError);
    });

    test("Deve retornar uma lista de place_ids válida", async () => {
        axios.get.mockResolvedValue({
            data: {
                results: [
                    { place_id: "abc123" },
                    { place_id: "xyz789" }
                ]
            }
        });

        const output = await sut.getPlaceIdFromGoogle({
            region: "-16.47,-54.63",
            query: "transportadora"
        });

        expect(output).toEqual(["abc123", "xyz789"]);
    });

    test("Deve lançar AppError quando dados obrigatórios não forem fornecidos", async () => {
        await expect(
            sut.getPlaceIdFromGoogle({})
        ).rejects.toBeInstanceOf(AppError);
    });

    test("Deve lançar AppError quando o Google retornar error_message", async () => {
        axios.get.mockResolvedValue({
            data: {
                error_message: "Invalid API Key"
            }
        });

        await expect(
            sut.getPlaceIdFromGoogle({
                region: "-16.47,-54.63",
                query: "teste"
            })
        ).rejects.toBeInstanceOf(AppError);
    });

    test("Deve lançar AppError quando axios disparar erro", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));

        await expect(
            sut.getPlaceIdFromGoogle({
                region: "-16.47,-54.63",
                query: "teste"
            })
        ).rejects.toBeInstanceOf(AppError);
    });

    test("Deve retornar detalhes de empresas ao receber place_ids válidos", async () => {
        axios.get.mockResolvedValue({
            data: {
                result: { name: "Empresa Teste" }
            }
        });

        const output = await sut.getDetailCompany(["abc123"]);

        expect(output).toEqual([{ name: "Empresa Teste" }]);
    });

    test("Deve lançar AppError quando Google retornar error_message nos detalhes", async () => {
        axios.get.mockResolvedValue({
            data: {
                error_message: "Place ID inválido"
            }
        });

        await expect(
            sut.getDetailCompany(["abc123"])
        ).rejects.toBeInstanceOf(AppError);
    });

    test("Deve lançar AppError quando axios falhar nos detalhes", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));

        await expect(
            sut.getDetailCompany(["abc123"])
        ).rejects.toBeInstanceOf(AppError);
    });

    test("Deve executar o fluxo completo e retornar detalhes finais", async () => {
        axios.get
            .mockResolvedValueOnce({
                data: {
                    results: [{ place_id: "testeid123" }]
                }
            })

            .mockResolvedValueOnce({
                data: {
                    result: { name: "Empresa Completa" }
                }
            });

        const output = await sut.getFullDataFromGoogle({
            region: "-16.47,-54.63",
            query: "empresa"
        });

        expect(output).toEqual([{ name: "Empresa Completa" }]);
    });
});
