import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      gsap.to('.ambient-backdrop__orb--one', {
        xPercent: 8,
        yPercent: -5,
        duration: 18,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.ambient-backdrop__orb--two', {
        xPercent: -10,
        yPercent: 12,
        duration: 24,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.ambient-backdrop__orb--three', {
        xPercent: 12,
        yPercent: 4,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.ambient-backdrop__ring', {
        rotate: 360,
        transformOrigin: '50% 50%',
        duration: 80,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.ambient-backdrop__line', {
        strokeDashoffset: -180,
        duration: 10,
        repeat: -1,
        ease: 'none',
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="ambient-backdrop" ref={containerRef} aria-hidden="true">
      <div className="ambient-backdrop__wash ambient-backdrop__wash--one" />
      <div className="ambient-backdrop__wash ambient-backdrop__wash--two" />
      <div className="ambient-backdrop__orb ambient-backdrop__orb--one" />
      <div className="ambient-backdrop__orb ambient-backdrop__orb--two" />
      <div className="ambient-backdrop__orb ambient-backdrop__orb--three" />
      <svg
        className="ambient-backdrop__grid"
        viewBox="0 0 1440 1440"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ambientLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <g className="ambient-backdrop__ring">
          <circle cx="1040" cy="360" r="220" />
          <circle cx="1040" cy="360" r="320" />
          <circle cx="1040" cy="360" r="420" />
        </g>
        <path
          className="ambient-backdrop__line"
          d="M-40 760 C160 680, 240 920, 460 840 S820 660, 1040 820 S1340 980, 1480 860"
        />
        <path
          className="ambient-backdrop__line ambient-backdrop__line--soft"
          d="M-60 420 C120 560, 340 220, 560 380 S980 520, 1200 360 S1440 220, 1500 260"
        />
      </svg>
      <div className="ambient-backdrop__grain" />
    </div>
  );
}
