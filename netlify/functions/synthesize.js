const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ok: false,
        error: "Method not allowed. Use POST."
      })
    };
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ok: false,
          error: "ANTHROPIC_API_KEY is not configured."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ok: false,
          error: "Missing prompt."
        })
      };
    }

    if (prompt.length > 50000) {
      return {
        statusCode: 413,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ok: false,
          error: "Prompt too large."
        })
      };
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

    const message = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const result = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        ok: true,
        result,
        model,
        source: "anthropic"
      })
    };
  } catch (error) {
    console.error("synthesize error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ok: false,
        error: "Synthesis failed."
      })
    };
  }
};
