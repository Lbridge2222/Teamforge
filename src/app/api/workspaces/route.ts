import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { seedWorkspaceFromTemplate } from "@/lib/templates";
import { requireOrgAccess, requireUser } from "@/lib/auth";

// POST /api/workspaces — create workspace
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const { orgId, name, description, template } = await request.json();

    if (!orgId || !name) {
      return NextResponse.json(
        { error: "orgId and name are required" },
        { status: 400 }
      );
    }

    const orgAccess = await requireOrgAccess(orgId, auth.user.id, "admin");
    if ("response" in orgAccess) return orgAccess.response!;

    const [workspace] = await db
      .insert(workspaces)
      .values({
        orgId,
        name,
        description: description || null,
        industryTemplate: template || "blank",
      })
      .returning();

    // Seed from template if not blank
    if (template && template !== "blank") {
      await seedWorkspaceFromTemplate(workspace.id, template);
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

// GET /api/workspaces — list workspaces (unused if server component fetches directly)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const orgAccess = await requireOrgAccess(orgId, auth.user.id, "viewer");
    if ("response" in orgAccess) return orgAccess.response!;

    const results = await db.query.workspaces.findMany({
      where: eq(workspaces.orgId, orgId),
      orderBy: (w, { desc }) => [desc(w.updatedAt)],
    });

    return NextResponse.json({ workspaces: results });
  } catch (error) {
    console.error("List workspaces error:", error);
    return NextResponse.json(
      { error: "Failed to list workspaces" },
      { status: 500 }
    );
  }
}
