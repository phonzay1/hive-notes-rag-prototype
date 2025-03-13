const OpenAI = require("openai");
require("dotenv").config();

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    const response = await oai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello!" }],
    });
    console.log(response);
  } catch (err) {
    console.error(err);
  }
}

testOpenAI();
