const https = require('https');

const SUPABASE_URL = 'http://supabase.kzpm.com:8000';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzAzNTgzMTcuOTY3OTQ5LCJleHAiOjIwODU3MTgzMTcuOTY3OTQ5fQ.-qw09XG0gAyGoM6-_ezFrQsKG7kFgX5g6Oy9sutpPFg';

const sql = `
-- Таблица accounts
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

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Политики
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can view own accounts') THEN
    CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can insert own accounts') THEN
    CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can update own accounts') THEN
    CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can delete own accounts') THEN
    CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Функция авто-создания счёта
CREATE OR REPLACE FUNCTION public.create_default_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, name, icon, is_default, currency)
  VALUES (NEW.id, 'Наличные', '💵', true, 'RUB');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_create_account') THEN
    CREATE TRIGGER on_auth_user_create_account
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.create_default_account();
  END IF;
END $$;

-- Индекс
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
`;

console.log('🔄 Выполняю SQL миграцию...\n');

const body = JSON.stringify({ query: sql });

const req = https.request(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Prefer': 'return=representation',
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Миграция выполнена успешно!');
      console.log('Ответ:', data.substring(0, 500));
    } else {
      console.error('❌ Ошибка:', res.statusCode);
      console.error(data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Ошибка соединения:', err.message);
});

req.write(body);
req.end();
