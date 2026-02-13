import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityCategories } from "@/lib/db/schema";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

// POST /api/workspaces/:id/categories
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const access = await requireWorkspaceAccess(
      workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const body = await request.json();
    const {
      id: _id,
      workspaceId: _workspaceId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...safeBody
    } = body ?? {};
    const [category] = await db
      .insert(activityCategories)
      .values({ ...safeBody, workspaceId })
      .returning();
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
