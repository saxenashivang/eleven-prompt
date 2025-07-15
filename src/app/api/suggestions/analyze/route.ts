import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

interface Suggestion {
  id: string;
  type: "clarity" | "specificity" | "tone" | "structure" | "enhancement";
  title: string;
  description: string;
  replacement?: string;
  addition?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 🔒 Replace with your extension origin in prod
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const { text, platform } = await request.json();

    if (!text) {
      return new NextResponse(
        JSON.stringify({ error: "Text is required for analysis" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const hasSubscription = !!subscription;

    const suggestions = generateSuggestions(
      text,
      platform || "unknown",
      hasSubscription,
    );

    return new NextResponse(
      JSON.stringify({
        suggestions,
        hasSubscription,
        platform: platform || "unknown",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Suggestions analysis error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

function generateSuggestions(
  text: string,
  platform: string,
  hasSubscription: boolean,
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const textLength = text.length;
  const words = text.split(" ");
  const lowerText = text.toLowerCase();

  // Basic suggestions
  if (text.includes("thing") || text.includes("stuff")) {
    suggestions.push({
      id: "clarity-1",
      type: "clarity",
      title: "Be more specific",
      description:
        'Replace vague terms like "thing" or "stuff" with specific nouns',
      replacement: text.replace(/\b(thing|stuff)\b/gi, "specific item"),
    });
  }

  if (textLength < 20) {
    suggestions.push({
      id: "specificity-1",
      type: "specificity",
      title: "Add more context",
      description:
        "Provide more details to help the AI understand your request better",
      addition: " Please provide a detailed explanation with examples.",
    });
  }

  if (
    words.length > 1 &&
    !text.endsWith(".") &&
    !text.endsWith("?") &&
    !text.endsWith("!")
  ) {
    suggestions.push({
      id: "structure-2",
      type: "structure",
      title: "Add punctuation",
      description: "Proper punctuation helps AI understand sentence boundaries",
      replacement: text + ".",
    });
  }

  // Premium features
  if (hasSubscription) {
    if (platform === "chatgpt") {
      if (!lowerText.includes("step by step") && textLength > 50) {
        suggestions.push({
          id: "structure-1",
          type: "structure",
          title: "Request step-by-step format",
          description: "ChatGPT works well with structured requests",
          replacement: text + " Please provide a step-by-step explanation.",
        });
      }
    }

    if (platform === "claude") {
      if (!lowerText.includes("think") && textLength > 30) {
        suggestions.push({
          id: "enhancement-1",
          type: "enhancement",
          title: "Encourage reasoning",
          description: "Claude responds well to prompts that ask for reasoning",
          replacement: "Think carefully about this: " + text,
        });
      }
    }

    if (platform === "gemini") {
      if (!lowerText.includes("explain") && textLength > 40) {
        suggestions.push({
          id: "enhancement-2",
          type: "enhancement",
          title: "Request detailed explanation",
          description: "Gemini excels at providing detailed explanations",
          addition: " Please explain this in detail with relevant examples.",
        });
      }
    }

    if (text.includes("!") || text.toUpperCase() === text) {
      suggestions.push({
        id: "tone-1",
        type: "tone",
        title: "Soften tone",
        description: "A more conversational tone often yields better results",
        replacement: text.replace(/!/g, ".").toLowerCase(),
      });
    }

    if (textLength > 100) {
      if (!lowerText.includes("format") && !lowerText.includes("structure")) {
        suggestions.push({
          id: "enhancement-3",
          type: "enhancement",
          title: "Specify output format",
          description: "Requesting a specific format improves response quality",
          addition: " Please format your response as a numbered list.",
        });
      }
    }

    if (
      textLength > 50 &&
      !lowerText.includes("context") &&
      !lowerText.includes("background")
    ) {
      suggestions.push({
        id: "enhancement-4",
        type: "enhancement",
        title: "Add context",
        description: "Providing context helps AI give more relevant responses",
        addition:
          " Please consider the context and provide relevant background information.",
      });
    }
  } else {
    if (suggestions.length > 2) {
      suggestions.push({
        id: "upgrade-prompt",
        type: "enhancement",
        title: "🔒 Unlock Premium Suggestions",
        description:
          "Get advanced AI prompt enhancements and platform-specific optimizations",
      });
    }
  }

  return suggestions.slice(0, hasSubscription ? 8 : 3);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
