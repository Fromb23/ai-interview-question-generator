"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type GenerateQuestionsResponse = {
  error?: string;
  jobTitle?: string;
  questions?: unknown;
};

const MAX_QUESTIONS = 3;
const CHARACTER_TYPING_DELAY_MS = 16;
const QUESTION_TYPING_DELAY_MS = 240;

function sanitizeQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, MAX_QUESTIONS);
}

export default function Home() {
  const [jobTitle, setJobTitle] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [displayedQuestions, setDisplayedQuestions] = useState<string[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeRequestRef = useRef<AbortController | null>(null);
  const typingTimeoutIdsRef = useRef<number[]>([]);

  function clearTypingTimeouts() {
    typingTimeoutIdsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    typingTimeoutIdsRef.current = [];
  }

  function resetGeneratedState() {
    setQuestions([]);
    setDisplayedQuestions([]);
    setActiveQuestionIndex(null);
  }

  function resetInterface(options?: { preserveJobTitle?: boolean }) {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    clearTypingTimeouts();
    resetGeneratedState();
    setError("");
    setIsLoading(false);

    if (!options?.preserveJobTitle) {
      setJobTitle("");
    }
  }

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
      clearTypingTimeouts();
    };
  }, []);

  useEffect(() => {
    clearTypingTimeouts();

    if (questions.length === 0) {
      return;
    }

    let isCancelled = false;

    const schedule = (callback: () => void, delay: number) => {
      const timeoutId = window.setTimeout(callback, delay);
      typingTimeoutIdsRef.current.push(timeoutId);
    };

    const typeQuestion = (questionIndex: number, characterIndex: number) => {
      if (isCancelled) {
        return;
      }

      const currentQuestion = questions[questionIndex];

      if (!currentQuestion) {
        setActiveQuestionIndex(null);
        return;
      }

      setDisplayedQuestions((currentDisplayedQuestions) => {
        const nextDisplayedQuestions = questions.map(
          (_, index) => currentDisplayedQuestions[index] ?? ""
        );

        nextDisplayedQuestions[questionIndex] = currentQuestion.slice(
          0,
          characterIndex + 1
        );

        return nextDisplayedQuestions;
      });

      const nextCharacterIndex = characterIndex + 1;

      if (nextCharacterIndex < currentQuestion.length) {
        schedule(
          () => typeQuestion(questionIndex, nextCharacterIndex),
          CHARACTER_TYPING_DELAY_MS
        );
        return;
      }

      const nextQuestionIndex = questionIndex + 1;

      if (nextQuestionIndex < questions.length) {
        setActiveQuestionIndex(null);
        schedule(() => startTypingQuestion(nextQuestionIndex), QUESTION_TYPING_DELAY_MS);
        return;
      }

      setActiveQuestionIndex(null);
    };

    const startTypingQuestion = (questionIndex: number) => {
      if (isCancelled || questionIndex >= questions.length) {
        return;
      }

      setActiveQuestionIndex(questionIndex);
      typeQuestion(questionIndex, 0);
    };

    schedule(() => startTypingQuestion(0), 0);

    return () => {
      isCancelled = true;
      clearTypingTimeouts();
    };
  }, [questions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedJobTitle = jobTitle.trim();

    resetInterface({ preserveJobTitle: true });

    if (!trimmedJobTitle) {
      setError("Please enter a job title.");
      return;
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobTitle: trimmedJobTitle }),
        signal: controller.signal,
      });

      const data = (await response.json()) as GenerateQuestionsResponse;

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const nextQuestions = sanitizeQuestions(data.questions);

      if (nextQuestions.length === 0) {
        throw new Error("The API returned no usable interview questions.");
      }

      setDisplayedQuestions(nextQuestions.map(() => ""));
      setQuestions(nextQuestions);
    } catch (caughtError) {
      if (controller.signal.aborted) {
        return;
      }

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to generate interview questions.";

      setError(message);
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setIsLoading(false);
      }
    }
  }

  const isSubmitDisabled = isLoading || jobTitle.trim().length === 0;
  const showResetButton = questions.length > 0 || error.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
              AI Interview Assistant
            </p>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Generate sharper interview questions for any role.
              </h1>

              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Enter a role title and get up to three focused interview prompts
                that feel ready to use in a real screening conversation.
              </p>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              Powered by DeepSeek API through a server-side Next.js route.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="jobTitle"
                className="block text-sm font-medium text-slate-200"
              >
                Job title
              </label>

              <p className="text-sm leading-6 text-slate-400">
                Start with Customer Success Manager or replace it with any role.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Customer Success Manager"
                autoComplete="off"
                className="min-h-12 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="min-h-12 rounded-2xl border border-cyan-300/20 bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition enabled:hover:bg-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isLoading ? "Generating..." : "Generate questions"}
              </button>
            </div>

            {error && (
              <p className="rounded-2xl border border-red-900/80 bg-red-950/60 px-4 py-3 text-sm leading-6 text-red-200">
                {error}
              </p>
            )}
          </form>
        </section>

        <section
          aria-live="polite"
          className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-white">
                Interview questions
              </h2>

              <p className="text-sm leading-6 text-slate-400">
                Role-specific questions appear here in sequence.
              </p>
            </div>

            {questions.length > 0 && (
              <p className="text-sm text-slate-400">
                {questions.length} of {MAX_QUESTIONS} shown
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 text-sm leading-6 text-slate-300">
              Generating questions for {jobTitle.trim() || "your role"}...
            </div>
          ) : questions.length > 0 ? (
            <ol className="grid gap-4">
              {questions.map((question, index) => {
                const displayedQuestion = displayedQuestions[index] ?? "";
                const isTypingCurrentQuestion =
                  activeQuestionIndex === index &&
                  displayedQuestion.length < question.length;

                return (
                  <li
                    key={index}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/20"
                  >
                    <span className="mb-3 block text-sm font-semibold text-cyan-300">
                      Question {index + 1}
                    </span>

                    <p className="text-base leading-7 text-slate-100">
                      {displayedQuestion}
                      {isTypingCurrentQuestion && (
                        <span className="ml-1 animate-pulse text-cyan-300">
                          |
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-5 py-6 text-sm leading-7 text-slate-400">
              Enter a role title and generate questions to preview a clean,
              three-card interview set. Question cards will type in one at a
              time after the API response returns.
            </div>
          )}

          {showResetButton && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => resetInterface()}
                className="min-h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                Reset
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
