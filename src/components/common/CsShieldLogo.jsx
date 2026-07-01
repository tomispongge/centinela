// CsShieldLogo — logo escudo (SVG propio, no lucide).
// IMPORTANTE: cada instancia necesita un `gradId` único para no colisionar
// los <linearGradient id> en el DOM. Portado del HTML original.
export default function CsShieldLogo({ size = 32, gradId = 'cs-shield' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 132" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="18" y1="8" x2="104" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#66D4F7"/><stop offset="0.5" stopColor="#2A6FDB"/><stop offset="1" stopColor="#7C5CFC"/>
        </linearGradient>
      </defs>
      <path d="M60 4 L106 20 V64 C106 96 86 118 60 128 C34 118 14 96 14 64 V20 Z" fill={`url(#${gradId})`}/>
      <path d="M60 16 L96 28.5 V64 C96 89.5 80.5 107.5 60 116 C39.5 107.5 24 89.5 24 64 V28.5 Z" fill="#0E2150"/>
      <circle cx="60" cy="60" r="13" fill="none" stroke="#66D4F7" strokeWidth="3.5"/>
      <circle cx="60" cy="60" r="4.5" fill="#AB90FB"/>
    </svg>
  );
}
