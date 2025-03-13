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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const instructor_1 = __importDefault(require("@instructor-ai/instructor"));
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
const { Pool } = pg_1.default;
dotenv_1.default.config();
const oai = new openai_1.default({
    apiKey: (_a = process.env.OPENAI_API_KEY) !== null && _a !== void 0 ? _a : undefined
});
// Patch the OpenAI client with Instructor
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
// Define a Zod schema for hive notes
const HiveNotesSchema = zod_1.z.object({
    date: zod_1.z.string()
        .refine(date => date.match(/[0-9]{1,2}\/[0-9]{1,2}/))
        .describe("The date the notes were taken"),
    time: zod_1.z.string()
        .describe("The time the notes were taken."),
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
// type AllNotesType = z.infer<typeof AllNotesSchema>
function extractHiveNotes(imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
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
                                "url": `${imageUrl}`,
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
        return hiveNotes.notes;
    });
}
function formatHiveNotes(hiveNotes, year) {
    return hiveNotes.map(notes => {
        let formattedDate = `${year}-` + notes.date
            .split(/[-\/]/)
            .map(str => str.padStart(2, '0'))
            .join('-');
        let timeParts = notes.time
            .split('')
            .filter(char => char !== ' ')
            .join('')
            .match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
        let formattedTime;
        if (!timeParts) {
            formattedTime = '00:00';
        }
        else {
            let [_, hours, minutes, period] = timeParts;
            minutes = minutes || "00";
            formattedTime = `${hours}:${minutes}${period}`;
        }
        return Object.assign(Object.assign({}, notes), { date: formattedDate, time: formattedTime });
    });
}
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
});
function loadEmbeddings(notes) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield pool.connect();
            for (const note of notes) {
                const response = yield oai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: note.notes
                });
                const embedding = response.data[0].embedding;
                const { date, time, weather, beekeepers, hiveID, notes } = note;
                yield pool.query(`INSERT INTO hive_notes (date, time, weather, beekeepers, hive_id, notes, embedding) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)`, [date, time, weather, beekeepers, hiveID, notes, JSON.stringify(embedding)]);
                console.log(`Stored embedding for hive notes: ${hiveID} on ${date}`);
            }
            console.log('All notes embedded and stored!');
        }
        catch (err) {
            console.log('Error loading embeddings: ', err);
        }
        finally {
            yield pool.end();
        }
    });
}
function embedNotes(imageUrls) {
    return __awaiter(this, void 0, void 0, function* () {
        const formattedNotes = [];
        for (const url of imageUrls) {
            let notes = yield extractHiveNotes(url);
            notes = formatHiveNotes(notes, 2024);
            formattedNotes.push(...notes);
        }
        loadEmbeddings(formattedNotes);
    });
}
const imageUrls = [
    'https://scontent.ffcm1-2.fna.fbcdn.net/v/t39.30808-6/476558274_10206656847645383_4378942074089609827_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=f727a1&_nc_ohc=8e0uZyVvNHIQ7kNvgGUEaCJ&_nc_oc=AdgBP4wuGFNASF1Zj9d1yNpI07_QWNXZiGqpKh7TP0WZkkKoRNnB3-iJ3_O9F_Z6AjU&_nc_zt=23&_nc_ht=scontent.ffcm1-2.fna&_nc_gid=A-c8IqiqxR85viU-AEFFygn&oh=00_AYGT6sPq7mzHDl2OOmyd6jSfhKpadN_27PSxBQVU2Qx3QA&oe=67D90CE2',
    'https://scontent.ffcm1-1.fna.fbcdn.net/v/t39.30808-6/476491434_10206656847805387_6260275775482067479_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=f727a1&_nc_ohc=p9FRMW67pwIQ7kNvgFnEUux&_nc_oc=AdgJjNoLwtOOD4ugheESI1XaW0_Sq4qtQSfGcaB11KXOs_cTC_A4ROxnr-ljqSqbROg&_nc_zt=23&_nc_ht=scontent.ffcm1-1.fna&_nc_gid=A-c8IqiqxR85viU-AEFFygn&oh=00_AYEwThD587m2Ab7DzjtvhSxjTILp0i1YJ3rlrgzXzSEC7Q&oe=67D8EE77',
    'https://scontent.ffcm1-1.fna.fbcdn.net/v/t39.30808-6/476496993_10206656848125395_3731222860249201027_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=f727a1&_nc_ohc=OVjM6naXd7sQ7kNvgGOe5UN&_nc_oc=AdhCeCrvbxC4sB8jVmI36goa8c8eMrzab1RNBPnqkQkN891KYa-6z455weJM2wdSFpo&_nc_zt=23&_nc_ht=scontent.ffcm1-1.fna&_nc_gid=A-c8IqiqxR85viU-AEFFygn&oh=00_AYGQKSzZhiJ83uvvVAxuI05q0j8YdTdS5fp0UxRjU5lj5g&oe=67D90C51',
    'https://scontent.ffcm1-1.fna.fbcdn.net/v/t39.30808-6/476485249_10206656847365376_1933134807792501505_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=f727a1&_nc_ohc=oke1sGlWS8AQ7kNvgF8GvJw&_nc_oc=Adj1AgTfCcqVeCrfErNtHCRjE0_nvbZVBs_K6TTawjV05giUOu4wImE7W_fDxUX4Gzg&_nc_zt=23&_nc_ht=scontent.ffcm1-1.fna&_nc_gid=A-c8IqiqxR85viU-AEFFygn&oh=00_AYGw8sX6HHwoP5OthQbKSTioN5N_zBmgkqZcpTjs7cZGVw&oe=67D8EE34',
];
embedNotes(imageUrls);
