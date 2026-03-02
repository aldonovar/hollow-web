import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function AnimatedBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // 1. Slow continuous rotation for the outer rings
            gsap.to('.ring-slow', {
                rotation: 360,
                transformOrigin: "center center",
                duration: 40,
                ease: 'none',
                repeat: -1,
            });

            gsap.to('.ring-reverse', {
                rotation: -360,
                transformOrigin: "center center",
                duration: 60,
                ease: 'none',
                repeat: -1,
            });

            // 2. Breathing path animations (Stroke Dash)
            gsap.to('.bg-pulse-path', {
                strokeDashoffset: 0,
                strokeDasharray: '0, 800',
                duration: 15,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
            });

            // 3. Deep Parallax Effect based on scroll
            gsap.fromTo('.parallax-deep',
                { y: 0, scale: 1 },
                {
                    y: -300,
                    scale: 1.1,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: 'body',
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1.5,
                    }
                }
            );

            gsap.fromTo('.parallax-mid',
                { y: 0, rotation: 0 },
                {
                    y: -150,
                    rotation: 15,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: 'body',
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1,
                    }
                }
            );

            gsap.fromTo('.floating-node',
                { y: 'random(-20, 20)', x: 'random(-20, 20)', opacity: 0.2 },
                {
                    y: 'random(-50, 50)',
                    x: 'random(-50, 50)',
                    opacity: 0.6,
                    duration: 5,
                    ease: 'sine.inOut',
                    repeat: -1,
                    yoyo: true,
                    stagger: { amount: 2, from: 'random' }
                }
            );

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            pointerEvents: 'none',
            background: 'radial-gradient(120% 120% at 50% 0%, #090a10 0%, #050508 100%)',
            overflow: 'hidden'
        }}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="grad-lilac" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#090a10" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="grad-ruby" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#090a10" stopOpacity="0" />
                    </linearGradient>
                    {/* Subtle glow filter */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Deep Parallax Group (Grid & Large Elements) */}
                <g className="parallax-deep">
                    {/* Technical Grid background */}
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.03" />
                    </pattern>
                    <rect width="2000" height="2000" x="-500" y="-500" fill="url(#grid)" />

                    {/* Large diffuse ruby glow */}
                    <circle cx="800" cy="200" r="400" fill="url(#grad-ruby)" filter="url(#glow)" opacity="0.6" />
                    <circle cx="200" cy="800" r="500" fill="url(#grad-lilac)" filter="url(#glow)" opacity="0.6" />
                </g>

                {/* Mid Parallax Group (Concentric technical circles) */}
                <g className="parallax-mid" style={{ transformOrigin: '500px 500px' }}>

                    <g className="ring-slow">
                        <circle cx="500" cy="500" r="350" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.15" strokeDasharray="4 12" />
                        <circle cx="500" cy="500" r="420" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
                        <path className="bg-pulse-path" strokeDasharray="1000, 1000" fill="none" stroke="#f43f5e" strokeWidth="1.5" opacity="0.3" d="M 150 500 A 350 350 0 0 1 850 500 A 350 350 0 0 1 150 500" />
                    </g>

                    <g className="ring-reverse">
                        <circle cx="500" cy="500" r="280" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" strokeDasharray="20 10 5 10" />
                        <circle cx="500" cy="500" r="210" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.1" />
                        <path d="M 500 220 L 500 780 M 220 500 L 780 500" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
                        {/* Center abstract geometric core */}
                        <path d="M 500 380 L 620 500 L 500 620 L 380 500 Z" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.2" />
                        <circle cx="500" cy="500" r="50" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.05" />
                    </g>

                    {/* Abstract Sine Wave / Audio Oscilloscope */}
                    <path className="bg-pulse-path" d="M -200 600 Q 150 400 500 600 T 1200 600" fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.2" filter="url(#glow)" />
                    <path className="bg-pulse-path" d="M -200 400 Q 150 600 500 400 T 1200 400" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.15" />
                </g>

                {/* Floating Data Nodes */}
                <g>
                    {[...Array(20)].map((_, i) => (
                        <circle
                            key={i}
                            className="floating-node"
                            cx={100 + Math.random() * 800}
                            cy={100 + Math.random() * 800}
                            r={1 + Math.random() * 3}
                            fill={i % 2 === 0 ? '#a855f7' : '#ffffff'}
                        />
                    ))}
                </g>
            </svg>

            {/* Dynamic Overlay Gradient to anchor the text */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(9,10,16,0.3) 0%, rgba(9,10,16,0.8) 100%)',
                pointerEvents: 'none'
            }}></div>
        </div>
    );
}
