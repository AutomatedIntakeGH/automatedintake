import { NextRequest, NextResponse } from 'next/server'
import { DeepgramClient, type ListenV1Response } from '@deepgram/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { workOrderId } = await request.json()
    if (!workOrderId) return NextResponse.json({ error: 'workOrderId required' }, { status: 400 })

    const { data: wo } = await supabase
      .from('work_orders')
      .select('audio_url')
      .eq('id', workOrderId)
      .eq('user_id', user.id)
      .single()

    if (!wo?.audio_url) return NextResponse.json({ error: 'Work order not found' }, { status: 404 })

    // audio_url is stored as the raw storage path, e.g. "user-uuid/1234567890.webm"
    const storagePath = wo.audio_url
    const { data: signed, error: signedErr } = await supabase.storage
      .from('audio')
      .createSignedUrl(storagePath, 300)

    if (signedErr || !signed?.signedUrl) {
      console.error('[transcribe] signed URL error:', signedErr)
      return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 })
    }

    const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! })
    const result = await deepgram.listen.v1.media.transcribeUrl({
      url: signed.signedUrl,
      model: 'nova-3',
      diarize: true,
      punctuate: true,
      smart_format: true,
      utterances: true,
    })

    if (!('results' in result)) {
      return NextResponse.json({ error: 'Transcription queued asynchronously (unexpected)' }, { status: 500 })
    }

    const response = result as ListenV1Response
    const utterances = response.results.utterances ?? []

    const transcript = utterances.length > 0
      ? utterances
          .map((u) => `Speaker ${u.speaker ?? 0}: ${u.transcript ?? ''}`)
          .join('\n')
      : response.results.channels[0]?.alternatives?.[0]?.transcript ?? ''

    await supabase
      .from('work_orders')
      .update({ transcript })
      .eq('id', workOrderId)

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('[transcribe] unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
