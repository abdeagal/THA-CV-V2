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
  AlignmentType,
  TabStopType
} from "docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEAL = "1F5663";
const LIGHT = "8EE4DB";
const TEXT = "27596A";
const WHITE = "FFFFFF";

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: WHITE },
  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
  left: { style: BorderStyle.NONE, size: 0, color: WHITE },
  right: { style: BorderStyle.NONE, size: 0, color: WHITE },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: WHITE },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: WHITE }
};

function run(text = "", opts = {}) {
  return new TextRun({
    text: String(text || ""),
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size ?? 20,
    color: opts.color ?? TEXT,
    font: "Arial"
  });
}

function para(text = "", opts = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 90, line: opts.line ?? 260 },
    tabStops: opts.tabStops,
    children: [run(text, opts)]
  });
}

function sideTitle(text) {
  return para(String(text).toUpperCase(), { bold: true, size: 21, color: LIGHT, after: 130, before: 120, line: 220 });
}

function sideText(text = "") {
  return para(text || "—", { size: 18, color: LIGHT, after: 90, line: 235 });
}

function sideBullet(text = "") {
  return new Paragraph({
    spacing: { after: 50, line: 220 },
    indent: { left: 120, hanging: 120 },
    children: [run(`◦ ${String(text)}`, { size: 17, color: LIGHT })]
  });
}

function mainTitle(text) {
  return para(text, { size: 21, color: TEXT, after: 40, line: 220 });
}

function divider() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({ children: [new TableCell({ borders: noBorders, shading: { type: ShadingType.CLEAR, fill: "0F6781" }, children: [para("", { size: 2, after: 0, line: 20 })] })] })]
  });
}

function bullets(items, color = TEXT, size = 18) {
  return (items || []).filter(Boolean).map((x) => new Paragraph({
    spacing: { after: 35, line: 225 },
    indent: { left: 120, hanging: 120 },
    children: [run(`◦ ${String(x)}`, { size, color })]
  }));
}

function sideSection(title, items) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : items ? [items] : [];
  return [sideTitle(title), ...(arr.length ? arr.map(sideBullet) : [sideText("—")])];
}

function jobBlock(job) {
  return [
    new Paragraph({
      spacing: { before: 130, after: 30, line: 230 },
      tabStops: [{ type: TabStopType.RIGHT, position: 5700 }],
      children: [
        run(job.role || "Role", { bold: true, size: 19, color: TEXT }),
        run("\t" + (job.dates || ""), { size: 18, color: TEXT })
      ]
    }),
    para(job.company || "", { size: 18, color: TEXT, after: 90, line: 225 }),
    ...bullets(job.bullets || [], TEXT, 17)
  ];
}

export async function POST(request) {
  try {
    const candidate = await request.json();
    const experience = Array.isArray(candidate.experience) ? candidate.experience : [];

    const header = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [new TableRow({ children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: noBorders, shading: { type: ShadingType.CLEAR, fill: TEAL }, margins: { top: 420, bottom: 420, left: 300, right: 300 }, children: [para("PHOTO", { align: AlignmentType.CENTER, bold: true, size: 20, color: WHITE, after: 0 })] }),
        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 900, bottom: 120, left: 520, right: 200 }, children: [para((candidate.name || "Candidate Name").toUpperCase(), { bold: true, size: 42, color: TEAL, after: 0, line: 420 })] })
      ]})]
    });

    const tealBar = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [new TableRow({ children: [new TableCell({ borders: noBorders, shading: { type: ShadingType.CLEAR, fill: TEAL }, children: [para("", { size: 4, after: 0, line: 180 })] })] })]
    });

    const sidebar = [
      sideTitle("Location"), sideText(candidate.location || "—"),
      ...sideSection("Education", candidate.education),
      sideTitle("Nationality"), sideText(candidate.nationality || "—"),
      ...sideSection("Languages", candidate.languages),
      ...sideSection("Accomplishments", candidate.accomplishments),
      ...sideSection("Certifications", candidate.certifications),
      ...sideSection("Proficiencies", candidate.proficiencies)
    ];

    const main = [
      mainTitle("Profile"),
      divider(),
      para(candidate.profile || "", { size: 18, color: TEXT, after: 170, line: 255 }),
      mainTitle("Work. Experience"),
      divider(),
      ...experience.flatMap(jobBlock)
    ];

    const body = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [new TableRow({ children: [
        new TableCell({ width: { size: 31, type: WidthType.PERCENTAGE }, borders: noBorders, shading: { type: ShadingType.CLEAR, fill: TEAL }, margins: { top: 650, bottom: 260, left: 240, right: 230 }, children: sidebar }),
        new TableCell({ width: { size: 69, type: WidthType.PERCENTAGE }, borders: noBorders, margins: { top: 330, bottom: 260, left: 520, right: 120 }, children: main })
      ]})]
    });

    const doc = new Document({
      creator: "THA CV Formatter Prototype V3",
      styles: { default: { document: { run: { font: "Arial", color: TEXT } } } },
      sections: [{
        properties: { page: { margin: { top: 0, right: 260, bottom: 0, left: 260 } } },
        children: [header, tealBar, body]
      }]
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
