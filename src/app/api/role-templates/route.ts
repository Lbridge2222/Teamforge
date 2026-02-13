import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roleTemplates } from "@/lib/db/schema";
import { eq, ilike, or, sql, asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

// GET /api/role-templates — list all role templates (optionally filter by department or search)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response!;

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const search = searchParams.get("search");

    let results;

    if (department) {
      results = await db
        .select()
        .from(roleTemplates)
        .where(eq(roleTemplates.department, department))
        .orderBy(asc(roleTemplates.tier), asc(roleTemplates.jobTitle));
    } else if (search) {
      const searchPattern = `%${search}%`;
      results = await db
        .select()
        .from(roleTemplates)
        .where(
          or(
            ilike(roleTemplates.jobTitle, searchPattern),
            ilike(roleTemplates.department, searchPattern),
            ilike(roleTemplates.corePurpose, searchPattern),
            sql`${roleTemplates.tags}::text ILIKE ${searchPattern}`
          )
        )
        .orderBy(asc(roleTemplates.department), asc(roleTemplates.jobTitle));
    } else {
      results = await db
        .select()
        .from(roleTemplates)
        .orderBy(asc(roleTemplates.department), asc(roleTemplates.jobTitle));
    }

    // Get unique departments for filter
    const departments = await db
      .selectDistinct({ department: roleTemplates.department })
      .from(roleTemplates)
      .orderBy(asc(roleTemplates.department));

    return NextResponse.json({
      templates: results,
      departments: departments.map((d) => d.department),
    });
  } catch (error) {
    console.error("List role templates error:", error);
    return NextResponse.json(
      { error: "Failed to list role templates" },
      { status: 500 }
    );
  }
}
