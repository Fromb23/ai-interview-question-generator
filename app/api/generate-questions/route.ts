import OpenAI from "openai";
import { NextResponse } from "next/server";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

function sanitizeQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const rawJobTitle = typeof body.jobTitle === "string" ? body.jobTitle : "";
    const jobTitle = rawJobTitle.trim();

    if (!jobTitle) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 }
      );
    }

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: [
            "You are an expert hiring interviewer.",
            "Generate exactly 3 thoughtful interview questions for the provided job title or title-like input.",
            "If the input is ambiguous, unusual, whimsical, or not clearly a real job title, infer the closest plausible professional role and still produce grounded, practical interview questions.",
            "Do not produce nonsense, jokes, or fantasy scenarios.",
            "The questions should be specific to the inferred or stated role, practical, and useful for evaluating real job readiness.",
            "Do not ask for private personal information.",
            "Do not ask for names, phone numbers, addresses, resumes, government identifiers, dates of birth, or any other personal identifiers.",
            "Do not mention the inference process or add explanations outside the questions.",
            "Return only a JSON array of strings.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Job title: ${jobTitle}`,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { error: "The AI provider returned an empty response." },
        { status: 502 }
      );
    }

    let questions: string[];

    try {
      questions = sanitizeQuestions(JSON.parse(rawContent));
    } catch {
      questions = rawContent
        .split("\n")
        .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    return NextResponse.json({
      jobTitle,
      questions,
    });
  } catch (error) {
    console.error("Failed to generate questions:", error);

    return NextResponse.json(
      { error: "Failed to generate interview questions." },
      { status: 500 }
    );
  }
}
