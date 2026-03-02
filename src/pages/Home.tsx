import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { capabilities, heroStats } from '../content';

export function Home() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

            tl.fromTo('.hero-subtitle',
                { autoAlpha: 0, y: 20 },
                { autoAlpha: 1, y: 0, duration: 0.8 },
                0.2
            )
                .fromTo('.hero-line',
                    { yPercent: 120, autoAlpha: 0 },
                    { yPercent: 0, autoAlpha: 1, stagger: 0.1, duration: 1.2 },
                    '-=0.6'
                )
                .fromTo('.hero-description',
                    { autoAlpha: 0, y: 30 },
                    { autoAlpha: 1, y: 0, duration: 1 },
                    '-=0.8'
                )
                .fromTo('.hero-visual',
                    { autoAlpha: 0, scale: 0.9 },
                    { autoAlpha: 1, scale: 1, duration: 2, ease: 'power2.out' },
                    '-=1.2'
                );

            gsap.utils.toArray<HTMLElement>('.reveal').forEach((elem) => {
                gsap.fromTo(elem,
                    { autoAlpha: 0, y: 60 },
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
                    { autoAlpha: 0, y: 40 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 1,
                        stagger: 0.1,
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
            <section className="hero container">
                <div className="hero-content">
                    <span className="hero-subtitle">La Máquina Perfecta</span>
                    <h1 className="hero-title">
                        <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>Silencia a</span></span>
                        <span className="line-wrap"><span className="hero-line" style={{ display: 'inline-block' }}>los Monolíticos.</span></span>
                    </h1>
                    <p className="hero-description">
                        HOLLOW BITS es la arquitectura DAW donde la latencia muere y el ruteo matemático puro florece. Desarrollado por ALLYX y Ethereal Sounds para ingenieros cansados de motores heredados colapsando bajo carga profesional.
                    </p>
                    <div style={{ marginTop: '2rem' }}>
                        <Link to="/engine" className="nav-button primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1rem' }}>
                            Ver Benchmarks Técnicos <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                <div className="hero-visual" aria-hidden="true" style={{ position: 'relative' }}>
                    <div className="spectral-line" style={{ width: '100%', height: '1px', background: 'var(--text-secondary)', position: 'absolute', top: '30%' }} />
                    <div className="spectral-line" style={{ width: '100%', height: '1px', background: 'var(--text-secondary)', position: 'absolute', top: '60%' }} />
                </div>
            </section>

            <div className="container" style={{ borderTop: '1px solid var(--border-subtle)' }}>
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

            <section className="section container">
                <header className="section-header reveal">
                    <span className="section-label">Superioridad Funcional</span>
                    <h2 className="section-title">Workflow diseñado contra la ineficiencia.</h2>
                    <p className="section-description">
                        Logic Pro te ata al arrangement. Ableton Live colapsa en mezclas de post-producción. HOLLOW BITS funde los mundos en un motor asíncrono infalible.
                    </p>
                </header>

                <div className="card-grid stagger-group">
                    {capabilities.map(cap => (
                        <article key={cap.title} className="card stagger-item">
                            <h3 className="card-title">{cap.title}</h3>
                            <p className="card-text">{cap.body}</p>
                            <ul className="card-list">
                                {cap.bullets.map((bullet, idx) => (
                                    <li key={idx} className="card-list-item">{bullet}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
}
