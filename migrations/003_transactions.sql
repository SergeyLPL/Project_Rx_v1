-- ============================================
-- Migration: 003_transactions.sql
-- Описание: Таблица транзакций и триггер обновления баланса
-- ============================================

-- 1. Таблица transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'RUB',
  category TEXT,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Включаем RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Политики
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Триггер для авто-обновления баланса счёта
-- ============================================

CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  acc_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    acc_id := NEW.account_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Если изменился счёт, обновляем оба
    IF OLD.account_id != NEW.account_id THEN
      -- Списываем со старого (отменяем транзакцию)
      UPDATE accounts SET balance = balance - (OLD.amount * (CASE WHEN OLD.type = 'income' THEN 1 ELSE -1 END))
      WHERE id = OLD.account_id;
      
      -- Добавляем к новому
      UPDATE accounts SET balance = balance + (NEW.amount * (CASE WHEN NEW.type = 'income' THEN 1 ELSE -1 END))
      WHERE id = NEW.account_id;
      
      RETURN NEW;
    END IF;
    acc_id := NEW.account_id;
  ELSIF TG_OP = 'DELETE' THEN
    acc_id := OLD.account_id;
  END IF;

  -- Для INSERT и UPDATE (когда счёт не менялся) и DELETE
  -- Пересчитываем баланс целиком для надёжности (или используем дельту)
  -- Используем дельту для скорости:
  
  IF TG_OP = 'INSERT' THEN
    UPDATE accounts SET balance = balance + (NEW.amount * (CASE WHEN NEW.type = 'income' THEN 1 ELSE -1 END))
    WHERE id = acc_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Отменяем старое, применяем новое
    UPDATE accounts SET balance = balance - (OLD.amount * (CASE WHEN OLD.type = 'income' THEN 1 ELSE -1 END))
                                               + (NEW.amount * (CASE WHEN NEW.type = 'income' THEN 1 ELSE -1 END))
    WHERE id = acc_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE accounts SET balance = balance - (OLD.amount * (CASE WHEN OLD.type = 'income' THEN 1 ELSE -1 END))
    WHERE id = acc_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance();
