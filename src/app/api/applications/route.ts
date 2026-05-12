import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string; id: string };
  const { searchParams } = new URL(req.url);
  const opportunityId = searchParams.get("opportunityId");

  if (user.role === "STUDENT") {
    // ?check=opportunityId — quick already-applied probe
    const check = searchParams.get("check");
    if (check) {
      const existing = await prisma.application.findUnique({
        where: { studentId_opportunityId: { studentId: user.id, opportunityId: check } },
        select: { id: true },
      });
      return NextResponse.json({ applied: !!existing });
    }

    const applications = await prisma.application.findMany({
      where: { studentId: user.id },
      include: {
        opportunity: {
          select: {
            id: true, title: true, department: true, remote: true,
            payType: true, payAmount: true,
            cvRequirement: true, transcriptRequirement: true,
            faculty: { select: { name: true, department: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(applications);
  }

  if (user.role === "FACULTY" && opportunityId) {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (opportunity?.facultyId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const applications = await prisma.application.findMany({
      where: { opportunityId },
      include: { student: { select: { name: true, email: true, bio: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(applications);
  }

  // Consolidated inbox — all applications across all of a faculty's postings
  if (user.role === "FACULTY" && searchParams.get("inbox") === "true") {
    const applications = await prisma.application.findMany({
      where: { opportunity: { facultyId: user.id } },
      include: {
        student: { select: { name: true, email: true, bio: true } },
        opportunity: { select: { id: true, title: true, department: true, subject: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(applications);
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string; id: string };
  if (user.role !== "STUDENT") return NextResponse.json({ error: "Only students can apply" }, { status: 403 });

  const { opportunityId, coverLetter, resumeText, resumeFileName, transcriptText, transcriptFileName } = await req.json();

  if (!opportunityId || !coverLetter) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.application.findUnique({
    where: { studentId_opportunityId: { studentId: user.id, opportunityId } },
  });
  if (existing) return NextResponse.json({ error: "Already applied" }, { status: 409 });

  const application = await prisma.application.create({
    data: {
      studentId: user.id,
      opportunityId,
      coverLetter,
      resumeText:         resumeText         || null,
      resumeFileName:     resumeFileName     || null,
      transcriptText:     transcriptText     || null,
      transcriptFileName: transcriptFileName || null,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
