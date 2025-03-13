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
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = new pg_1.Pool({
            user: process.env.PG_USER,
            host: process.env.PG_HOST,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port: Number(process.env.PG_PORT),
        });
        try {
            yield pool.connect();
            // Enable the vector extension
            yield pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
            // Create table for hive notes
            yield pool.query(`
      CREATE TABLE IF NOT EXISTS hive_notes (
        id SERIAL PRIMARY KEY,
        date date,
        time time,
        weather varchar(200),
        beekeepers varchar(200),
        hive_id varchar(10),
        notes text,
        embedding vector(1536)
      );
    `);
            console.log('Database setup complete!');
        }
        catch (err) {
            console.error('Error setting up database:', err);
        }
        finally {
            yield pool.end();
        }
    });
}
setup();
