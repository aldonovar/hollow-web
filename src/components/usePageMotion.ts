import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let motionRegistered = false;

function ensureMotionPlugin() {
  if (!motionRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    motionRegistered = true;
  }
}

export function usePageMotion() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    ensureMotionPlugin();

    const root = containerRef.current;
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(
          [
            '[data-route-shell]',
            '[data-page-hero]',
            '[data-reveal]',
            '[data-stagger-item]',
            '[data-parallax]',
          ],
          {
            clearProps: 'all',
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
          },
        );
        return;
      }

      const routeShell = root.closest('[data-route-shell]');
      if (routeShell) {
        gsap.fromTo(
          routeShell,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' },
        );
      }

      const hero = root.querySelector<HTMLElement>('[data-page-hero]');
      if (hero) {
        gsap.fromTo(
          hero.children,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.12,
          },
        );
      }

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((node) => {
        gsap.fromTo(
          node,
          { autoAlpha: 0, y: 48 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: node,
              start: 'top 84%',
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>('[data-stagger-item]');
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: group,
              start: 'top 82%',
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((node) => {
        const shift = Number(node.dataset.parallax ?? 90);
        gsap.fromTo(
          node,
          { y: 0 },
          {
            y: -shift,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
            },
          },
        );
      });

      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  return containerRef;
}
