
-- Create data_sources table for web URLs
CREATE TABLE public.data_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL DEFAULT 'web_url',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this dashboard)
CREATE POLICY "Anyone can read data sources"
ON public.data_sources FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert data sources"
ON public.data_sources FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update data sources"
ON public.data_sources FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete data sources"
ON public.data_sources FOR DELETE
USING (true);

-- Create storage bucket for uploaded data files
INSERT INTO storage.buckets (id, name, public) VALUES ('data-files', 'data-files', true);

-- Storage policies
CREATE POLICY "Anyone can read data files"
ON storage.objects FOR SELECT
USING (bucket_id = 'data-files');

CREATE POLICY "Anyone can upload data files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'data-files');

CREATE POLICY "Anyone can delete data files"
ON storage.objects FOR DELETE
USING (bucket_id = 'data-files');
