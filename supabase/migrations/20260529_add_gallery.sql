ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
ALTER TABLE gamme_products ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
