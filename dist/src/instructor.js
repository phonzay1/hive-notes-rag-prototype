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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const instructor_1 = __importDefault(require("@instructor-ai/instructor"));
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
require('dotenv').config();
// 1. Create an OpenAI client
const oai = new openai_1.default({
    apiKey: (_a = process.env.OPENAI_API_KEY) !== null && _a !== void 0 ? _a : undefined,
    organization: (_b = process.env.OPENAI_ORG_ID) !== null && _b !== void 0 ? _b : undefined,
});
// 2. Patch the OpenAI client with Instructor
// Setting mode to "FUNCTIONS" so we get function-based output
const client = (0, instructor_1.default)({
    client: oai,
    mode: "FUNCTIONS",
});
const notesDescription = `
  Notes on the hive. Common abbreviations may include:
  'Q' for queen;
  'QS' for queen seen;
  'QNS' for queen not seen;
  'QSM_' for queen seen marked (W-white, Y=yellow, R-red, G-green, B-blue);
  'ELP' for eggs, larvae, pupae;
  'PMS' for phoretic mite seen;
  'fr' for frame;
  'excl' for excluder;

  If you see a symbol that resembles '@', assume it is the letter 'Q' instead, 
  as the notes will never contain the '@' symbol.

  Common unusual terms may include:
  Hive Hugger

  If a letter is circled beside a line of text, then appears later beside another
  hive on the same date with two vertical lines in front of it, that means that
  note also applies to the second hive for that day's notes.
`;
// 3. Define a Zod schema for user info
const HiveNotesSchema = zod_1.z.object({
    date: zod_1.z.string()
        .refine(date => date.match(/[0-9]{1,2}\/[0-9]{1,2}/))
        .describe("The date the notes were taken"),
    time: zod_1.z.string()
        .describe("The time the notes were taken"),
    weather: zod_1.z.string()
        .describe("Weather notes such as temperature, sunny, cloudy, etc"),
    beekeepers: zod_1.z.string()
        .describe(`The name(s) of the beekeeper(s). Usually abbreviated as 'beeks'. 
      Ping is common here`),
    hiveID: zod_1.z.string()
        .refine(id => ['C7', 'B6', 'D8', 'A5'].includes(id), "Hive ID should be one of: 'C7', 'B6', 'D8', 'A5'")
        .describe("The hive ID"),
    notes: zod_1.z.string()
        .describe(notesDescription),
});
const AllNotesSchema = zod_1.z.object({
    notes: zod_1.z.array(HiveNotesSchema)
        .describe("An array of hive notes. Each array element represents notes for a different hive on a specific date.")
});
// async function extractHiveNotes() {
//   // 4. Prompt the model with some user input
//   const hiveNotes = await client.chat.completions.create({
//     model: "gpt-4o",
//     messages: [
//       {
//         role: "user",
//         content: `3/11
// 3:15 pm, ~65°F, partly cloudy
// Beeks: Ping
// 07 - lots of bees flying! Bringing in pollen!
// gave ~0.5 lb pollen patty
// decent-sized loose cluster in top box (1/2), front side
// 4:30 - at least 1.5+ full frames honey
// bees consuming pollen patty
// 3/21
// 5 pm, ~45°F, sunny
// Beeks: Ping
// 07 - still some pollen patty left, gave another small one
// bees loosely clustered, filling ~7-8 [frames] in top box`,
//       },
//     ],
//     // Use our Zod schema for extraction
//     response_model: { 
//         schema: HiveNotesSchema,
//         name: "Hive Notes",
//     },
//     max_retries: 3,
//   });
//   console.log("Hive Notes object returned by the LLM + Instructor:");
//   console.log(hiveNotes);
// }
function extractHiveNotes() {
    return __awaiter(this, void 0, void 0, function* () {
        // 4. Prompt the model with some user input
        const hiveNotes = yield client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: `Please transcribe this photo into hive notes. 
            There may be multiple hives for each date, and/or multiple dates per
            photo. The date, time, weather notes, and beekeeper(s) will generally
            only be written once, at the top, for each date, but these details
            apply to all of the hive notes listed below that date until a new
            date is written. Please transcribe the notes for each hive into its 
            own separate hive notes object, and return all objects in an array.
            If a letter is circled beside a line of text, then appears later beside 
            another hive on the same date with two vertical lines in front of it
            (looks like || or 11), that means that text applies to both hives 
            for that day's notes. For each letter preceded by two vertical 
            lines, please replicate the text in the notes for
            that hive.` },
                        {
                            type: "image_url",
                            image_url: {
                                "url": "https://scontent-ord5-3.xx.fbcdn.net/v/t39.30808-6/476485249_10206656847365376_1933134807792501505_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=f727a1&_nc_ohc=AM0eDESTg_UQ7kNvgHA47Pl&_nc_zt=23&_nc_ht=scontent-ord5-3.xx&_nc_gid=AOfMoKT-LWn4P0rylSKfD3T&oh=00_AYC4IDQwXHo7GVWewzhuDp2k_dbgIUliyaXOrvGxAt7p7w&oe=67A7EE74",
                            },
                        },
                    ]
                },
            ],
            // Use our Zod schema for extraction
            response_model: {
                schema: AllNotesSchema,
                name: "Hive Notes",
            },
            max_retries: 3,
        });
        console.log("Hive Notes object returned by the LLM + Instructor:");
        console.log(hiveNotes);
    });
}
extractHiveNotes();
