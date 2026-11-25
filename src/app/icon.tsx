import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #050507 0%, #0d1f1a 100%)',
          borderRadius: 112,
          border: '12px solid rgba(52, 211, 153, 0.35)',
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 800,
            background: 'linear-gradient(90deg, #34d399, #22d3ee)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          R$
        </div>
      </div>
    ),
    { ...size }
  )
}