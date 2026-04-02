-- Migration: Add DSL template storage
-- Stores TemplateDSL objects alongside problems, enabling replay certification
-- and audit trails for generated test cases.

-- 1. DSL template store
CREATE TABLE IF NOT EXISTS dsl_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    template_hash TEXT NOT NULL,  -- SHA-256 hex (provenance identifier)
    template_spec JSONB NOT NULL, -- The TemplateDSL object
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Pipeline metadata
    pipeline_version TEXT NOT NULL DEFAULT '1.0.0',
    total_cases INTEGER NOT NULL DEFAULT 0,
    disputed_cases INTEGER NOT NULL DEFAULT 0,
    UNIQUE (problem_id, template_hash)
);

-- Index for fast lookup by problem
CREATE INDEX IF NOT EXISTS idx_dsl_templates_problem_id
    ON dsl_templates (problem_id);

-- 2. Extend test_cases with DSL provenance columns
ALTER TABLE test_cases
    ADD COLUMN IF NOT EXISTS dsl_template_id UUID REFERENCES dsl_templates(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS dsl_seed INTEGER,
    ADD COLUMN IF NOT EXISTS dsl_profile TEXT CHECK (
        dsl_profile IS NULL OR
        dsl_profile IN ('random', 'edge_cases', 'worst_case', 'adversarial')
    ),
    ADD COLUMN IF NOT EXISTS oracle_confidence TEXT CHECK (
        oracle_confidence IS NULL OR
        oracle_confidence IN ('high', 'medium', 'low', 'disputed')
    ),
    ADD COLUMN IF NOT EXISTS disputed BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. RLS for dsl_templates
ALTER TABLE dsl_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view dsl_templates"
    ON dsl_templates FOR SELECT
    USING (true);

CREATE POLICY "Instructors can insert dsl_templates"
    ON dsl_templates FOR INSERT
    WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'instructor')
    );

CREATE POLICY "Instructors can update own dsl_templates"
    ON dsl_templates FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Instructors can delete own dsl_templates"
    ON dsl_templates FOR DELETE
    USING (auth.uid() = created_by);
