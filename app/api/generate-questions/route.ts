import OpenAI from "openai";
import { NextResponse } from "next/server";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export async function POST(request: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const jobTitle = body.jobTitle?.trim();

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
            "Generate exactly 3 thoughtful interview questions for the provided job title.",
            "The questions should be specific to the role, practical, and useful for evaluating real job readiness.",
            "Do not ask for private personal information.",
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
      questions = JSON.parse(rawContent);
    } catch {
      questions = rawContent
        .split("\n")
        .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
        .filter(Boolean);
    }

    return NextResponse.json({
      jobTitle,
      questions: questions.slice(0, 3),
    });
  } catch (error) {
    console.error("Failed to generate questions:", error);

    return NextResponse.json(
      { error: "Failed to generate interview questions." },
      { status: 500 }
    );
  }
}