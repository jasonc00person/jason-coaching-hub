import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    // Call OpenAI with the messages
    const result = streamText({
      model: openai("gpt-4o", { apiKey }),
      messages: messages || [],
      maxSteps: 10,
    });

    // Return in UI Message Stream format for useChatRuntime
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return new Response(error.message || "Internal server error", {
      status: 500,
    });
  }
}
