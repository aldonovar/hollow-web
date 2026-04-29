import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function AnimatedBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.to('.bg-orb--1', { xPercent: 15, yPercent: -10, duration: 20, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.bg-orb--2', { xPercent: -12, yPercent: 8, duration: 25, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.bg-orb--3', { xPercent: 8, yPercent: -6, duration: 18, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}>
      <div className="bg-orb--1" style={{
        position: 'absolute', width: '50rem', height: '50rem', top: '-15rem', left: '-10rem',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12), transparent 65%)',
        filter: 'blur(40px)',
      }} />
      <div className="bg-orb--2" style={{
        position: 'absolute', width: '40rem', height: '40rem', bottom: '-10rem', right: '-8rem',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.09), transparent 65%)',
        filter: 'blur(40px)',
      }} />
      <div className="bg-orb--3" style={{
        position: 'absolute', width: '30rem', height: '30rem', top: '40%', left: '55%',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,132,252,0.06), transparent 60%)',
        filter: 'blur(30px)',
      }} />
    </div>
  );
}
