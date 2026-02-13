import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { WorkspaceNav } from "@/components/layout/WorkspaceNav";
import { WorkspaceProvider } from "@/components/layout/WorkspaceProvider";
import { ForgeWrapper } from "@/components/forge/ForgeWrapper";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav
        userEmail={user.email ?? ""}
        userName={user.user_metadata?.full_name ?? user.email ?? "User"}
      />
      <WorkspaceProvider workspaceId={workspaceId}>
        <WorkspaceNav workspaceId={workspaceId} />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <ForgeWrapper />
      </WorkspaceProvider>
    </div>
  );
}
