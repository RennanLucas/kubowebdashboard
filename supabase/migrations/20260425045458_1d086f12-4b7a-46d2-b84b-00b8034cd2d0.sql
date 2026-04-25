-- Categoria de anotação
CREATE TYPE public.annotation_category AS ENUM ('campaign', 'launch', 'event', 'other');

-- Tabela principal
CREATE TABLE public.annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  date DATE NOT NULL,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  category public.annotation_category NOT NULL DEFAULT 'event',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_annotations_project_date ON public.annotations (project_id, date DESC);

ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário acessa anotações dos próprios projetos
CREATE POLICY "Users view own annotations"
  ON public.annotations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = annotations.project_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users insert own annotations"
  ON public.annotations FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = annotations.project_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own annotations"
  ON public.annotations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = annotations.project_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users delete own annotations"
  ON public.annotations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = annotations.project_id AND c.user_id = auth.uid()
  ));

-- Trigger updated_at
CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON public.annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();