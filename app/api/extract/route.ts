import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/extraction-schemas'
import type { Trade } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workOrderId } = await request.json()
  if (!workOrderId) return NextResponse.json({ error: 'workOrderId required' }, { status: 400 })

  const { data: wo } = await supabase
    .from('work_orders')
    .select('transcript, trade')
    .eq('id', workOrderId)
    .eq('user_id', user.id)
    .single()

  if (!wo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
  if (!wo.transcript) return NextResponse.json({ error: 'No transcript yet' }, { status: 400 })

  const systemPrompt = buildSystemPrompt(wo.trade as Trade)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      { role: 'user', content: `Transcript:\n${wo.transcript}` },
    ],
  })

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  let extracted: Record<string, unknown>
  try {
    extracted = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'Claude returned invalid JSON', raw: rawText }, { status: 500 })
  }

  await supabase
    .from('work_orders')
    .update({
      status: 'final',
      raw_extraction: extracted,
      customer: (extracted.customer as Record<string, unknown>) ?? null,
      vehicle: (extracted.vehicle as Record<string, unknown>) ?? null,
      property: (extracted.property as Record<string, unknown>) ?? null,
      concerns: (extracted.concerns as Record<string, unknown>[]) ?? null,
      notes: (extracted.advisor_notes ?? extracted.tech_notes ?? null) as string | null,
      recommended_actions: (extracted.recommended_diagnostics as Record<string, unknown>[]) ?? null,
      follow_up_questions: (extracted.follow_up_questions as Record<string, unknown>[]) ?? null,
      sentiment: (extracted.sentiment as string) ?? null,
    })
    .eq('id', workOrderId)

  return NextResponse.json({ extracted })
  } catch (err) {
    console.error('[extract] unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
