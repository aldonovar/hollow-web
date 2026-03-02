import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function Contact() {
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
                    <span className="section-label">Early Access B2B</span>
                    <h2 className="section-title">Acceso de Nivel Empresarial.</h2>
                    <p className="section-description">
                        HOLLOW BITS no es un plugin de juguete para recintos bedroom. Filtramos la adquisición para estudios profesionales, casas productoras y veteranos del diseño sonoro.
                    </p>
                </header>

                <div className="reveal" style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={(e) => e.preventDefault()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Instalación / Estudio (o Alias Pro)</label>
                            <input type="text" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '1rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} placeholder="Tu organización técnica..." required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Correo Electrónico (Solo dominios B2B o verificados)</label>
                            <input type="email" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '1rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} placeholder="host@studio.com" required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Workflow Actual (DAW principal a reemplazar)</label>
                            <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '1rem', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}>
                                <option>Ableton Live (Cargas de UI / Dropouts)</option>
                                <option>Logic Pro (Arquitectura Estancada Core-Audio)</option>
                                <option>Pro Tools (Lentitud de DSP)</option>
                                <option>FL Studio / Otros</option>
                            </select>
                        </div>
                        <button className="nav-button primary" style={{ marginTop: '1rem', padding: '1.25rem', justifyContent: 'center', fontSize: '1rem' }}>
                            Solicitar Evaluación de Hardware
                        </button>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '1rem' }}>
                            Las solicitudes comerciales son auditadas manualmente. No aprobamos hardware incapaz de soportar cálculo matemático extremo.
                        </p>
                    </form>
                </div>
            </section>
        </div>
    );
}
