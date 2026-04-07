-- Store LLM-discovered page URLs per competitor (replaces hardcoded /pricing, /features)
-- Format: {"pricing": "/plans", "features": "/product", "solutions": "/solutions", ...}
ALTER TABLE competitors ADD COLUMN discovered_pages jsonb NOT NULL DEFAULT '{}';

-- Track when pages were last discovered
ALTER TABLE competitors ADD COLUMN pages_discovered_at timestamptz;
