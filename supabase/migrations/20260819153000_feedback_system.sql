-- Feedback and Roadmap Migration

-- Create the ENUMs for types and statuses to ensure consistency
CREATE TYPE feedback_type AS ENUM ('like', 'improvement', 'bug', 'suggestion', 'feature', 'quick_feedback', 'other');
CREATE TYPE feedback_status AS ENUM ('received', 'analyzing', 'planned', 'in_development', 'implemented', 'archived');
CREATE TYPE feedback_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE roadmap_status AS ENUM ('backlog', 'planned', 'in_development', 'testing', 'published');

-- 1. Create feedback table
CREATE TABLE public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL, -- optional
  type feedback_type NOT NULL DEFAULT 'suggestion',
  category text, -- Dashboard, Tracking, etc.
  title text,
  description text,
  customer_priority feedback_priority DEFAULT 'normal',
  internal_priority feedback_priority DEFAULT 'normal',
  status feedback_status DEFAULT 'received',
  admin_response text,
  origin text, -- URL or context where it was created
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create roadmap_items table
CREATE TABLE public.roadmap_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text,
  status roadmap_status DEFAULT 'backlog',
  priority feedback_priority DEFAULT 'normal',
  public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create roadmap_feedback (many-to-many relationship)
CREATE TABLE public.roadmap_feedback (
  roadmap_item_id uuid NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  PRIMARY KEY (roadmap_item_id, feedback_id)
);

-- 4. Create roadmap_votes table
CREATE TABLE public.roadmap_votes (
  roadmap_item_id uuid NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (roadmap_item_id, organization_id) -- Only 1 vote per organization
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_roadmap_items_updated_at
BEFORE UPDATE ON public.roadmap_items
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ENABLE RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- RLS POLICIES FOR FEEDBACK
-- -------------------------------------------------------------

-- Users can insert feedback for their own organization
CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Users can view their own organization's feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything on feedback
CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update feedback" ON public.feedback
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete feedback" ON public.feedback
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- -------------------------------------------------------------
-- RLS POLICIES FOR ROADMAP ITEMS
-- -------------------------------------------------------------

-- Anyone authenticated can view PUBLIC roadmap items
CREATE POLICY "Users can view public roadmap items" ON public.roadmap_items
  FOR SELECT USING (public = true);

-- Admins can view and manage all roadmap items
CREATE POLICY "Admins can view all roadmap items" ON public.roadmap_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert roadmap items" ON public.roadmap_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update roadmap items" ON public.roadmap_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete roadmap items" ON public.roadmap_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- -------------------------------------------------------------
-- RLS POLICIES FOR ROADMAP FEEDBACK (PIVOT)
-- -------------------------------------------------------------

-- Only admins can manage the links between feedback and roadmap items
CREATE POLICY "Admins can manage roadmap_feedback" ON public.roadmap_feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- -------------------------------------------------------------
-- RLS POLICIES FOR ROADMAP VOTES
-- -------------------------------------------------------------

-- Users can view votes of their own organization
CREATE POLICY "Users can view own votes" ON public.roadmap_votes
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert a vote if they belong to the organization
CREATE POLICY "Users can insert vote" ON public.roadmap_votes
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete their vote
CREATE POLICY "Users can delete vote" ON public.roadmap_votes
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Public can view total votes (not user info, just counts using a view or RPC, but we'll allow SELECT for all if needed? Wait, if we allow SELECT for all, users can see who voted. Better to keep it restricted and use an RPC/View).
-- Let's allow SELECT for everyone so they can calculate the count in the frontend? No, `organization_id` exposes customer info.
-- We will use a database view or RPC to get the vote counts for roadmap items.
CREATE POLICY "Admins can manage votes" ON public.roadmap_votes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- VIEW for public vote counts
CREATE VIEW public.roadmap_item_votes AS
SELECT roadmap_item_id, count(*) as vote_count
FROM public.roadmap_votes
GROUP BY roadmap_item_id;

GRANT SELECT ON public.roadmap_item_votes TO authenticated;
