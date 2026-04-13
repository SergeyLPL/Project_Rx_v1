-- ============================================
-- Migration: 002_accounts.sql
-- Описание: Таблица счетов (accounts) с авто-созданием "Наличные"
-- ============================================

-- 1. Таблица accounts (счета пользователей)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Наличные',
  icon TEXT DEFAULT '💵',
  currency TEXT DEFAULT 'RUB',
  balance NUMERIC(12,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS политики
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Авто-создание счёта "Наличные" при регистрации
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, name, icon, is_default, currency)
  VALUES (NEW.id, 'Наличные', '💵', true, 'RUB');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_create_account
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_account();

-- ============================================
-- Индекс
-- ============================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
