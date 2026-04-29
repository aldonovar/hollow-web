import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    const spacing = 60;
    let grid: { x: number; y: number; ox: number; oy: number; angle: number; speed: number }[][] = [];
    const mouse = { x: -1000, y: -1000, radius: 250 };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / spacing) + 2;
      rows = Math.floor(canvas.height / spacing) + 2;
      grid = [];

      for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
          grid[i][j] = {
            ox: i * spacing - spacing / 2,
            oy: j * spacing - spacing / 2,
            x: 0,
            y: 0,
            angle: (i * 0.5) + (j * 0.5),
            speed: 0.015 + Math.random() * 0.01
          };
        }
      }
    };

    let animationFrameId: number;
    const animate = () => {
      // Dark brutalist background
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;

      // Update points
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const p = grid[i][j];
          p.angle += p.speed;
          
          // Base undulation
          let targetX = p.ox + Math.cos(p.angle) * 20;
          let targetY = p.oy + Math.sin(p.angle) * 20;

          // Mouse interaction (repulsion)
          const dx = mouse.x - targetX;
          const dy = mouse.y - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Easing curve for a "magnetic" feel
            const push = Math.pow(force, 2) * 80;
            targetX -= (dx / dist) * push;
            targetY -= (dy / dist) * push;
          }

          p.x = targetX;
          p.y = targetY;
        }
      }

      // Draw wireframe mesh
      ctx.lineWidth = 1;
      
      for (let i = 0; i < cols - 1; i++) {
        for (let j = 0; j < rows - 1; j++) {
          const p1 = grid[i][j];
          const p2 = grid[i + 1][j];
          const p3 = grid[i][j + 1];
          const p4 = grid[i + 1][j + 1];

          // Determine opacity based on distance to mouse for a "spotlight" effect
          const cx = (p1.x + p4.x) / 2;
          const cy = (p1.y + p4.y) / 2;
          const dx = mouse.x - cx;
          const dy = mouse.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let lineOpacity = 0.08; // Base visibility (increased from previous)
          if (dist < 400) {
            lineOpacity += (1 - dist / 400) * 0.3; // Glows when mouse is near
          }

          ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
          
          // Draw triangle 1
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.stroke();

          // Draw triangle 2
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.stroke();

          // Random tech-glitch fills
          const fillRand = Math.sin(i * 12.9898 + j * 78.233 + time);
          if (fillRand > 0.98) {
            ctx.fillStyle = `rgba(168, 85, 247, ${lineOpacity * 0.8})`; // Purple
            ctx.fill();
          } else if (fillRand < -0.98) {
            ctx.fillStyle = `rgba(244, 63, 94, ${lineOpacity * 0.8})`; // Rose
            ctx.fill();
          } else if (fillRand > 0.95 && fillRand <= 0.98) {
            ctx.fillStyle = `rgba(255, 255, 255, ${lineOpacity * 0.5})`; // White flash
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
}
