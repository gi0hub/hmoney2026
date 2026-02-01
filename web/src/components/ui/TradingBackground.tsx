'use client';

import { useEffect, useRef } from 'react';

export function TradingBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Chart Lines Data
        const lines: { y: number; speed: number; color: string; points: number[] }[] = [];
        const colors = ['rgba(6, 182, 212, 0.1)', 'rgba(192, 38, 211, 0.1)']; // Cyan & Magenta low opacity

        // Init lines
        for (let i = 0; i < 3; i++) {
            lines.push({
                y: Math.random() * height,
                speed: 0.5 + Math.random(),
                color: colors[i % colors.length],
                points: Array.from({ length: Math.ceil(width / 20) }, () => Math.random() * 50 - 25)
            });
        }

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);

        let animationFrame: number;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;

            // Vertical lines
            const gridSize = 100;
            const timeOffset = (Date.now() / 50) % gridSize;

            for (let x = -timeOffset; x < width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // Horizontal lines (static)
            for (let y = 0; y < height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw Organic Chart Lines
            lines.forEach(line => {
                ctx.beginPath();
                ctx.strokeStyle = line.color;
                ctx.lineWidth = 2;

                // Move line up/down slowly
                // line.y += Math.sin(Date.now() / 1000) * 0.2; 

                for (let i = 0; i < line.points.length - 1; i++) {
                    const x = i * 20;
                    // Shift points left
                    // Simple sine wave simulation for "trading" look
                    const yOffset = Math.sin((x + Date.now() * line.speed) / 100) * 50;

                    if (i === 0) ctx.moveTo(x, line.y + yOffset);
                    else ctx.lineTo(x, line.y + yOffset);
                }
                ctx.stroke();
            });

            animationFrame = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none opacity-50"
        />
    );
}
