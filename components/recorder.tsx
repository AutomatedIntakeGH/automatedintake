'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mic, Square, Loader2 } from 'lucide-react'

type RecorderState = 'idle' | 'requesting' | 'recording' | 'uploading'

interface RecorderProps {
  userId: string
  trade: string
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function bestMimeType() {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export function Recorder({ userId, trade }: RecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function startRecording() {
    setError('')
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = bestMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => uploadRecording(mimeType || 'audio/webm')

      recorder.start(1000)
      setState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } catch {
      setState('idle')
      setError('Microphone access denied. Tap the lock icon in your browser bar and allow the mic.')
    }
  }

  function stopRecording() {
    timerRef.current && clearInterval(timerRef.current)
    timerRef.current = null
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setState('uploading')
  }

  async function uploadRecording(mimeType: string) {
    const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    const path = `${userId}/${Date.now()}.${ext}`

    const supabase = createClient()

    const { error: uploadErr } = await supabase.storage
      .from('audio')
      .upload(path, blob, { contentType: mimeType, cacheControl: '3600' })

    if (uploadErr) {
      setState('idle')
      setError('Upload failed — your recording is not lost. Check your connection and try again.')
      return
    }

    const woRes = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade, audioPath: path }),
    })

    if (!woRes.ok) {
      let errMsg = 'Work order creation failed. Try again.'
      try {
        const err = await woRes.json()
        if (err.error === 'limit_reached') {
          errMsg = "You've hit your 5 free work orders this month. Tap to upgrade."
        }
      } catch {}
      setState('idle')
      setError(errMsg)
      return
    }

    const { id } = await woRes.json()
    router.push(`/work-orders/${id}`)
  }

  if (state === 'idle') {
    return (
      <div className="space-y-4">
        <button
          onClick={startRecording}
          className="w-full h-32 bg-[#06B6D4] hover:bg-[#0891b2] active:bg-[#0e7490] rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20 touch-manipulation"
        >
          <Mic className="w-10 h-10 text-white" strokeWidth={1.5} />
          <span className="text-white text-2xl font-bold tracking-tight">Start</span>
        </button>
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    )
  }

  if (state === 'requesting') {
    return (
      <div className="w-full h-32 bg-slate-800 rounded-2xl flex items-center justify-center">
        <p className="text-slate-400">Allow microphone access...</p>
      </div>
    )
  }

  if (state === 'recording') {
    return (
      <div className="space-y-3">
        <div className="w-full bg-slate-800 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse block" />
            <span className="text-white font-mono text-2xl tabular-nums">{fmt(elapsed)}</span>
          </div>
          <span className="text-slate-500 text-sm">Listening...</span>
        </div>
        <button
          onClick={stopRecording}
          className="w-full h-20 bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-2xl flex items-center justify-center gap-3 transition-colors touch-manipulation"
        >
          <Square className="w-6 h-6 text-white fill-white" />
          <span className="text-white text-xl font-bold">Stop</span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-32 bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" />
      <p className="text-slate-400 text-sm">Uploading recording...</p>
    </div>
  )
}
