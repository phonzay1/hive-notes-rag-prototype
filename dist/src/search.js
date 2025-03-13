"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSimilarNotes = searchSimilarNotes;
const pg_1 = require("pg");
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
const pool = new pg_1.Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
});
function searchSimilarNotes(query_1) {
    return __awaiter(this, arguments, void 0, function* (query, limit = 5) {
        try {
            const embedding = yield generateEmbedding(query);
            const result = yield pool.query(`SELECT 
          date, time, weather, beekeepers, hive_id, notes,
          1 - (embedding <=> $1::vector) as similarity
        FROM hive_notes
        WHERE 1 - (embedding <=> $1::vector) > 0.3
        ORDER BY similarity DESC
        LIMIT $2`, [`[${embedding}]`, limit]);
            return result.rows;
        }
        catch (error) {
            console.error('Error searching notes:', error);
            throw error;
        }
    });
}
function generateEmbedding(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });
        return response.data[0].embedding;
    });
}
// async function search() {
//   let similarNotes = await searchSimilarNotes('What date did I clean the bottom board for hive C7?');
//   console.log('similar notes: ', similarNotes);
// }
// search();
