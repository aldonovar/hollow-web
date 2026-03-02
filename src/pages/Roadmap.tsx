import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { roadmap } from '../content';

export function Roadmap() {
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
        });

        return () => ctx.revert();
    }, []);

    return (
        <div style={{ paddingTop: '150px' }}>
            <section className="section container">
                <header className="section-header reveal">
                    <span className="section-label">Nuestro Camino</span>
                    <h2 className="section-title">Evolución Continua.</h2>
                    <p className="section-description">
                        Nuestro compromiso es contigo. Una hoja de ruta clara enfocada en revolucionar las herramientas creativas, actualizando el core DAW con precisión.
                    </p>
                </header>

                <div className="timeline" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {roadmap.map((item, idx) => (
                        <div key={item.phase} className={`timeline-item ${idx === 0 ? 'active' : ''} reveal`}>
                            <h3 className="timeline-focus" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>{item.phase}</h3>
                            <p className="card-text" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{item.focus}</p>
                            <ul className="card-list">
                                {item.deliverables.map((del, dIdx) => (
                                    <li key={dIdx} className="card-list-item">{del}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
