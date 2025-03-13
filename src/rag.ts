import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { searchSimilarNotes } from './search';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function getHiveNotes(question: string): Promise<string> {
  try {
    const searchResults = await searchSimilarNotes(question, 5);
    
    if (searchResults.length === 0) {
      return "I couldn't find any relevant hive notes to answer your question.";
    }
    
    // Format context from search results
    const context = searchResults
      .map(({date, time, weather, beekeepers, hive_id, notes, similarity}) => 
        `- date: ${date} | time: ${time} | weather: ${weather} | beekeepers: ` +
        `${beekeepers} | hive ID: ${hive_id} | notes: ${notes} ` +
        `(Similarity: ${similarity.toFixed(2)})`)
      .join('\n');

    // console.log('context: ', context);
    
    return getResponse(question, context);
  } catch (error) {
    console.error('Error in RAG:', error);
    throw error;
  }
}

async function getResponse(question: string, context: string) {
  const prompt = `You are a helpful assistant helping beekeepers find information
    in their notes about their honey bee hives. Use these relevant beekeeping notes
    to inform your answer: ${context}. The user asked for help with this question
    specifically: ${question}`;
  
  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    return completion.content[0].type === 'text' ? 
      completion.content[0].text : 'No answer found';
  } catch {
    const completion = await openai.chat.completions.create({
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
}