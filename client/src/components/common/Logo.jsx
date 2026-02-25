import React from 'react';

export default function Logo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Hexagon / Lab Shape */}
      <path
        d="M20 4L34 11V29L20 36L6 29V11L20 4Z"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Internal Flask/Test Tube Shape */}
      <path
        d="M16 14V18.5C16 18.5 13 20 13 23.5C13 27 16 29 20 29C24 29 27 27 27 23.5C27 20 24 18.5 24 18.5V14"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bubbles or Atoms */}
      <circle cx="20" cy="11" r="2.5" fill="var(--accent-primary)" opacity="0.8">
        <animate attributeName="r" values="2.5;3;2.5" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="18" r="1.5" fill="var(--accent-success)" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="18" r="1.5" fill="var(--accent-success)" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Subtle Checkmark inside flask */}
      <path
        d="M17 23.5L19 25.5L23 21.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
