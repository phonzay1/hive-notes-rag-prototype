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
exports.getHiveNotes = getHiveNotes;
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const search_1 = require("./search");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY
});
function getHiveNotes(question) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const searchResults = yield (0, search_1.searchSimilarNotes)(question, 5);
            if (searchResults.length === 0) {
                return "I couldn't find any relevant hive notes to answer your question.";
            }
            // Format context from search results
            const context = searchResults
                .map(({ date, time, weather, beekeepers, hive_id, notes, similarity }) => `- date: ${date} | time: ${time} | weather: ${weather} | beekeepers: ` +
                `${beekeepers} | hive ID: ${hive_id} | notes: ${notes} ` +
                `(Similarity: ${similarity.toFixed(2)})`)
                .join('\n');
            // console.log('context: ', context);
            return getResponse(question, context);
        }
        catch (error) {
            console.error('Error in RAG:', error);
            throw error;
        }
    });
}
function getResponse(question, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const prompt = `You are a helpful assistant helping beekeepers find information
    in their notes about their honey bee hives. Use these relevant beekeeping notes
    to inform your answer: ${context}. The user asked for help with this question
    specifically: ${question}`;
        try {
            const completion = yield anthropic.messages.create({
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }],
            });
            return completion.content[0].type === 'text' ?
                completion.content[0].text : 'No answer found';
        }
        catch (_a) {
            const completion = yield openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });
            return completion.choices[0].message.content || 'No answer found';
        }
    });
}
