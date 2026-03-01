import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function AnimatedBackground() {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const ctx = gsap.context(() => {
            // 1. Subtle persistent breathing animation for the paths
            gsap.to('.bg-path', {
                strokeDashoffset: 0,
                strokeDasharray: '0, 1000',
                duration: 20,
                ease: 'none',
                repeat: -1,
                yoyo: true,
            });

            // 2. Scroll-linked parallax effect for the entire SVG group
            gsap.fromTo('.bg-group',
                { y: 0, rotation: 0 },
                {
                    y: -150,
                    rotation: 5,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: 'body',
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1, // Smooth scrubbing
                    }
                }
            );
        }, svgRef);

        return () => ctx.revert();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            pointerEvents: 'none',
            opacity: 0.15, // Keep it very subtle to maintain the minimal text focus
            overflow: 'hidden'
        }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g className="bg-group" stroke="var(--text-secondary)" strokeWidth="0.5" fill="none" opacity="0.3">
                    {/* Architectural / mathematical minimal lines */}
                    <path className="bg-path" strokeDasharray="1000, 1000" d="M -200 200 L 1200 200" />
                    <path className="bg-path" strokeDasharray="1000, 1000" d="M -200 500 L 1200 500" />
                    <path className="bg-path" strokeDasharray="1000, 1000" d="M -200 800 L 1200 800" />

                    <path className="bg-path" strokeDasharray="1000, 1000" d="M 300 -200 L 300 1200" />
                    <path className="bg-path" strokeDasharray="1000, 1000" d="M 700 -200 L 700 1200" />

                    {/* Concentric precise circles */}
                    <circle cx="500" cy="500" r="300" strokeWidth="0.2" />
                    <circle cx="500" cy="500" r="450" strokeWidth="0.1" />

                    {/* Diagonal cutting lines */}
                    <path className="bg-path" strokeDasharray="1000, 1000" d="M 0 0 L 1000 1000" strokeWidth="0.1" />
                </g>
            </svg>
        </div>
    );
}
