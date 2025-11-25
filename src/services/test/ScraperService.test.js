const axios = require("axios");
const ScraperService = require("../ScraperService");
const AppError = require("../../shared/errors/AppError");
const dotenv = require("dotenv");

dotenv.config();
jest.mock("axios");

describe("ScraperService", () => {
    let sut;

    const originalApiKey = process.env.GOOGLE_API_KEY; 

    beforeEach(() => {

        process.env.GOOGLE_API_KEY = originalApiKey || 'FAKE_API_KEY'; 
        sut = new ScraperService(axios, process.env.GOOGLE_SEARCH_URL, process.env.GOOGLE_DETAILS_URL);
        jest.clearAllMocks();
    });

    afterEach(() => {

        process.env.GOOGLE_API_KEY = originalApiKey;
    });

    test("Deve lançar erro caso dependências não sejam informadas", () => {
        expect(() => new ScraperService()).toThrow(AppError);
    });

    test("Deve lançar AppError se GOOGLE_API_KEY não estiver configurada", () => {
        delete process.env.GOOGLE_API_KEY;
        expect(() => 
            new ScraperService(axios, "search", "details")
        ).toThrow(
            expect.objectContaining({
                code: "ENV_NOT_CONFIGURED",
                status: 500
            })
        );
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

    test("Deve lançar AppError quando o Google retornar error_message (getPlaceId)", async () => {
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
        ).rejects.toEqual(
            expect.objectContaining({
                code: "GOOGLE_API_ERROR",
                status: 400
            })
        );
    });


    test("Deve lançar AppError (503) quando axios disparar erro (getPlaceId)", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));

        await expect(
            sut.getPlaceIdFromGoogle({
                region: "-16.47,-54.63",
                query: "teste"
            })
        ).rejects.toEqual(
            expect.objectContaining({
                code: "EXTERNAL_API_CALL_FAILED",
                status: 503
            })
        );
    });


    test("Deve retornar detalhes de empresas ao receber place_ids válidos (Promise.all)", async () => {

        axios.get
            .mockResolvedValueOnce({ data: { result: { name: "Empresa Teste 1" } } })
            .mockResolvedValueOnce({ data: { result: { name: "Empresa Teste 2" } } });
            
        const placeIds = ["abc123", "xyz789"];
        const output = await sut.getDetailCompany(placeIds);

        expect(output).toHaveLength(2);
        expect(output).toEqual([
            { name: "Empresa Teste 1" }, 
            { name: "Empresa Teste 2" }
        ]);

        expect(axios.get).toHaveBeenCalledTimes(2); 
    });

    test("Deve lançar AppError quando Google retornar error_message nos detalhes", async () => {

        axios.get.mockResolvedValueOnce({
            data: {
                error_message: "Place ID inválido"
            }
        });


        
        await expect(
            sut.getDetailCompany(["abc123", "xyz789"])
        ).rejects.toEqual(
            expect.objectContaining({
                code: "GOOGLE_API_ERROR",
                status: 400
            })
        );
    });

    test("Deve lançar AppError (503) quando axios falhar nos detalhes", async () => {

        axios.get.mockRejectedValue(new Error("Network Error"));

        await expect(
            sut.getDetailCompany(["abc123"])
        ).rejects.toEqual(
            expect.objectContaining({
                code: "EXTERNAL_API_CALL_FAILED",
                status: 503
            })
        );
    });

    test("Deve executar o fluxo completo e retornar detalhes finais", async () => {

        axios.get
            .mockResolvedValueOnce({
                data: {
                    results: [{ place_id: "testeid1" }, { place_id: "testeid2" }]
                }
            })

            .mockResolvedValueOnce({
                data: {
                    result: { name: "Empresa Completa 1" }
                }
            })
            
            .mockResolvedValueOnce({
                data: {
                    result: { name: "Empresa Completa 2" }
                }
            });

        const output = await sut.getFullDataFromGoogle({
            region: "-16.47,-54.63",
            query: "empresa"
        });

        expect(axios.get).toHaveBeenCalledTimes(3); 
        expect(output).toHaveLength(2);
        expect(output).toEqual([
            { name: "Empresa Completa 1" },
            { name: "Empresa Completa 2" }
        ]);
    });
});