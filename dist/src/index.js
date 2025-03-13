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
Object.defineProperty(exports, "__esModule", { value: true });
const rag_1 = require("./rag");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const questions = [
            "What date did I remove the Hive Hugger from hive C7?",
            "What hives had eggs, larvae, and pupae (ELP) in May?",
            "Did I add supers to any colonies in May?"
        ];
        for (const question of questions) {
            console.log('\nQuestion:', question);
            const answer = yield (0, rag_1.getHiveNotes)(question);
            console.log('Answer:', answer);
            console.log('-'.repeat(80));
        }
    });
}
main().catch(console.error);
