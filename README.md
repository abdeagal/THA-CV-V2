# THA CV Formatter Prototype

A Vercel-ready prototype for converting raw CVs into a THA-style client-facing profile.

## What it does

- Upload PDF/DOCX/TXT CVs or paste CV text
- Extract candidate information using OpenAI
- Edit extracted fields manually
- Preview the candidate in a THA-style two-column layout
- Export a DOCX file

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your OpenAI key to `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a private GitHub repo.
2. Import the repo in Vercel.
3. Add environment variables:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

4. Deploy.

## Notes

- This prototype uses the uploaded THA-style CV as a layout target: main work experience on the left, profile/sidebar fields on the right.
- Large PDFs may hit Vercel request limits. For prototype testing, use smaller CVs or paste CV text.
- The next version should map into your actual editable DOCX template if you provide a blank template plus before/after examples.
