import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
  ShadingType,
  TabStopType
} from "docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAVY = "050B1A";
const GREY = "F2F3F5";

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
};

function textRun(text = "", opts = {}) {
  return new TextRun({
    text: String(text),
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size ?? 20,
    color: opts.color ?? NAVY,
    font: "Arial"
  });
}

function p(text = "", opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 100, before: opts.before ?? 0, line: opts.line ?? 270 },
    alignment: opts.align,
    tabStops: opts.tabStops,
    children: [textRun(text, opts)]
  });
}

function bullet(text = "", size = 18, after = 50) {
  return new Paragraph({
    spacing: { after, line: 245 },
    indent: { left: 150, hanging: 150 },
    children: [textRun(`◦ ${String(text)}`, { size })]
  });
}

function sectionTitle(text, before = 240) {
  return p(text, { bold: true, size: 20, color: "000000", after: 90, before, line: 240 });
}

function sideSection(title, items, before = 220) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : items ? [items] : [];
  if (!arr.length) return [sectionTitle(title.toUpperCase(), before), p("—", { size: 16, color: "6B7280" })];
  return [sectionTitle(title.toUpperCase(), before), ...arr.map((x) => bullet(x, 16, 45))];
}

function jobBlock(job) {
  const role = job.role || "Role";
  const dates = job.dates || "";
  return [
    new Paragraph({
      spacing: { before: 115, after: 20, line: 240 },
      tabStops: [{ type: TabStopType.RIGHT, position: 6020 }],
      children: [
        textRun(role, { bold: true, size: 20, color: "000000" }),
        textRun("\t" + dates, { bold: true, size: 20, color: "000000" })
      ]
    }),
    p(job.company || "", { size: 17, color: NAVY, after: 55, line: 230 }),
    ...((job.bullets || []).filter(Boolean).map((b) => bullet(b, 16, 45)))
  ];
}

export async function POST(request) {
  try {
    const candidate = await request.json();
    const experience = Array.isArray(candidate.experience) ? candidate.experience : [];

    const left = [
      p(candidate.name || "Candidate Name", { bold: true, size: 42, color: NAVY, after: 220, line: 420 }),
      p(candidate.profile || "", { size: 20, color: NAVY, after: 260, line: 310 }),
      sectionTitle("Work. Experience", 40),
      ...experience.flatMap(jobBlock)
    ];

    const right = [
      p("", { size: 4, after: 760, line: 120 }),
      sectionTitle("LOCATION", 0),
      p(candidate.location || "—", { size: 16, after: 80 }),
      ...sideSection("Education", candidate.education, 230),
      ...sideSection("Languages", candidate.languages, 230),
      ...sideSection("Accomplishments", candidate.accomplishments, 230),
      sectionTitle("NATIONALITY", 230),
      p(candidate.nationality || "—", { size: 16, after: 80 }),
      ...sideSection("Certifications", candidate.certifications, 230),
      ...sideSection("Proficiencies", candidate.proficiencies, 230)
    ];

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({
          cantSplit: false,
          children: [
            new TableCell({
              width: { size: 64, type: WidthType.PERCENTAGE },
              borders: noBorders,
              margins: { top: 0, bottom: 0, left: 0, right: 240 },
              children: left
            }),
            new TableCell({
              width: { size: 36, type: WidthType.PERCENTAGE },
              borders: noBorders,
              shading: { type: ShadingType.CLEAR, fill: GREY },
              margins: { top: 0, bottom: 240, left: 260, right: 180 },
              children: right
            })
          ]
        })
      ]
    });

    const doc = new Document({
      creator: "THA CV Formatter Prototype",
      styles: {
        default: {
          document: { run: { font: "Arial", color: NAVY } }
        }
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 620, right: 520, bottom: 520, left: 620 }
            }
          },
          children: [table]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${(candidate.name || "Candidate").replace(/[^a-z0-9 -]/gi, "").replace(/\s+/g, "_")}_THA_CV.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "DOCX generation failed." }, { status: 500 });
  }
}
