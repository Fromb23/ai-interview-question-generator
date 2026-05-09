"use client";

import { FormEvent, useState } from "react";

type GenerateQuestionsResponse = {
  jobTitle: string;
  questions: string[];
};

export default function Home() {
  const [jobTitle, setJobTitle] = useState("Customer Success Manager");
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedJobTitle = jobTitle.trim();

    if (!trimmedJobTitle) {
      setError("Please enter a job title.");
      setQuestions([]);
      return;
    }

    setIsLoading(true);
    setError("");
    setQuestions([]);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobTitle: trimmedJobTitle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const result = data as GenerateQuestionsResponse;
      setQuestions(result.questions);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate interview questions.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">
            AI Interview Assistant
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Generate better interview questions for any role.
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Enter a job title and the app will generate three thoughtful,
            role-specific interview questions using an AI API.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl"
        >
          <label
            htmlFor="jobTitle"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Job title
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Customer Success Manager"
              className="min-h-12 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="min-h-12 rounded-xl bg-cyan-400 px-5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Generating..." : "Generate questions"}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
        </form>

        <section className="space-y-4">
          {isLoading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-slate-300">
              Asking the AI provider for role-specific questions...
            </div>
          )}

          {!isLoading && questions.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-4 text-xl font-semibold">
                Interview questions
              </h2>

              <ol className="space-y-4">
                {questions.map((question, index) => (
                  <li
                    key={`${question}-${index}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-100"
                  >
                    <span className="mb-2 block text-sm font-semibold text-cyan-300">
                      Question {index + 1}
                    </span>
                    {question}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}