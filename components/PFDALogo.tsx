import React from 'react'

export function PFDALogo() {
  return (
    <svg
      className="w-24 h-24 mx-auto mb-4"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle background */}
      <circle cx="50" cy="50" r="48" fill="#0d4a7e" stroke="#2a89c1" strokeWidth="2" />
      
      {/* Shield shape background */}
      <path
        d="M50 10 L75 25 L75 50 Q75 70 50 85 Q25 70 25 50 L25 25 Z"
        fill="#1e6ba8"
        stroke="#3ba8d8"
        strokeWidth="1.5"
      />
      
      {/* Fish symbol - Filipino fisheries */}
      <g transform="translate(50, 45)">
        {/* Fish body */}
        <ellipse cx="0" cy="0" rx="12" ry="8" fill="#ffffff" stroke="#3ba8d8" strokeWidth="1" />
        
        {/* Fish head */}
        <circle cx="-10" cy="0" r="5" fill="#ffffff" stroke="#3ba8d8" strokeWidth="1" />
        
        {/* Fish eye */}
        <circle cx="-11" cy="-1" r="1.5" fill="#0d4a7e" />
        
        {/* Fish tail */}
        <path
          d="M 12 0 L 18 -5 L 18 5 Z"
          fill="#3ba8d8"
          stroke="#2a89c1"
          strokeWidth="0.5"
        />
        
        {/* Water waves - top */}
        <path
          d="M -15 -12 Q -12 -14 -9 -12 T -3 -12 T 3 -12 T 9 -12 T 15 -12"
          stroke="#3ba8d8"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Water waves - bottom */}
        <path
          d="M -15 12 Q -12 14 -9 12 T -3 12 T 3 12 T 9 12 T 15 12"
          stroke="#3ba8d8"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Stars (Philippines flag inspired) */}
      <g fill="#ffc107">
        <polygon points="28,28 29.5,33 34.5,33 30.5,37 32,42 28,38 24,42 25.5,37 21.5,33 26.5,33" />
        <polygon points="72,28 73.5,33 78.5,33 74.5,37 76,42 72,38 68,42 69.5,37 65.5,33 70.5,33" />
        <polygon points="50,15 51.5,20 56.5,20 52.5,24 54,29 50,25 46,29 47.5,24 43.5,20 48.5,20" />
      </g>
    </svg>
  )
}
