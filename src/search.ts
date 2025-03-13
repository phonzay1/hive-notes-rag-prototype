import { Pool } from 'pg';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

export interface SearchResult {
  date: string;
  time: string;
  weather: string;
  beekeepers: string;
  hive_id: 'C7' | 'B6' | 'D8' | 'A5';
  notes: string;
  similarity: number;
}

export async function searchSimilarNotes(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    const embedding = await generateEmbedding(query);
    
    const result = await pool.query<SearchResult>(
      `SELECT 
          date, time, weather, beekeepers, hive_id, notes,
          1 - (embedding <=> $1::vector) as similarity
        FROM hive_notes
        WHERE 1 - (embedding <=> $1::vector) > 0.3
        ORDER BY similarity DESC
        LIMIT $2`,
      [`[${embedding}]`, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

// async function search() {
//   let similarNotes = await searchSimilarNotes('What date did I clean the bottom board for hive C7?');
//   console.log('similar notes: ', similarNotes);
// }

// search();