-- ════════════════════════════════════════════
-- Row Level Security Policies
-- Run this migration to enable RLS on all tables
-- ════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ════════════════════════════════════════════

-- Check if user is member of org
CREATE OR REPLACE FUNCTION is_org_member(org_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = is_org_member.org_id
      AND org_members.user_id = is_org_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in org
CREATE OR REPLACE FUNCTION get_org_role(org_id uuid, user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role::text FROM org_members
    WHERE org_members.org_id = get_org_role.org_id
      AND org_members.user_id = get_org_role.user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has at least a certain role
CREATE OR REPLACE FUNCTION has_org_role(org_id uuid, user_id uuid, required_role text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  role_rank int;
  required_rank int;
BEGIN
  user_role := get_org_role(org_id, user_id);
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Role hierarchy: viewer(1) < editor(2) < admin(3) < owner(4)
  role_rank := CASE user_role
    WHEN 'viewer' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'owner' THEN 4
    ELSE 0
  END;
  
  required_rank := CASE required_role
    WHEN 'viewer' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'owner' THEN 4
    ELSE 0
  END;
  
  RETURN role_rank >= required_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════
-- ORGANISATION POLICIES
-- ════════════════════════════════════════════

-- Users can view orgs they're members of
CREATE POLICY "Users can view their organisations"
  ON organisations FOR SELECT
  USING (is_org_member(id, auth.uid()));

-- Only owners can create organisations (handled at app level)
CREATE POLICY "Owners can create organisations"
  ON organisations FOR INSERT
  WITH CHECK (true); -- Will be constrained by org_members insert

-- Only owners can update organisations
CREATE POLICY "Owners can update their organisations"
  ON organisations FOR UPDATE
  USING (has_org_role(id, auth.uid(), 'owner'));

-- Only owners can delete organisations
CREATE POLICY "Owners can delete their organisations"
  ON organisations FOR DELETE
  USING (has_org_role(id, auth.uid(), 'owner'));

-- ════════════════════════════════════════════
-- ORG MEMBERS POLICIES
-- ════════════════════════════════════════════

-- Members can view other members in their org
CREATE POLICY "Members can view org members"
  ON org_members FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

-- Admins can invite members
CREATE POLICY "Admins can invite members"
  ON org_members FOR INSERT
  WITH CHECK (has_org_role(org_id, auth.uid(), 'admin'));

-- Only admins and owners can update member roles
CREATE POLICY "Admins can update member roles"
  ON org_members FOR UPDATE
  USING (has_org_role(org_id, auth.uid(), 'admin'));

-- Only admins and owners can remove members
CREATE POLICY "Admins can remove members"
  ON org_members FOR DELETE
  USING (has_org_role(org_id, auth.uid(), 'admin'));

-- ════════════════════════════════════════════
-- WORKSPACE POLICIES
-- ════════════════════════════════════════════

-- Viewers can view workspaces in their org
CREATE POLICY "Members can view workspaces"
  ON workspaces FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

-- Editors can create workspaces
CREATE POLICY "Editors can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (has_org_role(org_id, auth.uid(), 'editor'));

-- Editors can update workspaces
CREATE POLICY "Editors can update workspaces"
  ON workspaces FOR UPDATE
  USING (has_org_role(org_id, auth.uid(), 'editor'));

-- Admins can delete workspaces
CREATE POLICY "Admins can delete workspaces"
  ON workspaces FOR DELETE
  USING (has_org_role(org_id, auth.uid(), 'admin'));

-- ════════════════════════════════════════════
-- WORKSPACE-SCOPED ENTITY POLICIES
-- (stages, roles, handoffs, activities, etc.)
-- ════════════════════════════════════════════

-- Helper function to check workspace access
CREATE OR REPLACE FUNCTION has_workspace_access(ws_id uuid, user_id uuid, required_role text)
RETURNS boolean AS $$
DECLARE
  ws_org_id uuid;
BEGIN
  SELECT org_id INTO ws_org_id FROM workspaces WHERE id = ws_id;
  RETURN has_org_role(ws_org_id, user_id, required_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STAGES
CREATE POLICY "Members can view stages"
  ON stages FOR SELECT
  USING (has_workspace_access(workspace_id, auth.uid(), 'viewer'));

CREATE POLICY "Editors can create stages"
  ON stages FOR INSERT
  WITH CHECK (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update stages"
  ON stages FOR UPDATE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete stages"
  ON stages FOR DELETE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

-- TEAM ROLES
CREATE POLICY "Members can view roles"
  ON team_roles FOR SELECT
  USING (has_workspace_access(workspace_id, auth.uid(), 'viewer'));

CREATE POLICY "Editors can create roles"
  ON team_roles FOR INSERT
  WITH CHECK (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update roles"
  ON team_roles FOR UPDATE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete roles"
  ON team_roles FOR DELETE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

-- HANDOFFS
CREATE POLICY "Members can view handoffs"
  ON handoffs FOR SELECT
  USING (has_workspace_access(workspace_id, auth.uid(), 'viewer'));

CREATE POLICY "Editors can create handoffs"
  ON handoffs FOR INSERT
  WITH CHECK (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update handoffs"
  ON handoffs FOR UPDATE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete handoffs"
  ON handoffs FOR DELETE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

-- ACTIVITY CATEGORIES
CREATE POLICY "Members can view categories"
  ON activity_categories FOR SELECT
  USING (has_workspace_access(workspace_id, auth.uid(), 'viewer'));

CREATE POLICY "Editors can create categories"
  ON activity_categories FOR INSERT
  WITH CHECK (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update categories"
  ON activity_categories FOR UPDATE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete categories"
  ON activity_categories FOR DELETE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

-- ACTIVITIES
CREATE POLICY "Members can view activities"
  ON activities FOR SELECT
  USING (has_workspace_access(workspace_id, auth.uid(), 'viewer'));

CREATE POLICY "Editors can create activities"
  ON activities FOR INSERT
  WITH CHECK (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update activities"
  ON activities FOR UPDATE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete activities"
  ON activities FOR DELETE
  USING (has_workspace_access(workspace_id, auth.uid(), 'editor'));

-- ════════════════════════════════════════════
-- ASSIGNMENT TABLES POLICIES
-- ════════════════════════════════════════════

-- Stage-Role Assignments
CREATE POLICY "Members can view stage assignments"
  ON stage_role_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      WHERE stages.id = stage_role_assignments.stage_id
        AND has_workspace_access(stages.workspace_id, auth.uid(), 'viewer')
    )
  );

CREATE POLICY "Editors can manage stage assignments"
  ON stage_role_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stages
      WHERE stages.id = stage_role_assignments.stage_id
        AND has_workspace_access(stages.workspace_id, auth.uid(), 'editor')
    )
  );

-- Activity Assignments
CREATE POLICY "Members can view activity assignments"
  ON activity_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_assignments.activity_id
        AND has_workspace_access(activities.workspace_id, auth.uid(), 'viewer')
    )
  );

CREATE POLICY "Editors can manage activity assignments"
  ON activity_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_assignments.activity_id
        AND has_workspace_access(activities.workspace_id, auth.uid(), 'editor')
    )
  );

-- Role Progressions
CREATE POLICY "Members can view progressions"
  ON role_progressions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_roles
      WHERE team_roles.id = role_progressions.role_id
        AND has_workspace_access(team_roles.workspace_id, auth.uid(), 'viewer')
    )
  );

CREATE POLICY "Editors can manage progressions"
  ON role_progressions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_roles
      WHERE team_roles.id = role_progressions.role_id
        AND has_workspace_access(team_roles.workspace_id, auth.uid(), 'editor')
    )
  );

-- ════════════════════════════════════════════
-- FORGE POLICIES
-- ════════════════════════════════════════════

CREATE POLICY "Users can view their conversations"
  ON forge_conversations FOR SELECT
  USING (
    user_id = auth.uid() OR
    has_workspace_access(workspace_id, auth.uid(), 'viewer')
  );

CREATE POLICY "Users can create conversations"
  ON forge_conversations FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    has_workspace_access(workspace_id, auth.uid(), 'viewer')
  );

CREATE POLICY "Users can delete their conversations"
  ON forge_conversations FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view messages in accessible conversations"
  ON forge_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forge_conversations
      WHERE forge_conversations.id = forge_messages.conversation_id
        AND (
          forge_conversations.user_id = auth.uid() OR
          has_workspace_access(forge_conversations.workspace_id, auth.uid(), 'viewer')
        )
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON forge_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forge_conversations
      WHERE forge_conversations.id = forge_messages.conversation_id
        AND forge_conversations.user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════
-- AUDIT LOG POLICIES
-- ════════════════════════════════════════════

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    has_org_role(org_id, auth.uid(), 'admin')
  );

-- System can insert audit logs (service role only)
-- No user-facing INSERT policy - handled by service role

-- ════════════════════════════════════════════
-- PERFORMANCE INDEXES FOR RLS
-- ════════════════════════════════════════════

-- These indexes improve RLS policy performance
CREATE INDEX IF NOT EXISTS idx_org_members_lookup ON org_members(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org_lookup ON workspaces(org_id);
CREATE INDEX IF NOT EXISTS idx_stages_workspace_lookup ON stages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_roles_workspace_lookup ON team_roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_workspace_lookup ON handoffs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activities_workspace_lookup ON activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_categories_workspace_lookup ON activity_categories(workspace_id);

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_org_role(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION has_workspace_access(uuid, uuid, text) TO authenticated;
