'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

/* ── Types ── */
type Stage = 'idle' | 'requesting' | 'recording' | 'processing' | 'error'

interface RecorderProps {
  userId: string
  trade: string
  template: string
}

/* ── Constants ── */
const PROCESSING_MSGS = [
  'Transcribing your audio',
  'Extracting key details',
  'Building your work order',
  'Almost done',
]

const WAVEFORM_DELAYS = [0, 0.15, 0.3, 0.15, 0]

/* ── Helpers ── */
function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

function bestMimeType() {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

/* ── Icons ── */
function MicIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="#0A0E14" stroke="#0A0E14" strokeWidth="0">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="#0A0E14" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="23" stroke="#0A0E14" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="8" y1="23" x2="16" y2="23" stroke="#0A0E14" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="#FFFFFF">
      <rect x="5" y="5" width="14" height="14" rx="2"/>
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

/* ── Component ── */
export function Recorder({ userId, trade, template }: RecorderProps) {
  const [stage,      setStage]      = useState<Stage>('idle')
  const [elapsed,    setElapsed]    = useState(0)
  const [msgIdx,     setMsgIdx]     = useState(0)
  const [msgKey,     setMsgKey]     = useState(0)
  const [micDenied,  setMicDenied]  = useState(false)
  const [errorMsg,   setErrorMsg]   = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<BlobPart[]>([])
  const streamRef   = useRef<MediaStream | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router      = useRouter()

  useEffect(() => {
    return () => {
      timerRef.current    && clearInterval(timerRef.current)
      msgTimerRef.current && clearInterval(msgTimerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  function startMsgCycle() {
    setMsgIdx(0)
    setMsgKey(k => k + 1)
    msgTimerRef.current = setInterval(() => {
      setMsgIdx(i => {
        setMsgKey(k => k + 1)
        return (i + 1) % PROCESSING_MSGS.length
      })
    }, 1200)
  }

  async function handleTap() {
    if (stage === 'idle' || stage === 'error') {
      await startRecording()
    } else if (stage === 'recording') {
      stopRecording()
    }
  }

  async function startRecording() {
    if (typeof navigator !== 'undefined') navigator.vibrate?.(50)
    setMicDenied(false)
    setErrorMsg('')
    setStage('requesting')
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = bestMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      chunksRef.current   = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => processRecording(mimeType || 'audio/webm')

      recorder.start(1000)
      setStage('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } catch {
      setMicDenied(true)
      setStage('idle')
    }
  }

  function stopRecording() {
    if (typeof navigator !== 'undefined') navigator.vibrate?.(30)
    if (elapsed < 3) {
      toast.warning('Recording too short. Keep talking and tap stop when done.')
      return
    }
    timerRef.current && clearInterval(timerRef.current)
    timerRef.current = null
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStage('processing')
    startMsgCycle()
  }

  async function processRecording(mimeType: string) {
    const ext      = mimeType.includes('mp4') ? 'm4a' : 'webm'
    const blob     = new Blob(chunksRef.current, { type: mimeType })
    const path     = `${userId}/${Date.now()}.${ext}`
    const supabase = createClient()

    const { error: uploadErr } = await supabase.storage
      .from('audio')
      .upload(path, blob, { contentType: mimeType, cacheControl: '3600' })

    if (uploadErr) {
      msgTimerRef.current && clearInterval(msgTimerRef.current)
      setErrorMsg('Upload failed — check your connection and try again.')
      setStage('error')
      return
    }

    const woRes = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade, template, audioPath: path }),
    })

    if (!woRes.ok) {
      msgTimerRef.current && clearInterval(msgTimerRef.current)
      let msg = 'Work order creation failed. Try again.'
      try {
        const err = await woRes.json()
        if (err.error === 'limit_reached') msg = "You've hit your free limit. Upgrade to keep going."
      } catch {}
      setErrorMsg(msg)
      setStage('error')
      return
    }

    const { id } = await woRes.json()

    const transcribeRes = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workOrderId: id }),
    })

    if (transcribeRes.ok) {
      await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId: id }),
      })
    }

    msgTimerRef.current && clearInterval(msgTimerRef.current)
    router.push(`/work-orders/${id}/result`)
  }

  /* ── Render ── */
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: '36px 20px 28px',
        textAlign: 'center',
        marginBottom: 14,
      }}
    >

      {/* ── PROCESSING ── */}
      {stage === 'processing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' }}>
          {/* Subtle spinner ring */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '2px solid var(--border-em)',
              borderTopColor: 'var(--accent)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p
            key={msgKey}
            className="font-display msg-fade-in"
            style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-sec)' }}
          >
            {PROCESSING_MSGS[msgIdx]}...
          </p>
        </div>
      )}

      {/* ── MIC DENIED ── */}
      {micDenied && stage === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <MicOffIcon />
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Microphone access is blocked</p>
          <p style={{ fontSize: 14, color: 'var(--text-sec)', maxWidth: 280 }}>
            To fix: tap the lock icon in your browser bar → allow Microphone
          </p>
          <button
            onClick={startRecording}
            style={{ marginTop: 4, padding: '10px 24px', background: 'var(--accent)', color: 'var(--bg-primary)', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {stage === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: 15, color: 'var(--text-sec)', maxWidth: 280 }}>{errorMsg}</p>
          <button
            onClick={() => { setStage('idle'); setErrorMsg('') }}
            style={{ marginTop: 4, padding: '10px 24px', background: 'var(--bg-input)', color: 'var(--text-primary)', borderRadius: 10, fontWeight: 700, fontSize: 14, border: '1px solid var(--border-em)', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── IDLE / RECORDING button zone ── */}
      {stage !== 'processing' && !micDenied && stage !== 'error' && (
        <>
          {/* Waveform (recording only) */}
          {stage === 'recording' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 32, marginBottom: 16 }}>
              {WAVEFORM_DELAYS.map((delay, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          )}

          {/* Button */}
          <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Pulse rings (idle only) */}
            {(stage === 'idle' || stage === 'requesting') && (
              <>
                <div
                  className="pulse-ring"
                  style={{
                    position: 'absolute',
                    inset: -16,
                    borderRadius: '50%',
                    border: '2px solid #06D6A035',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  className="pulse-ring-delayed"
                  style={{
                    position: 'absolute',
                    inset: -16,
                    borderRadius: '50%',
                    border: '2px solid #06D6A018',
                    pointerEvents: 'none',
                  }}
                />
              </>
            )}

            <button
              onClick={handleTap}
              disabled={stage === 'requesting'}
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: stage === 'recording' ? '#FF4444' : 'var(--accent)',
                border: 'none',
                cursor: stage === 'requesting' ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: stage === 'recording'
                  ? '0 0 32px #FF444440'
                  : '0 0 32px #06D6A030',
                animation: stage === 'recording' ? 'breathe 2s ease-in-out infinite' : 'none',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
            >
              {stage === 'recording' ? <StopIcon /> : <MicIcon />}
            </button>
          </div>

          {/* Labels */}
          {stage === 'recording' ? (
            <>
              <p
                className="font-display font-black"
                style={{ fontSize: 26, color: '#FF6666', letterSpacing: '0.05em', marginBottom: 6 }}
              >
                RECORDING...
              </p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-sec)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(elapsed)}
              </p>
            </>
          ) : (
            <>
              <p
                className="font-display font-black"
                style={{ fontSize: 26, color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: 6 }}
              >
                TAP TO RECORD
              </p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-sec)', marginBottom: 14 }}>
                Speak naturally — AI handles the rest
              </p>
              {/* Auto-tag pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4A9EFF0D', border: '1px solid #4A9EFF25', borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A9EFF', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4A9EFF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Auto-timestamped · Transcript saved
                </span>
              </div>
            </>
          )}
        </>
      )}

    </div>
  )
}
