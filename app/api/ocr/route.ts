import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://192.168.96.216:11434/v1'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud'
const OLLAMA_TOKEN = process.env.OLLAMA_TOKEN || ''

const SYSTEM_PROMPT = `Распознай ВСЕ товары с чека и верни JSON:
{"shop_name":"название магазина","date":"YYYY-MM-DD","items":[{"name":"товар","quantity":1,"unit_price":0.00,"total":0.00,"category":"Еда"}]}
Категории только: Еда,Транспорт,Жильё,Развлечения,Одежда,Здоровье,Связь,Подписки,Образование,Другое
Если не можешь распознать - верни пустой items.`

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Нет файла' }, { status: 400 })

    const uploadDir = path.join(process.cwd(), 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    console.log(`[OCR] Файл: ${(buffer.length / 1024).toFixed(0)}KB`)

    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const url = new URL(`${OLLAMA_URL}/chat/completions`)
    const transport = url.protocol === 'https:' ? https : http

    const body = JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: 'Распознай все товары с этого чека' }
          ]
        }
      ],
      temperature: 0.1,
      stream: false,
      max_tokens: 2000
    })

    console.log(`[OCR] Отправляю запрос в Ollama (модель: ${OLLAMA_MODEL})...`)

    const response = await new Promise<any>((resolve, reject) => {
      const req = transport.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(OLLAMA_TOKEN ? { 'Authorization': `Bearer ${OLLAMA_TOKEN}` } : {})
        },
        timeout: 300000
      }, (res) => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          const status = res.statusCode || 500;
          if (status >= 200 && status < 300) {
            resolve(JSON.parse(data))
          } else {
            reject(new Error(`Ollama error ${status}: ${data.substring(0, 500)}`))
          }
        })
      })
      
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Ollama timeout (5 min)'))
      })
      
      req.on('error', reject)
      req.write(body)
      req.end()
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[OCR] Ответ получен за ${elapsed} сек`)

    const content = response.choices?.[0]?.message?.content || ''
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error(`[OCR] Не удалось распарсить JSON: ${cleaned.substring(0, 200)}`)
      parsed = { shop_name: '', date: '', items: [] }
    }

    await fs.unlink(filePath).catch(() => {})

    return NextResponse.json({
      shop_name: parsed.shop_name || '',
      date: parsed.date || new Date().toISOString().split('T')[0],
      items: parsed.items || [],
      elapsed: `${elapsed} сек`
    })

  } catch (err: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.error(`[OCR] Ошибка после ${elapsed} сек:`, err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
