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
    const spacing = 80; // Larger spacing for brutalist feel
    let grid: { ox: number; oy: number; x: number; y: number; baseOffset: number; isGlitch: boolean }[][] = [];
    const mouse = { x: -1000, y: -1000, radius: 350, clickPulse: 0 };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / spacing) + 3;
      rows = Math.floor(canvas.height / spacing) + 3;
      grid = [];

      for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
          grid[i][j] = {
            ox: (i - 1) * spacing,
            oy: (j - 1) * spacing,
            x: 0,
            y: 0,
            baseOffset: Math.random() * Math.PI * 2,
            isGlitch: Math.random() > 0.95
          };
        }
      }
    };

    let animationFrameId: number;
    const animate = () => {
      ctx.fillStyle = '#050505'; // Stark black
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.0005;
      mouse.clickPulse = Math.max(0, mouse.clickPulse - 0.05);

      // Calculate positions
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const p = grid[i][j];
          
          // Angular, jagged movement instead of smooth sine
          const wave = Math.sin(p.baseOffset + time + (i * 0.1) - (j * 0.1));
          let targetX = p.ox + (Math.abs(wave) * 20 * Math.sign(Math.cos(time + p.baseOffset)));
          let targetY = p.oy + (wave * 20);

          if (p.isGlitch && Math.random() > 0.9) {
            targetX += (Math.random() - 0.5) * 40;
            targetY += (Math.random() - 0.5) * 40;
          }

          const dx = mouse.x - p.ox;
          const dy = mouse.y - p.oy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Brutalist magnetic distortion
          if (dist < mouse.radius) {
            const force = Math.pow((mouse.radius - dist) / mouse.radius, 2);
            targetX -= (dx / dist) * force * (100 + mouse.clickPulse * 200);
            targetY -= (dy / dist) * force * (100 + mouse.clickPulse * 200);
          }

          p.x += (targetX - p.x) * 0.1;
          p.y += (targetY - p.y) * 0.1;
        }
      }

      ctx.lineWidth = 1;

      // Draw horizontal and vertical lines (Grid mode)
      for (let i = 0; i < cols - 1; i++) {
        for (let j = 0; j < rows - 1; j++) {
          const p = grid[i][j];
          const right = grid[i + 1][j];
          const bottom = grid[i][j + 1];

          const distToMouse = Math.sqrt(Math.pow(mouse.x - p.x, 2) + Math.pow(mouse.y - p.y, 2));
          const visibility = Math.max(0.05, 1 - (distToMouse / 600));

          ctx.strokeStyle = p.isGlitch ? `rgba(244, 63, 94, ${visibility + 0.2})` : `rgba(255, 255, 255, ${visibility * 0.4})`;

          // Draw Right
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(right.x, right.y);
          ctx.stroke();

          // Draw Bottom
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(bottom.x, bottom.y);
          ctx.stroke();

          // Intersecting Diagonals for certain areas
          if ((i + j) % 3 === 0) {
            const br = grid[i + 1][j + 1];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(br.x, br.y);
            ctx.stroke();
          }

          // Draw glitch nodes
          if (p.isGlitch || distToMouse < 80) {
            ctx.fillStyle = p.isGlitch ? '#f43f5e' : '#fff';
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => init();
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseClick = () => { mouse.clickPulse = 1; };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseClick);
    window.addEventListener('mouseleave', handleMouseLeave);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseClick);
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
