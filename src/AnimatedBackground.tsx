import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let particles: Particle[] = [];
    const particleCount = Math.min(window.innerWidth / 12, 150); // Responsive count
    const connectionDistance = 150;
    const mouse = { x: -1000, y: -1000, radius: 250, clickPulse: 0 };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      size: number;
      color: string;
      isGlitch: boolean;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.size = Math.random() * 2 + 1;
        this.isGlitch = Math.random() > 0.95;
        this.color = this.isGlitch ? '#f43f5e' : (Math.random() > 0.8 ? '#a855f7' : '#ffffff');
      }

      update() {
        // Natural movement
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges smoothly
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          
          // Repel force
          const force = (mouse.radius - distance) / mouse.radius;
          const push = force * (2 + mouse.clickPulse * 15);
          
          this.x -= forceDirectionX * push;
          this.y -= forceDirectionY * push;
        }

        // Return to natural bounds slowly if pushed out
        if (this.x < -50) this.x = canvas!.width + 50;
        if (this.x > canvas!.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas!.height + 50;
        if (this.y > canvas!.height + 50) this.y = -50;
      }

      draw() {
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    let animationFrameId: number;
    const animate = () => {
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      mouse.clickPulse = Math.max(0, mouse.clickPulse - 0.05);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - (distance / connectionDistance);
            
            // Mouse proximity highlights connections
            const distToMouse = Math.sqrt(
              Math.pow(mouse.x - (particles[i].x + particles[j].x)/2, 2) + 
              Math.pow(mouse.y - (particles[i].y + particles[j].y)/2, 2)
            );
            
            let strokeOpacity = opacity * 0.2;
            if (distToMouse < mouse.radius) {
              strokeOpacity += (1 - distToMouse / mouse.radius) * 0.5;
            }

            // Determine line color based on particle colors
            const isSpecial = particles[i].isGlitch || particles[j].isGlitch;
            ctx.strokeStyle = isSpecial 
              ? `rgba(244, 63, 94, ${strokeOpacity})` 
              : `rgba(255, 255, 255, ${strokeOpacity})`;
            
            ctx.lineWidth = isSpecial ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
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
