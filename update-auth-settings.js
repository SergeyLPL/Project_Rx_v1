const http = require('http')

const SUPABASE_URL = 'http://supabase.kzpm.com:8000'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzAzNTgzMTcuOTY3OTQ5LCJleHAiOjIwODU3MTgzMTcuOTY3OTQ5fQ.-qw09XG0gAyGoM6-_ezFrQsKG7kFgX5g6Oy9sutpPFg'

async function updateAuthSettings() {
  console.log('🔧 Обновление настроек Supabase Auth...\n')

  // Обновляем настройки через REST API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/auth.configs?id=eq.00000000-0000-0000-0000-000000000000`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      site_url: 'http://192.168.96.203:3002',
      redirect_urls: [
        'http://192.168.96.203:3002/**',
        'http://localhost:3002/**',
        'http://localhost:3000/**'
      ]
    })
  })

  const data = await res.json()
  console.log(`Статус: ${res.status}`)
  console.log(`Ответ: ${JSON.stringify(data).substring(0, 300)}`)

  if (res.ok) {
    console.log('\n✅ Настройки обновлены!')
  } else {
    console.log('\n⚠️ Не удалось обновить через API. Попробуйте вручную:')
    console.log('   1. Откройте Supabase SQL Editor')
    console.log('   2. Выполните:')
    console.log("   UPDATE auth.configs SET site_url = 'http://192.168.96.203:3002', redirect_urls = ARRAY['http://192.168.96.203:3002/**', 'http://localhost:3002/**'] WHERE id = '00000000-0000-0000-0000-000000000000';")
  }
}

updateAuthSettings().catch(console.error)
