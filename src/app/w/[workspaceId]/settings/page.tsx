import { WorkspaceSettingsClient } from "./WorkspaceSettingsClient";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceSettingsClient workspaceId={workspaceId} />;
}
