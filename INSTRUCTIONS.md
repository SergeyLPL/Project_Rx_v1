# 🚀 Инструкции по запуску Project Rx v1

## 1. Выполнение SQL миграций

**Вариант A: Через Supabase Dashboard (рекомендуется)**
1. Откройте http://supabase.kzpm.com:8000
2. Перейдите в **SQL Editor**
3. Скопируйте содержимое `migrations/001_initial.sql`
4. Нажмите **Run**

**Вариант B: Через MCP1 сервер**
1. Запустите MCP1: `cd MCP1 && node mcp-server.js`
2. Используйте инструмент `supabase_query` для выполнения SQL

---

## 2. Настройка окружения

Откройте `.env.local` и укажите:

```env
NEXT_PUBLIC_SUPABASE_URL=http://supabase.kzpm.com:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ваш-anon-ключ>
SUPABASE_SERVICE_ROLE_KEY=<ваш-service-role-key>
```

**Где взять ключи:**
- Supabase Dashboard → Settings → API
- `anon key` — публичный ключ (для браузера)
- `service_role key` — секретный ключ (для сервера)

---

## 3. Запуск проекта

```bash
# Установка зависимостей (уже сделано)
npm install

# Запуск dev сервера
npm run dev

# Или
npx next dev -p 3002
```

Откройте: **http://localhost:3002**

---

## 4. Проверка работы

1. Перейдите на http://localhost:3002/register
2. Зарегистрируйтесь с email и паролем
3. Проверьте email (подтверждение аккаунта)
4. Войдите на http://localhost:3002/login
5. Вы попадёте в /dashboard

---

## Структура проекта

```
Project_Rx_v1/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        ← Форма входа
│   │   └── register/page.tsx     ← Форма регистрации
│   ├── (dashboard)/
│   │   ├── layout.tsx            ← Protected layout
│   │   └── page.tsx              ← Дашборд
│   ├── api/auth/signout/route.ts ← Выход
│   ├── layout.tsx                ← Корневой layout
│   ├── globals.css               ← Стили
│   └── page.tsx                  ← Главная → редирект
├── components/
│   └── auth/
│       ├── login-form.tsx        ← Компонент входа
│       └── register-form.tsx     ← Компонент регистрации
├── lib/
│   ├── supabase/
│   │   ├── client.ts             ← Браузерный клиент
│   │   └── server.ts             ← Серверный клиент
│   └── utils.ts                  ← Утилиты
├── migrations/
│   └── 001_initial.sql           ← SQL миграции
├── middleware.ts                  ← Защита роутов
└── .env.local                     ← Переменные окружения
```

---

## Безопасность (RLS)

Все данные изолированы по `user_id`:
- `profiles`: пользователь видит только свой профиль
- `transactions`: пользователь видит только свои транзакции

RLS политики настроены для `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
