-- ============================================
-- Migration: 004_receipts.sql
-- ОПИСАНИЕ: Чеки с товарами (master-detail)
-- ВАЖНО: Выполните этот скрипт в Supabase SQL Editor!
-- ============================================

-- 1. Таблица receipts (шапка чека)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  shop_name TEXT,
  total NUMERIC(12,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Таблица receipt_items (товары в чеке)
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(10,3) DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'Другое',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS для receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
CREATE POLICY "Users can view own receipts" ON receipts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own receipts" ON receipts;
CREATE POLICY "Users can insert own receipts" ON receipts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
CREATE POLICY "Users can update own receipts" ON receipts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own receipts" ON receipts;
CREATE POLICY "Users can delete own receipts" ON receipts FOR DELETE USING (auth.uid() = user_id);

-- 4. RLS для receipt_items
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own receipt_items" ON receipt_items;
CREATE POLICY "Users can view own receipt_items" ON receipt_items FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM receipts WHERE id = receipt_items.receipt_id));

DROP POLICY IF EXISTS "Users can insert own receipt_items" ON receipt_items;
CREATE POLICY "Users can insert own receipt_items" ON receipt_items FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM receipts WHERE id = receipt_items.receipt_id));

DROP POLICY IF EXISTS "Users can update own receipt_items" ON receipt_items;
CREATE POLICY "Users can update own receipt_items" ON receipt_items FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM receipts WHERE id = receipt_items.receipt_id));

DROP POLICY IF EXISTS "Users can delete own receipt_items" ON receipt_items;
CREATE POLICY "Users can delete own receipt_items" ON receipt_items FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM receipts WHERE id = receipt_items.receipt_id));

-- 5. Индексы
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_account_id ON receipts(account_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_items(category);

-- Готово!
SELECT '✅ Миграция 004_receipts выполнена!' AS result;
