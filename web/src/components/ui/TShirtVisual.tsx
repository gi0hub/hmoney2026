'use client';

interface TShirtVisualProps {
  number: number;
  className?: string;
  primaryColor?: string;
}

export function TShirtVisual({ number, className = "w-full h-full", primaryColor = "#627EEA" }: TShirtVisualProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Base layer */}
      <img
        src="/tshirt_solid_black.png"
        alt="Technical T-Shirt"
        className="w-full h-full object-contain"
        style={{
          // Blend mode for transparency
          mixBlendMode: 'screen',
          filter: 'contrast(1.3) brightness(1.7)' // Brightness adjustment
        }}
      />

      {/* Overlay layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-15%' }}>
        <span
          className="relative z-10 font-sans text-3xl font-bold tracking-tight opacity-90"
          style={{
            color: '#EEEEEE',
            // Texture simulation
            mixBlendMode: 'overlay',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {number.toString()}
        </span>
        <span
          className="absolute z-0 font-sans text-3xl font-bold tracking-tight opacity-80"
          style={{
            color: '#DDDDDD',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {number.toString()}
        </span>
      </div>
    </div>
  );
}
