import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireWorkspaceAccess } from "@/lib/auth";

type RouteParams = { params: Promise<{ categoryId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { categoryId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const category = await db.query.activityCategories.findFirst({
      where: eq(activityCategories.id, categoryId),
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const access = await requireWorkspaceAccess(
      category.workspaceId,
      auth.user.id,
      "editor"
    );
    if ("response" in access) return access.response!;

    const updates = await request.json();
    const {
      id: _id,
      workspaceId: _workspaceId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...safeUpdates
    } = updates ?? {};
    const [updated] = await db
      .update(activityCategories)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(eq(activityCategories.id, categoryId))
      .returning();
    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { categoryId } = await params;
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const category = await db.query.activityCategories.findFirst({
      where: eq(activityCategories.id, categoryId),
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const access = await requireWorkspaceAccess(
      category.workspaceId,
      auth.user.id,
      "admin"
    );
    if ("response" in access) return access.response!;

    await db.delete(activityCategories).where(eq(activityCategories.id, categoryId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
