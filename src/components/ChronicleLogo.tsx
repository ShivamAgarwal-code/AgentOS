import React from "react";

interface ChronicleLogoProps {
  className?: string;
}

export default function ChronicleLogo({ className = "w-8 h-8" }: ChronicleLogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      id="chronicle-logo-svg"
    >
      {/* Outer elegant "C" enclosing neural lines */}
      <path 
        d="M 68 20 A 40 40 0 1 0 68 80" 
        stroke="currentColor" 
        strokeWidth="9" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Middle main pathway (representing central decision) */}
      <line x1="50" y1="32" x2="50" y2="68" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="23" r="5.5" fill="currentColor" />
      
      {/* Left channel source pathway */}
      <line x1="36" y1="42" x2="36" y2="58" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="36" cy="34" r="4.5" fill="currentColor" />
      
      {/* Right destination outcome pathway */}
      <line x1="64" y1="42" x2="64" y2="58" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="64" cy="34" r="4.5" fill="currentColor" />
    </svg>
  );
}
