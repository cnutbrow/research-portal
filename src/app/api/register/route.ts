import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// This route is used to pre-provision accounts before a user's first SSO login.
// Authentication is handled entirely via CMU SSO — no passwords are stored.
export async function POST(req: NextRequest) {
  const { email, name, role, department } = await req.json();

  if (!email || !name || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: role as Role,
      department: department || null,
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
}
