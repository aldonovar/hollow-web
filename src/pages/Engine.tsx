import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { engineHighlights, matrixLegend } from '../content';

export function Engine() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
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

            gsap.to('.data-stream', { strokeDashoffset: -100, duration: 2, ease: 'none', repeat: -1 });
            gsap.to('.data-stream-2', { strokeDashoffset: 100, duration: 4, ease: 'none', repeat: -1 });
        });

        return () => ctx.revert();
    }, []);

    return (
        <div style={{ paddingTop: '150px' }}>
            <section className="section container">
                <header className="section-header reveal">
                    <span className="section-label">THE ENGINE</span>
                    <h2 className="section-title">Precisión<br /><span style={{ color: 'var(--text-tertiary)' }}>Matemática.</span></h2>
                    <p className="section-description">
                        Scheduler Dual (Worklet-node nativo), buffers de latencia cero y recuperación iterativa en hilo secundario. El estándar profesional indiscutible.
                    </p>
                </header>

                <div className="grid-2">
                    <div className="timeline">
                        {engineHighlights.map((hl, idx) => (
                            <div key={hl.title} className={`timeline-item ${idx === 0 ? 'active' : ''} reveal`}>
                                <h3 className="timeline-focus" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{hl.title}</h3>
                                <p className="card-text">{hl.body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ height: '300px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-strong)" strokeWidth="1" />
                                </pattern>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                                <path className="data-stream" d="M 0 150 Q 100 50 200 150 T 400 150 T 600 150 T 800 150" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray="10 10" />
                                <path className="data-stream-2" d="M 0 200 Q 150 250 300 100 T 600 200 T 900 100" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="5 15" />
                            </svg>
                            <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>LIVE A/B BENCHMARK - WORKLET VS INTERVAL</div>
                        </div>
                        <div className="grid-3 stagger-group" style={{ gap: '1rem' }}>
                            {matrixLegend.map(lg => (
                                <div key={lg.value} className="card stagger-item" style={{ padding: '1.5rem' }}>
                                    <span className="stat-label" style={{ color: lg.value === 'PASS' ? 'var(--text-primary)' : lg.value === 'WARN' ? 'var(--accent-primary)' : '#ff2a00' }}>{lg.value}</span>
                                    <h4 style={{ fontSize: '1rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>{lg.label}</h4>
                                    <p className="stat-detail" style={{ fontSize: '0.75rem' }}>{lg.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
