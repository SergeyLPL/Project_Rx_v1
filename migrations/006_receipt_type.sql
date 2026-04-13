-- ============================================
-- Migration: 006_receipt_type.sql
-- Описание: Добавление типа транзакции (доход/расход)
-- ============================================

-- Добавляем колонку type в receipts
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense'));

-- Обновляем триггер списания — теперь только для расходов
CREATE OR REPLACE FUNCTION public.deduct_receipt_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'expense' THEN
    UPDATE accounts SET balance = balance - NEW.total WHERE id = NEW.account_id;
  ELSIF NEW.type = 'income' THEN
    UPDATE accounts SET balance = balance + NEW.total WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем триггер возврата
CREATE OR REPLACE FUNCTION public.refund_receipt_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.type = 'expense' THEN
    UPDATE accounts SET balance = balance + OLD.total WHERE id = OLD.account_id;
  ELSIF OLD.type = 'income' THEN
    UPDATE accounts SET balance = balance - OLD.total WHERE id = OLD.account_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем триггер обновления
CREATE OR REPLACE FUNCTION public.update_receipt_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.total != NEW.total OR OLD.account_id != NEW.account_id OR OLD.type != NEW.type THEN
    -- Возвращаем старое
    IF OLD.type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.total WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts SET balance = balance - OLD.total WHERE id = OLD.account_id;
    END IF;
    
    -- Применяем новое
    IF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.total WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.total WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Миграция 006_receipt_type выполнена!' AS result;
