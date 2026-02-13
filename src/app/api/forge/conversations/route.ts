// ════════════════════════════════════════════
// GET /api/forge/conversations?workspaceId=xxx
// List conversations for the current user in a workspace
// ════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { forgeConversations, forgeMessages } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing workspaceId" },
      { status: 400 }
    );
  }

  const conversations = await db
    .select()
    .from(forgeConversations)
    .where(
      and(
        eq(forgeConversations.workspaceId, workspaceId),
        eq(forgeConversations.userId, user.id)
      )
    )
    .orderBy(desc(forgeConversations.updatedAt));

  return NextResponse.json({ conversations });
}

// ════════════════════════════════════════════
// DELETE /api/forge/conversations?id=xxx
// Delete a conversation
// ════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db
    .delete(forgeConversations)
    .where(
      and(
        eq(forgeConversations.id, id),
        eq(forgeConversations.userId, user.id)
      )
    );

  return NextResponse.json({ success: true });
}
