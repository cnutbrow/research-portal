import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PayType, RemoteType, DocRequirement } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const college    = searchParams.get("college");
  const remote     = searchParams.get("remote");
  const payType    = searchParams.get("payType");
  const search     = searchParams.get("search");
  const myPostings = searchParams.get("myPostings");

  const session = await getServerSession(authOptions);

  const where: Record<string, unknown> = { isActive: true };

  if (myPostings === "true" && session?.user) {
    const user = session.user as { id: string };
    where.facultyId = user.id;
    delete where.isActive;
  }

  if (college)  where.department = college;
  if (remote)   where.remote     = remote as RemoteType;
  if (payType)  where.payType    = payType as PayType;
  if (search) {
    where.OR = [
      { title:       { contains: search } },
      { description: { contains: search } },
      { department:  { contains: search } },
      { subject:     { contains: search } },
      { skills:      { contains: search } },
    ];
  }

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: {
      faculty: { select: { name: true, email: true, department: true } },
      _count:  { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(opportunities);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string; id: string };
  if (user.role !== "FACULTY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title, description, department, subject,
    payType, payAmount, remote,
    prerequisites, hoursPerWeek,
    skills, positions, deadline,
    cvRequirement, transcriptRequirement,
  } = body;

  if (!title || !description || !department || !subject || !payType || !remote) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      title,
      description,
      department,
      subject,
      payType:               payType as PayType,
      payAmount:             payAmount    ? parseFloat(payAmount)    : null,
      remote:                remote as RemoteType,
      prerequisites:         prerequisites || null,
      hoursPerWeek:          hoursPerWeek ? parseInt(hoursPerWeek)  : null,
      skills:                skills || "",
      positions:             positions   ? parseInt(positions)      : 1,
      deadline:              deadline    ? new Date(deadline)       : null,
      cvRequirement:         (cvRequirement         as DocRequirement) || "OPTIONAL",
      transcriptRequirement: (transcriptRequirement as DocRequirement) || "UNAVAILABLE",
      facultyId:             user.id,
    },
  });

  return NextResponse.json(opportunity, { status: 201 });
}
