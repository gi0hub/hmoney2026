'use client';

interface TShirtVisualProps {
  number: number;
  className?: string;
  primaryColor?: string;
}

export function TShirtVisual({ number, className = "w-full h-full", primaryColor = "#627EEA" }: TShirtVisualProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 1. Base Image */}
      <img
        src="/tshirt-white.png"
        alt="T-Shirt"
        className="w-full h-full object-contain"
        style={{
          mixBlendMode: 'multiply',
          filter: 'contrast(1.1)'
        }}
      />

      {/* 2. Number Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none">
        <span
          className="font-mono text-5xl font-black tracking-tighter"
          style={{
            color: primaryColor,

            textShadow: `
                    1px 1px 0px rgba(255,255,255,0.4), 
                    2px 2px 0px rgba(0,0,0,0.3),
                    4px 4px 8px rgba(0,0,0,0.5),
                    0 0 15px ${primaryColor}40
                `,
            fontFamily: '"Space Mono", "Courier New", monospace',

          }}
        >
          {number.toString().padStart(3, '0')}
        </span>
      </div>
    </div>
  );
}
