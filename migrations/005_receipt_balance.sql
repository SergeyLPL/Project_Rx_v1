-- ============================================
-- Migration: 005_receipt_balance.sql
-- Описание: Авто-обновление баланса счёта при создании/удалении чека
-- ============================================

-- Функция обновления баланса при создании чека (списание)
CREATE OR REPLACE FUNCTION public.deduct_receipt_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE accounts 
  SET balance = balance - NEW.total
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер при создании чека
DROP TRIGGER IF EXISTS on_receipt_created ON receipts;
CREATE TRIGGER on_receipt_created
  AFTER INSERT ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_receipt_balance();

-- Функция возврата баланса при удалении чека
CREATE OR REPLACE FUNCTION public.refund_receipt_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE accounts 
  SET balance = balance + OLD.total
  WHERE id = OLD.account_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер при удалении чека
DROP TRIGGER IF EXISTS on_receipt_deleted ON receipts;
CREATE TRIGGER on_receipt_deleted
  AFTER DELETE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.refund_receipt_balance();

-- Функция обновления баланса при изменении чека
CREATE OR REPLACE FUNCTION public.update_receipt_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Если сумма или счёт изменились
  IF OLD.total != NEW.total OR OLD.account_id != NEW.account_id THEN
    -- Возвращаем старую сумму на старый счёт
    UPDATE accounts 
    SET balance = balance + OLD.total
    WHERE id = OLD.account_id;
    
    -- Списываем новую сумму с нового счёта
    UPDATE accounts 
    SET balance = balance - NEW.total
    WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер при обновлении чека
DROP TRIGGER IF EXISTS on_receipt_updated ON receipts;
CREATE TRIGGER on_receipt_updated
  AFTER UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_receipt_balance();

-- Готово!
SELECT '✅ Миграция 005_receipt_balance выполнена!' AS result;
