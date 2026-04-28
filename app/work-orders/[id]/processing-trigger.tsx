'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

type Stage = 'transcribing' | 'analyzing' | 'done' | 'error'

const STAGE_LABELS: Record<Stage, string> = {
  transcribing: 'Transcribing audio...',
  analyzing: 'Analyzing with AI...',
  done: 'Done!',
  error: 'Something went wrong',
}

export default function ProcessingTrigger({ workOrderId }: { workOrderId: string }) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('transcribing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function run() {
      try {
        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workOrderId }),
        })
        if (!transcribeRes.ok) {
          let msg = 'Transcription failed'
          try { msg = (await transcribeRes.json()).error ?? msg } catch {}
          throw new Error(msg)
        }

        setStage('analyzing')

        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workOrderId }),
        })
        if (!extractRes.ok) {
          let msg = 'Extraction failed'
          try { msg = (await extractRes.json()).error ?? msg } catch {}
          throw new Error(msg)
        }

        setStage('done')
        setTimeout(() => router.push(`/work-orders/${workOrderId}/result`), 500)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setStage('error')
      }
    }

    run()
  }, [workOrderId, router])

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {stage === 'error' ? (
        <>
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-white text-lg font-semibold">Something went wrong</p>
          <p className="text-slate-500 text-sm max-w-xs">{errorMsg}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm"
          >
            Back to dashboard
          </button>
        </>
      ) : stage === 'done' ? (
        <>
          <CheckCircle className="w-10 h-10 text-[#06B6D4]" />
          <p className="text-white text-lg font-semibold">All done!</p>
        </>
      ) : (
        <>
          <Loader2 className="w-10 h-10 text-[#06B6D4] animate-spin" />
          <p className="text-white text-lg font-semibold">{STAGE_LABELS[stage]}</p>
          <p className="text-slate-500 text-sm">
            {stage === 'transcribing'
              ? 'Sending audio to Deepgram Nova-3...'
              : 'Extracting structured data with Claude...'}
          </p>
        </>
      )}
    </div>
  )
}
