import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/signout — выход из системы
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/login')
}
