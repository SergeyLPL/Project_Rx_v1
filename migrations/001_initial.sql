-- ============================================
-- Migration: 001_initial.sql
-- Описание: Создание таблиц profiles и transactions с RLS
-- ============================================

-- 1. Таблица profiles (расширение auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  currency TEXT DEFAULT 'RUB',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Таблица transactions (доходы/расходы)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'RUB',
  category TEXT,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Включаем RLS для таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS политики для profiles
-- ============================================

-- Пользователь может читать только свой профиль
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Пользователь может обновлять только свой профиль
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Пользователь может вставлять свой профиль (при регистрации)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS политики для transactions
-- ============================================

-- Пользователь может читать только свои транзакции
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может вставлять только свои транзакции
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять только свои транзакции
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователь может удалять только свои транзакции
CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Функция: автоматическое создание профиля при регистрации
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер: вызывается при создании пользователя в auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Индексы для производительности
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
