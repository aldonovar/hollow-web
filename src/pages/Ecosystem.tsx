import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { services } from '../content';

export function Ecosystem() {
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
        });

        return () => ctx.revert();
    }, []);

    return (
        <div style={{ paddingTop: '150px' }}>
            <section className="section container">
                <header className="section-header reveal">
                    <span className="section-label">Tu Estudio Reimaginado</span>
                    <h2 className="section-title">Herramientas para Artistas.</h2>
                    <p className="section-description">
                        Desde la composición hasta el master final. HOLLOW BITS te entrega un ecosistema integrado que potencia cada etapa de tu proceso creativo, sin compromisos acústicos ni barreras de procesamiento.
                    </p>
                </header>

                <div className="card-grid stagger-group">
                    {services.map(srv => (
                        <article key={srv.title} className="card stagger-item" style={{ background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '3rem' }}>
                            <h3 className="card-title">{srv.title}</h3>
                            <p className="card-text">{srv.body}</p>
                            <ul className="card-list">
                                {srv.outcomes.map((out, idx) => (
                                    <li key={idx} className="card-list-item">{out}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
