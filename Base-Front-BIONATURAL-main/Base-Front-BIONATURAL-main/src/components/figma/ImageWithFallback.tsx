import React, { useState } from 'react'

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement> & { category?: string }) {
  const [didError, setDidError] = useState(false)
  const { src, alt, style, className, category, ...rest } = props

  if (!src || didError) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 ${className ?? ''}`}
        style={style}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.7 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3A7D44" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z" opacity="0.3"/>
            <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" opacity="0.5"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" opacity="0.3"/>
            <circle cx="12" cy="12" r="2" fill="#3A7D44"/>
          </svg>
          {category && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#3A7D44' }}>{category}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setDidError(true)}
    />
  )
}
