import { ImageResponse } from 'next/og'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const dim = size === '192' ? 192 : 512
  const isSmall = dim === 192

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
          borderRadius: isSmall ? 40 : 112,
          border: `${isSmall ? 5 : 12}px solid rgba(52, 211, 153, 0.35)`,
        }}
      >
        <div
          style={{
            fontSize: isSmall ? 82 : 220,
            fontWeight: 800,
            color: '#34d399',
          }}
        >
          R$
        </div>
      </div>
    ),
    { width: dim, height: dim }
  )
}