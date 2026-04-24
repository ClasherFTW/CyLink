const { getOpenAIClient, getOpenAIModel } = require("../../config/openai");

const extractTextFromResponse = (response) => {
  if (response?.output_text) {
    return response.output_text;
  }

  const output = response?.output || [];
  const chunks = [];
  output.forEach((item) => {
    (item?.content || []).forEach((contentPart) => {
      if (contentPart?.type === "output_text" && contentPart?.text) {
        chunks.push(contentPart.text);
      }
    });
  });

  return chunks.join("\n").trim();
};

const generateAnswer = async ({ question, contextChunks = [] }) => {
  const client = getOpenAIClient();
  const model = getOpenAIModel();

  const contextText = contextChunks.length
    ? contextChunks
        .map((chunk, index) => `Context ${index + 1}:\n${chunk}`)
        .join("\n\n")
    : "No external context available.";

  if (!client) {
    return {
      answer:
        "AI response placeholder: set OPENAI_API_KEY to enable real LLM responses.",
      model: "mock-local",
      contextUsed: contextChunks.length,
    };
  }

  const response = await client.responses.create({
    model,
    temperature: 0.2,
    input: [
      {
        role: "system",
        content:
          "You are Citrus AI assistant. Provide concise, accurate, developer-friendly answers.",
      },
      {
        role: "user",
        content: `Question:\n${question}\n\nRetrieved Context:\n${contextText}`,
      },
    ],
  });

  const answer = extractTextFromResponse(response);

  return {
    answer,
    model: response.model || model,
    contextUsed: contextChunks.length,
  };
};

module.exports = {
  generateAnswer,
};
