// ════════════════════════════════════════════
// GET /api/forge/conversations/[id]/messages
// Load messages for a conversation
// ════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { forgeMessages, forgeConversations } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify conversation belongs to user
  const [convo] = await db
    .select()
    .from(forgeConversations)
    .where(
      and(
        eq(forgeConversations.id, id),
        eq(forgeConversations.userId, user.id)
      )
    )
    .limit(1);

  if (!convo) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const messages = await db
    .select()
    .from(forgeMessages)
    .where(eq(forgeMessages.conversationId, id))
    .orderBy(asc(forgeMessages.createdAt));

  return NextResponse.json({ messages });
}
