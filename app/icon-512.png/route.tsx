import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 102,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <span style={{ color: '#06B6D4', fontSize: 192, fontWeight: 900, lineHeight: 1, letterSpacing: -10 }}>
            AI
          </span>
          <div style={{ width: 110, height: 10, background: '#06B6D4', borderRadius: 5, marginTop: 10 }} />
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
