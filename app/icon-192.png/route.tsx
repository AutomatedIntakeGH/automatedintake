import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 38,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <span style={{ color: '#06B6D4', fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -4 }}>
            AI
          </span>
          <div style={{ width: 40, height: 4, background: '#06B6D4', borderRadius: 2, marginTop: 4 }} />
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  )
}
