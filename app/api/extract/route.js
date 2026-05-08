import OpenAI from "openai";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function extractTextFromFile(file) {
  if (!file) return "";
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type || "";
  const name = file.name || "";

  if (type.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdf(buffer);
    return parsed.text || "";
  }

  if (
    type.includes("word") ||
    name.toLowerCase().endsWith(".docx") ||
    name.toLowerCase().endsWith(".doc")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  return buffer.toString("utf8");
}

function fallbackCandidate(text) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return {
    name: lines[0] || "Candidate Name",
    headline: "Client-facing Candidate Profile",
    profile: lines.slice(1, 6).join(" ").slice(0, 800),
    location: "",
    nationality: "",
    education: [],
    languages: [],
    accomplishments: [],
    certifications: [],
    proficiencies: [],
    experience: [
      {
        role: "Experience extracted from CV",
        company: "",
        dates: "",
        bullets: lines.slice(6, 18)
      }
    ]
  };
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const pastedText = formData.get("text")?.toString() || "";
    const rawText = [pastedText, await extractTextFromFile(file)].filter(Boolean).join("\n\n").trim();

    if (!rawText) {
      return NextResponse.json({ error: "Upload a CV file or paste CV text." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ candidate: fallbackCandidate(rawText), rawText, warning: "No OPENAI_API_KEY found. Used basic fallback extraction." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const prompt = `Extract this CV into strict JSON for a THA client-facing candidate profile.

Rules:
- Output JSON only. No markdown.
- Rewrite profile in polished, professional, client-facing language. Keep it honest.
- Preserve event/project, PMO, stakeholder, logistics, production, sponsorship and operations experience.
- Remove personal contact details such as phone/email.
- Use concise bullets. Do not invent employers, dates, education, nationality, languages or certifications.
- If unavailable, use empty string or empty array.

JSON shape:
{
  "name": "",
  "headline": "",
  "profile": "",
  "location": "",
  "nationality": "",
  "education": [""],
  "languages": [""],
  "accomplishments": [""],
  "certifications": [""],
  "proficiencies": [""],
  "experience": [
    { "role": "", "company": "", "dates": "", "bullets": [""] }
  ]
}

CV TEXT:
${rawText.slice(0, 45000)}`;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a senior recruitment operations assistant formatting CVs for client submission." },
        { role: "user", content: prompt }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const candidate = JSON.parse(content);
    return NextResponse.json({ candidate, rawText });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Extraction failed." }, { status: 500 });
  }
}
