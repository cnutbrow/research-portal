import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      faculty: { select: { name: true, email: true, department: true, bio: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(opportunity);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string; id: string };
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (opportunity.facultyId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title, description, department, subject,
    payType, payAmount, remote,
    prerequisites, hoursPerWeek,
    skills, positions, deadline,
    cvRequirement, transcriptRequirement,
    isActive,
  } = body;

  const data: Record<string, unknown> = {};
  if (title              !== undefined) data.title              = title;
  if (description        !== undefined) data.description        = description;
  if (department         !== undefined) data.department         = department;
  if (subject            !== undefined) data.subject            = subject;
  if (payType            !== undefined) data.payType            = payType;
  if (payAmount          !== undefined) data.payAmount          = payAmount ? parseFloat(payAmount) : null;
  if (remote             !== undefined) data.remote             = remote;
  if (prerequisites      !== undefined) data.prerequisites      = prerequisites || null;
  if (hoursPerWeek       !== undefined) data.hoursPerWeek       = hoursPerWeek ? parseInt(hoursPerWeek) : null;
  if (skills             !== undefined) data.skills             = skills;
  if (positions          !== undefined) data.positions          = positions ? parseInt(positions) : 1;
  if (deadline           !== undefined) data.deadline           = deadline ? new Date(deadline) : null;
  if (cvRequirement      !== undefined) data.cvRequirement      = cvRequirement;
  if (transcriptRequirement !== undefined) data.transcriptRequirement = transcriptRequirement;
  if (isActive           !== undefined) data.isActive           = isActive;

  const updated = await prisma.opportunity.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { role: string; id: string };
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (opportunity.facultyId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.application.deleteMany({ where: { opportunityId: id } });
  await prisma.opportunity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
