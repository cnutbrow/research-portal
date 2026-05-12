import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string; id: string };
  const { id } = await params;

  // ── Student: edit their own application content ──────────────────────────
  if (user.role === "STUDENT") {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (application.studentId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (application.status === "ACCEPTED" || application.status === "REJECTED") {
      return NextResponse.json({ error: "Cannot edit a decided application" }, { status: 409 });
    }

    const { coverLetter, resumeText, resumeFileName, transcriptText, transcriptFileName } = await req.json();
    const updated = await prisma.application.update({
      where: { id },
      data: {
        coverLetter:        coverLetter        ?? application.coverLetter,
        resumeText:         resumeText         ?? null,
        resumeFileName:     resumeFileName     ?? null,
        transcriptText:     transcriptText     ?? null,
        transcriptFileName: transcriptFileName ?? null,
      },
    });
    return NextResponse.json(updated);
  }

  // ── Faculty: update application status ───────────────────────────────────
  if (user.role !== "FACULTY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const application = await prisma.application.findUnique({
    where: { id },
    include: { opportunity: true },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (application.opportunity.facultyId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();
  const updated = await prisma.application.update({
    where: { id },
    data: { status: status as ApplicationStatus },
  });

  return NextResponse.json(updated);
}
