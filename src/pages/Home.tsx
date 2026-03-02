import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { capabilities, heroStats } from '../content';

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
                );

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

                {/* Crosshair Visual — Kode Immersive style */}
                <div className="hero-visual" aria-hidden="true">
                    <div className="hero-corner tl"></div>
                    <div className="hero-corner tr"></div>
                    <div className="hero-corner bl"></div>
                    <div className="hero-corner br"></div>
                    <div className="hero-crosshair-ring"></div>
                    <div className="hero-crosshair-dot"></div>
                </div>
            </section>

            {/* Stats strip */}
            <div className="container">
                <div className="stats-grid stagger-group">
                    {heroStats.map(stat => (
                        <div key={stat.label} className="stat-item stagger-item">
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
                    <span className="section-label">[ 001 ] EL DAW DEFINITIVO</span>
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
