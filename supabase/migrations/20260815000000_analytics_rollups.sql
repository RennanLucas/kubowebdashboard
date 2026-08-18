-- Tabela Base de Rollup (Overview Diário com filtros)
CREATE TABLE public.analytics_daily_overview (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  device TEXT NOT NULL,
  visitors INT NOT NULL DEFAULT 0,
  views INT NOT NULL DEFAULT 0,
  sessions INT NOT NULL DEFAULT 0,
  bounces INT NOT NULL DEFAULT 0,
  total_duration INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date, source, device)
);

-- Tabela de Páginas
CREATE TABLE public.analytics_daily_pages (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  device TEXT NOT NULL,
  page_path TEXT NOT NULL,
  views INT NOT NULL DEFAULT 0,
  visitors INT NOT NULL DEFAULT 0,
  sessions INT NOT NULL DEFAULT 0,
  bounces INT NOT NULL DEFAULT 0,
  total_duration INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date, source, device, page_path)
);

-- Tabela Geográfica
CREATE TABLE public.analytics_daily_geo (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  device TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  views INT NOT NULL DEFAULT 0,
  visitors INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date, source, device, country, city)
);

-- Tabela de Sistemas e Navegadores
CREATE TABLE public.analytics_daily_tech (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  device TEXT NOT NULL,
  browser TEXT NOT NULL,
  os TEXT NOT NULL,
  views INT NOT NULL DEFAULT 0,
  visitors INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date, source, device, browser, os)
);

-- Tabela de Eventos (Leads, Cliques)
CREATE TABLE public.analytics_daily_events (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  device TEXT NOT NULL,
  event_type TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date, source, device, event_type)
);

-- Status de Agregação (Para o CronJob saber até onde processou)
CREATE TABLE public.aggregation_status (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  last_aggregated_at TIMESTAMPTZ NOT NULL DEFAULT '2000-01-01T00:00:00Z',
  PRIMARY KEY (project_id)
);

-- RLS Policies
ALTER TABLE public.analytics_daily_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_geo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_tech ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rollups" ON public.analytics_daily_overview FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE p.id = analytics_daily_overview.project_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users view own rollups" ON public.analytics_daily_pages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE p.id = analytics_daily_pages.project_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users view own rollups" ON public.analytics_daily_geo FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE p.id = analytics_daily_geo.project_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users view own rollups" ON public.analytics_daily_tech FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE p.id = analytics_daily_tech.project_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users view own rollups" ON public.analytics_daily_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p JOIN public.clients c ON c.id = p.client_id WHERE p.id = analytics_daily_events.project_id AND c.user_id = auth.uid())
);

-- Índices Secundários para agilizar as queries do dashboard
CREATE INDEX idx_analytics_overview_date ON public.analytics_daily_overview(project_id, date DESC);
CREATE INDEX idx_analytics_pages_date ON public.analytics_daily_pages(project_id, date DESC);
CREATE INDEX idx_analytics_geo_date ON public.analytics_daily_geo(project_id, date DESC);
CREATE INDEX idx_analytics_tech_date ON public.analytics_daily_tech(project_id, date DESC);
CREATE INDEX idx_analytics_events_date ON public.analytics_daily_events(project_id, date DESC);
