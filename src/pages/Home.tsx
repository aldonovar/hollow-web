import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { capabilities, heroStats } from '../content';

function HollowBitsAnimatedLogo() {
    return (
        <div className="hero-visual" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 800 250" style={{ width: '150%', height: 'auto', maxWidth: '800px', transform: 'scale(1.2) translateX(-5%)' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gLogo" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#e11d48', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="gText" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f43f5e', stopOpacity: 1 }} />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Subtle Stars */}
                <g fill="#ffffff" opacity="0" className="logo-stars-group">
                    {[
                        { cx: 50, cy: 40, r: 1.5 }, { cx: 120, cy: 180, r: 1.2 }, { cx: 300, cy: 30, r: 1.8 },
                        { cx: 550, cy: 200, r: 1.1 }, { cx: 700, cy: 60, r: 1.4 }, { cx: 750, cy: 220, r: 1.3 },
                        { cx: 400, cy: 10, r: 0.7 }, { cx: 20, cy: 100, r: 1.6 }, { cx: 600, cy: 130, r: 0.8 }
                    ].map((s, i) => (
                        <circle key={i} className="logo-star" cx={s.cx} cy={s.cy} r={s.r} />
                    ))}
                </g>

                <g transform="translate(160, 75)">
                    {/* Logo (Left) */}
                    <g filter="url(#glow)">
                        <circle className="logo-main-ring" cx="50" cy="50" r="42" stroke="url(#gLogo)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        <ellipse className="logo-ring logo-ring-1" cx="50" cy="50" rx="38" ry="12" stroke="url(#gLogo)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                        <ellipse className="logo-ring logo-ring-2" cx="50" cy="50" rx="38" ry="12" stroke="url(#gLogo)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                        <ellipse className="logo-ring logo-ring-3" cx="50" cy="50" rx="38" ry="12" stroke="url(#gLogo)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                    </g>

                    {/* Text (Right) */}
                    <g transform="translate(130, 20)">
                        <text className="logo-hollow" x="0" y="32" fontFamily="var(--font-sans)" fontWeight="900" fontSize="54" letterSpacing="0.25em" fill="#ffffff">HOLLOW</text>
                        <g transform="translate(190, 92) scale(1.26, 1)">
                            <text className="logo-bits bits-signature" x="0" y="0" textAnchor="middle" fontWeight="400" fontSize="56" letterSpacing="0.01em" fill="url(#gText)">bits</text>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    );
}

export function Home() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

            tl.fromTo('.hero-subtitle',
                { autoAlpha: 0, x: -20 },
                { autoAlpha: 1, x: 0, duration: 1 },
                0.3
            )
                .fromTo('.hero-line',
                    { yPercent: 110, autoAlpha: 0 },
                    { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 1.4 },
                    '-=0.6'
                )
                .fromTo('.hero-description',
                    { autoAlpha: 0, y: 20 },
                    { autoAlpha: 1, y: 0, duration: 1 },
                    '-=0.8'
                )
                .fromTo('.hero-meta',
                    { autoAlpha: 0, y: 20 },
                    { autoAlpha: 1, y: 0, duration: 0.8 },
                    '-=0.6'
                )
                .fromTo('.hero-visual',
                    { autoAlpha: 0 },
                    { autoAlpha: 1, duration: 2, ease: 'power2.out' },
                    0.8
                )
                // SVG Logo Animations
                .to('.logo-stars-group', { autoAlpha: 0.4, duration: 1 }, 0.5)
                .fromTo('.logo-star',
                    { scale: 0 },
                    { scale: 1, stagger: 0.05, duration: 0.8, ease: 'back.out(2)' },
                    0.5
                )
                .fromTo('.logo-main-ring',
                    { scale: 0, autoAlpha: 0 },
                    { scale: 1, autoAlpha: 1, duration: 1.5, ease: 'back.out(1.7)', transformOrigin: '50px 50px' },
                    0.6
                )
                .fromTo('.logo-ring-1',
                    { scale: 0, rotation: -90, autoAlpha: 0 },
                    { scale: 1, rotation: 0, autoAlpha: 0.9, duration: 1.5, ease: 'power3.out', transformOrigin: '50px 50px' },
                    0.8
                )
                .fromTo('.logo-ring-2',
                    { scale: 0, rotation: -30, autoAlpha: 0 },
                    { scale: 1, rotation: 60, autoAlpha: 0.9, duration: 1.5, ease: 'power3.out', transformOrigin: '50px 50px' },
                    0.9
                )
                .fromTo('.logo-ring-3',
                    { scale: 0, rotation: 30, autoAlpha: 0 },
                    { scale: 1, rotation: 120, autoAlpha: 0.9, duration: 1.5, ease: 'power3.out', transformOrigin: '50px 50px' },
                    1.0
                )
                .fromTo('.logo-hollow',
                    { x: -30, autoAlpha: 0 },
                    { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out' },
                    1.0
                )
                .fromTo('.logo-bits',
                    { x: 30, autoAlpha: 0 },
                    { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out' },
                    1.2
                );

            // Continuous floating/spinning atoms
            gsap.to('.logo-ring-1', { rotation: 360, duration: 20, repeat: -1, ease: 'none', transformOrigin: '50px 50px' });
            gsap.to('.logo-ring-2', { rotation: 420, duration: 25, repeat: -1, ease: 'none', transformOrigin: '50px 50px' });
            gsap.to('.logo-ring-3', { rotation: 480, duration: 30, repeat: -1, ease: 'none', transformOrigin: '50px 50px' });

            gsap.utils.toArray<HTMLElement>('.reveal').forEach((elem) => {
                gsap.fromTo(elem,
                    { autoAlpha: 0, y: 50 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1.2,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: elem,
                            start: 'top 85%',
                            once: true
                        }
                    }
                );
            });

            gsap.utils.toArray<HTMLElement>('.stagger-group').forEach((group) => {
                const items = group.querySelectorAll('.stagger-item');
                gsap.fromTo(items,
                    { autoAlpha: 0, y: 30 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1,
                        stagger: 0.08,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: group,
                            start: 'top 85%',
                            once: true
                        }
                    }
                );
            });

            ScrollTrigger.refresh();
        });

        return () => ctx.revert();
    }, []);

    return (
        <>
            {/* HERO — Giant Editorial */}
            <section className="hero container">
                <div className="hero-content">
                    <span className="hero-subtitle">// CREA SIN CORTES — V0.9 ALPHA</span>
                    <h1 className="hero-title">
                        <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>COMPÓN</span></span>
                        <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block', color: 'var(--text-tertiary)' }}>SIN</span></span>
                        <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>LÍMITES.</span></span>
                    </h1>
                    <p className="hero-description">
                        HOLLOW BITS es el DAW diseñado para que la inspiración fluya sin barreras técnicas.
                        Un motor nativo inquebrantable construido para músicos y sound designers que exigen latencia cero y libertad creativa pura.
                    </p>

                    <div className="hero-meta stagger-group">
                        {heroStats.slice(0, 4).map(stat => (
                            <div key={stat.label} className="hero-meta-item stagger-item">
                                <strong>{stat.value}</strong>
                                {stat.label}
                            </div>
                        ))}
                        <div className="hero-meta-item stagger-item" style={{ marginLeft: 'auto' }}>
                            <Link to="/engine" className="hud-link">
                                EXPLORAR EL MOTOR →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Giant SVG Logo replaces generic visual */}
                <HollowBitsAnimatedLogo />
            </section>

            {/* Stats strip */}
            <div className="container" style={{ marginTop: '2rem' }}>
                <div className="stats-grid stagger-group" style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-20px', left: '2rem', background: 'var(--bg-primary)', padding: '0 10px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', letterSpacing: '0.2em' }}>
                        SYS_METRICS_V0.9
                    </div>
                    {heroStats.map(stat => (
                        <div key={stat.label} className="stat-item stagger-item">
                            <span style={{ fontSize: '0.6rem', color: '#10b981', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>[ ONLINE ]</span>
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-detail">{stat.detail}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Capabilities section */}
            <section className="section container">
                <header className="section-header reveal">
                    <span className="section-label">[ 001 ] EL DAW DEFINITIVO // CAPABILITIES</span>
                    <h2 className="section-title">Workflow diseñado<br /><span style={{ color: 'var(--text-tertiary)' }}>para tu inspiración.</span></h2>
                    <p className="section-description">
                        Combina la inmediatez de la vista de sesión con la profundidad de un arreglo tradicional.
                        HOLLOW BITS funde ambos mundos en un entorno creativo fluido e inquebrantable.
                    </p>
                </header>

                <div className="card-grid stagger-group">
                    {capabilities.map((cap, idx) => (
                        <article key={cap.title} className="card stagger-item">
                            <div className="card-index">{String(idx + 1).padStart(2, '0')}</div>
                            <h3 className="card-title">{cap.title}</h3>
                            <p className="card-text">{cap.body}</p>
                            <ul className="card-list">
                                {cap.bullets.map((bullet, bi) => (
                                    <li key={bi} className="card-list-item">{bullet}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
}
