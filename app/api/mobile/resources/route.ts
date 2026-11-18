import { NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { isExamId } from "@/lib/content/exams";
import { hasExamAccess } from "@/lib/access";
import { RESOURCES_CHECKED, resourcesFor } from "@/lib/content/resources";
import { unauthorized } from "@/lib/mobile";

// GET ?exam=pe-civil -> premium: the links; otherwise only a summary of what's included
export async function GET(req: Request) {
  const user = await getBearerUser();
  if (!user) return unauthorized();
  const exam = new URL(req.url).searchParams.get("exam") ?? "";
  if (!isExamId(exam)) return NextResponse.json({ error: "Unknown exam" }, { status: 400 });
  const sections = resourcesFor(exam);
  const depth = exam === "pe-civil" ? user.peDepth : null;
  const ordered = depth ? [...sections].sort((a, b) => Number(b.id === depth) - Number(a.id === depth)) : sections;
  if (!hasExamAccess(user, exam)) {
    return NextResponse.json({
      access: false,
      checked: RESOURCES_CHECKED,
      summary: { links: sections.reduce((n, s) => n + s.links.length, 0), sections: sections.map((s) => s.title) },
    });
  }
  return NextResponse.json({
    access: true,
    checked: RESOURCES_CHECKED,
    sections: ordered.map((s) => ({ ...s, depth: s.id === depth })),
  });
}
