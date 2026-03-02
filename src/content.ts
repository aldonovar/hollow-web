export interface NavItem {
  id: string;
  label: string;
  path: string;
}

export interface StatItem {
  value: string;
  label: string;
  detail: string;
}

export interface CapabilityItem {
  title: string;
  body: string;
  bullets: string[];
}

export interface EngineItem {
  title: string;
  titleEng?: string;
  body: string;
}

export interface ServiceItem {
  title: string;
  body: string;
  outcomes: string[];
}

export interface RoadmapItem {
  phase: string;
  focus: string;
  deliverables: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const navItems: NavItem[] = [
  { id: 'home', label: 'Inicio', path: '/' },
  { id: 'engine', label: 'El Motor', path: '/engine' },
  { id: 'ecosistema', label: 'Flujo de Trabajo', path: '/ecosystem' },
  { id: 'roadmap', label: 'Evolución', path: '/roadmap' },
  { id: 'contacto', label: 'Acceso Temprano', path: '/contact' }
];

export const heroStats: StatItem[] = [
  {
    value: '0ms',
    label: 'Jitter de Transporte',
    detail: 'Determinismo de fase absoluto. Un reloj maestro que fluye al ritmo exacto de tu inspiración, sin titubeos del sistema.'
  },
  {
    value: 'Nativo',
    label: 'Desempeño Asíncrono',
    detail: 'Construido sobre Web Audio API Worklets. El límite de tu proyecto ahora es pura imaginación, no la sobrecarga del CPU.'
  },
  {
    value: '160+',
    label: 'Pistas Fluidas',
    detail: 'Arreglos orquestales o diseño sonoro extremo sin un solo dropout. Escala tus ideas sin miedo a que el motor colapse.'
  },
  {
    value: '<30ms',
    label: 'Roundtrip en Directo',
    detail: 'Toca instrumentos virtuales y monitorea efectos en tiempo real con latencia imperceptible. Siente la música, no el software.'
  }
];

export const capabilities: CapabilityItem[] = [
  {
    title: 'Flujo Ininterrumpido',
    body: 'Integramos la improvisación de una vista de sesión con el rigor de un arrangement tradicional. Compón y reconstruye al vuelo con un motor asíncrono.',
    bullets: [
      'Micro-cuantización expresiva avanzada.',
      'Warping multiproceso transparente.',
      'Bounce de precisión matemática.'
    ]
  },
  {
    title: 'Estabilidad de Escenario',
    body: 'Telemetría continua para garantizar que cada lanzamiento de clip y cada automatización ocurran con fiabilidad de hardware. Diseñado para el directo.',
    bullets: [
      'Motor aislado (Sandbox) anti-cuelgues.',
      'Recuperación asíncrona de buffers.',
      'Monitoreo visual táctico de salud.'
    ]
  },
  {
    title: 'Ruteo Modular Libre',
    body: 'Crea cadenas de señal alienígenas y procesa envíos infinitos. Diseño sonoro extremo sin los límites artificiales de los buses tradicionales.',
    bullets: [
      'Conexiones multi-nodo directas.',
      'Automatización spline 64-bits ultra-suave.',
      'Conversión AD/DA de emulación pura.'
    ]
  },
  {
    title: 'Asistencia Analítica',
    body: 'Herramientas de análisis forense que limpian la mezcla mientras mantienes el control creativo absoluto.',
    bullets: [
      'Alineación de transitorios rápida.',
      'Análisis de espectro proyectivo.',
      'Extracción Audio-a-MIDI orgánica.'
    ]
  }
];

export const engineHighlights: EngineItem[] = [
  {
    title: 'Liberando a tus Plugins',
    titleEng: 'Ending the DSP Bottleneck',
    body: 'Los DAWs antiguos obligan a todos tus sintetizadores pesados a hacer fila en el mismo procesador. Nuestro Scheduler Dual reparte la carga creativamente en múltiples Worklets de audio. Simplemente funciona más rápido y más suave.'
  },
  {
    title: 'Confianza Absoluta en tu Mezcla',
    body: 'Exporta cada stem con la tranquilidad de que la compensación de latencia fue exacta al bit. El motor compensa el retardo de cada cadena de plugins sin desalinear la fase de tus cajas y bombos.'
  },
  {
    title: 'Transparencia de Rendimiento',
    body: 'Mientras otros ocultan los cuellos de botella mediante suavizados que arruinan la transiente, HOLLOW BITS muestra su latencia interna real. El resultado es un sonido más punzante, táctil y directo.'
  },
  {
    title: 'Poder Bruto para Windows',
    body: 'Nacido en Windows para aprovechar hardware de alto rendimiento y CPUs masivos. Pronto disponible en macOS, expandiendo este estricto ecosistema a todos los estudios modernos.'
  }
];

export const matrixLegend: StatItem[] = [
  {
    value: 'PASS',
    label: 'Cálculo Isocrónico',
    detail: 'Fluidez impecable donde el procesamiento y la reproducción de audio están sincronizados a nivel milisegundo.'
  },
  {
    value: 'WARN',
    label: 'Drift Dinámico',
    detail: 'El motor detecta cargas pesadas (buses complejos) y se estabiliza internamente sin interrumpir la música.'
  },
  {
    value: 'FAIL',
    label: 'Protección Creativa',
    detail: 'Intervención extrema en caso de un pico letal. Congela plugins en el aire protegiendo el oído y los altavoces.'
  }
];

export const services: ServiceItem[] = [
  {
    title: 'Composición Intuitiva y Modular',
    body: 'Rompe el lienzo lineal. Un sistema de clips interconectado que incita a los "accidentes felices". Toca en vivo tus arreglos, reestructura canciones completas arrastrando macros y mantente siempre en ritmo.',
    outcomes: [
      'Lanzamiento de escenas sin cortes de audio perceptibles.',
      'Integración profunda de controladores MIDI y superficies de control.',
      'Escritura de MIDI fluida, inspirada en las mejores cajas de ritmos.'
    ]
  },
  {
    title: 'Sound Design Forense',
    body: 'Sintetizadores modulares integrados, manipulación espectral y cadenas de efectos que puedes guardar, compartir e invocar con un arrastrar-y-soltar.',
    outcomes: [
      'Rack de procesamiento profundo con macros mapeables.',
      'Resampling al vuelo: captura cualquier señal y trátala como audio fresco al instante.',
      'Librería base curada: sin relleno, solo sonidos listos para el club.'
    ]
  },
  {
    title: 'Performance en Directo (Live Stage)',
    body: 'Diseñado no solo para crear en casa, sino para llevarse a estadios. Interfaces legibles en la oscuridad y una respuesta táctil que rivaliza con el equipo analógico.',
    outcomes: [
      'Mapeo MIDI al vuelo con feedback visual instantáneo.',
      'Motor inquebrantable para correr stems base junto a sintetizadores en vivo.',
      'Manejo avanzado de tempo master e integración Ableton Link.'
    ]
  }
];

export const roadmap: RoadmapItem[] = [
  {
    phase: 'Versión V1 [Fundación]',
    focus: 'Establecer y pulir el motor de audio central. Confianza creativa total.',
    deliverables: [
      'Manejo de Instrumentos VST3 y AU con bridge ultra-rápido.',
      'Sistema nativo de warping de audio elástico.',
      'Bounce y Exportación hiper-rápida offline.'
    ]
  },
  {
    phase: 'Versión V1.5 [El Flujo]',
    focus: 'Expansión de herramientas de arreglo y mezcla enfocadas en el productor.',
    deliverables: [
      'Curvas de automatización avanzadas y modulación LFO global.',
      'Vista de mezcla rediseñada para análisis espectral rápido.',
      'Buses y envíos paralelos de ruteo libre.'
    ]
  },
  {
    phase: 'Versión V2 [El Escenario]',
    focus: 'Herramientas absolutas para live-performance y lanzar clips.',
    deliverables: [
      'Session View optimizada para pantallas táctiles y Push.',
      'Mapeos MIDI avanzados de multiparámetro (Macros).',
      'Sincronización multi-dispositivo y latencia cero para sets conjuntos.'
    ]
  },
  {
    phase: 'Versión V3 [Futuro]',
    focus: 'Copiloto de mezcla y aceleradores de producción innovadores.',
    deliverables: [
      'Alineación de fase predictiva para grabaciones de multi-micrófono.',
      'Matching de EQ entre pistas referencia.',
      'Ecosistema en la nube integrado para colaboraciones remotas sin pérdida.'
    ]
  }
];

export const faqs: FaqItem[] = [
  {
    question: '¿Por qué aprender otro DAW cuando uso Ableton/Logic todos los días?',
    answer: 'Porque tu flujo de trabajo merece evolucionar. HOLLOW BITS toma la vista de sesión rápida que amas y le inyecta un motor de cálculo crudo donde los proyectos gigantes no causan ralentizaciones. Es un upgrade técnico envuelto en el workflow del futuro.'
  },
  {
    question: '¿Es realmente más estable para presentaciones en vivo?',
    answer: 'Absolutamente. Mientras otros DAWs compiten en integrar mil funciones, nosotros construimos nuestra base alrededor del "Zero Dropout". El corazón de HOLLOW BITS utiliza Worklets en hilos secundarios para que, pase lo que pase en la UI, la música jamás se detenga.'
  },
  {
    question: 'Soy un sound designer. ¿Qué tiene para mí?',
    answer: 'Una caja de arena modular donde el ruteo no tiene reglas obligatorias. Puedes enviar retornos a otros retornos, automatizar con curvas de spline infinitamente suaves, y resamplear en segundos. Todo esto con fidelidad de 64 bits pura.'
  }
];
