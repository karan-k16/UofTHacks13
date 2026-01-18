-- ============================================
-- Pulse Studio - Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE renders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Projects Policies
-- ============================================

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- Project Versions Policies
-- ============================================

-- Users can view versions of their own projects
CREATE POLICY "Users can view own project versions"
  ON project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can create versions for their own projects
CREATE POLICY "Users can create own project versions"
  ON project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can delete versions of their own projects
CREATE POLICY "Users can delete own project versions"
  ON project_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- ============================================
-- Assets Policies
-- ============================================

-- Users can view their own assets
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create their own assets
CREATE POLICY "Users can create own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own assets
CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own assets
CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- Renders Policies
-- ============================================

-- Users can view their own renders
CREATE POLICY "Users can view own renders"
  ON renders FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create their own renders
CREATE POLICY "Users can create own renders"
  ON renders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own renders
CREATE POLICY "Users can update own renders"
  ON renders FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own renders
CREATE POLICY "Users can delete own renders"
  ON renders FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- Storage Bucket Policies
-- ============================================

-- Note: These need to be run in the Supabase dashboard or via the API
-- Storage bucket policies for 'samples' bucket:
-- 
-- SELECT: auth.uid() = owner
-- INSERT: auth.uid() IS NOT NULL
-- UPDATE: auth.uid() = owner
-- DELETE: auth.uid() = owner
--
-- Storage bucket policies for 'renders' bucket:
-- Same as above

