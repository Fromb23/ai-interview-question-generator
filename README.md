# AI Interview Question Generator

## Overview

AI Interview Question Generator is a small full-stack Next.js app that accepts a job title and returns up to 3 AI-generated interview questions tailored to that role.

The primary example in the UI is `Customer Success Manager`, but the app accepts any role title entered by the user.

## Why This Project Exists

This project was built for a focused Technical Co-Founder / Founding Engineer technical screen. The implementation prioritizes:

- working end-to-end functionality
- readable, scoped code
- simple server-side AI integration
- clear loading and error states
- clean communication of technical decisions

## Features

- Job title input with `Customer Success Manager` as the example placeholder
- Disabled submit button when the input is empty or a request is already in progress
- Loading state during question generation
- AI-generated interview questions returned through an internal Next.js API route
- Typewriter-style question reveal in sequence
- Reset flow to clear input, results, errors, and animation state
- Server-side environment variable for the API key
- Responsive UI for mobile and desktop

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- DeepSeek API
- OpenAI-compatible SDK (`openai`)

## Architecture

The app uses a simple server-mediated flow:

1. The user enters a job title in the frontend.
2. The frontend sends a `POST` request to `/api/generate-questions`.
3. The Next.js API route calls DeepSeek using the server-side API key.
4. The API route returns up to 3 sanitized interview questions.
5. The frontend renders the returned questions with a typewriter-style animation.

Key files:

- [`app/page.tsx`](app/page.tsx): input handling, loading/error states, results rendering, reset flow, and typewriter animation
- [`app/api/generate-questions/route.ts`](app/api/generate-questions/route.ts): server-side AI request and response sanitization

The browser never calls DeepSeek directly. The API key stays on the server.

## Environment Variables

Create a local environment file:

```bash
DEEPSEEK_API_KEY=your_api_key_here
```

Use `.env.local` for local development and do not commit it.

## Local Setup

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Validation Commands

```bash
npm run lint
npm run build
```

## API Route Example

Request:

```bash
curl -X POST http://localhost:3000/api/generate-questions \
  -H "Content-Type: application/json" \
  -d '{ "jobTitle": "Customer Success Manager" }'
```

Response shape:

```json
{
  "jobTitle": "Customer Success Manager",
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}
```

## Deployment

This app can be deployed to Vercel or another Next.js-compatible hosting provider.

Configure `DEEPSEEK_API_KEY` in the deployment environment before running the app in production.

## AI Provider / Model Decision

DeepSeek was chosen because it offers an OpenAI-compatible API, which keeps the integration simple and readable for a small technical screen project.

The provider integration is isolated in the server-side route, which:

- keeps frontend code clean
- keeps the API key off the client
- makes the AI provider easy to swap later if needed

Current model:

- `deepseek-chat`

## Privacy / Security Note

- The app is designed for generic job titles only.
- Do not include names, resumes, phone numbers, addresses, or other personal identifiers in the input.
- The server-side prompt is written to avoid requesting personal information.
- The API key is never exposed to the browser.

## Submission Checklist

- GitHub repo: `<add GitHub repo URL>`
- Live URL: `<add deployed app URL>`
- Loom walkthrough: `<add Loom video URL>`

## Notes

This project is intentionally small in scope. It aims to satisfy the assignment requirements with a simple, functional, and readable implementation rather than a large abstraction-heavy architecture.
