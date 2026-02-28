export interface NavItem {
  id: string;
  label: string;
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
  { id: 'vision', label: 'Vision' },
  { id: 'hollow-bits', label: 'HOLLOW BITS' },
  { id: 'engine', label: 'Engine' },
  { id: 'ecosistema', label: 'Ecosistema' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'contacto', label: 'Contacto' }
];

export const heroStats: StatItem[] = [
  {
    value: '40',
    label: 'Casos de matriz de audio',
    detail: 'Validacion SR x Buffer en la app para medir estabilidad real antes de release.'
  },
  {
    value: '6',
    label: 'Escenarios benchmark A/B',
    detail: 'Comparativa interval vs worklet-clock en cargas medium, high y extreme.'
  },
  {
    value: '160',
    label: 'Tracks en modo extreme',
    detail: 'Pruebas de estres para sesiones grandes con enfoque profesional.'
  },
  {
    value: 'Win',
    label: 'Objetivo worklet >= 60%',
    detail: 'Gate de performance medible para elegir scheduler por datos, no por intuicion.'
  }
];

export const capabilities: CapabilityItem[] = [
  {
    title: 'Flujo completo de produccion',
    body: 'Arrange, session, mixer, editor y export viven en un flujo continuo pensado para producir sin friccion.',
    bullets: [
      'Timeline y transporte determinista para sesiones largas.',
      'Session workflow para clips, escenas y performance.',
      'Export master + stems con formatos pro y control de calidad.'
    ]
  },
  {
    title: 'Confiabilidad primero',
    body: 'HOLLOW BITS no solo suena bien, se valida con protocolos tecnicos concretos que se convierten en valor comercial.',
    bullets: [
      'Matriz de confiabilidad SR x Buffer con reporte PASS/WARN/FAIL.',
      'Performance gate con presupuestos p95 y p99 definidos.',
      'Autosave, recovery y chequeo de integridad de proyecto.'
    ]
  },
  {
    title: 'Audio y MIDI con profundidad real',
    body: 'Edicion avanzada, automation, routing y arquitectura de engine para escalar desde ideas rapidas hasta sesiones complejas.',
    bullets: [
      'Clip operations completas: split, duplicate, reverse, quantize, consolidate.',
      'Automation lane con modos read, touch, latch y write.',
      'Routing con grupos, returns, sends pre/post y control de mezcla.'
    ]
  },
  {
    title: 'Capa inteligente util',
    body: 'La capa AI y herramientas asistidas se orientan a acciones de estudio que ahorran tiempo.',
    bullets: [
      'Asistencia para patrones MIDI y analisis de mezcla.',
      'Audio to MIDI scanner para prototipado veloz.',
      'Base para colaboracion y flujos contextuales futuros.'
    ]
  }
];

export const engineHighlights: EngineItem[] = [
  {
    title: 'Scheduler dual con fallback robusto',
    body: 'Worklet-clock como modo recomendado y interval como respaldo controlado para mantener continuidad en diferentes entornos.'
  },
  {
    title: 'Benchmark extremo con trazabilidad',
    body: 'Reportes JSON exportables, historial y comparativa directa por escenario para tomar decisiones tecnicas y de producto.'
  },
  {
    title: 'Presupuestos claros de performance',
    body: 'drift p95 <= 36ms, drift p99 <= 95ms, lag p95 <= 32ms, loop p99 <= 34ms y win-rate minimo de 60%.'
  },
  {
    title: 'Engine desktop-first para Windows',
    body: 'Pensado para estabilidad nativa de uso diario en Windows, con ruta de expansion hacia Linux y macOS.'
  }
];

export const matrixLegend: StatItem[] = [
  {
    value: 'PASS',
    label: 'Contexto y render en objetivo',
    detail: 'AudioContext running, graph valido y timing dentro de tolerancia.'
  },
  {
    value: 'WARN',
    label: 'Fallback o drift no critico',
    detail: 'Se detecta desviacion menor y se recomienda revision preventiva.'
  },
  {
    value: 'FAIL',
    label: 'Condicion critica detectada',
    detail: 'Contexto invalido, graph roto o render silencioso: bloquea release candidate.'
  }
];

export const services: ServiceItem[] = [
  {
    title: 'Produccion discografica',
    body: 'Ethereal Sounds integra direccion creativa, arreglo, produccion y supervision tecnica para proyectos comerciales.',
    outcomes: [
      'Direccion sonora alineada a marca y audiencia.',
      'Pipeline de produccion de idea a master final.',
      'Entrega lista para distribucion y contenido.'
    ]
  },
  {
    title: 'Mix y mastering de precision',
    body: 'Proceso de mezcla orientado a traduccion multiplataforma con control de dinamica, imagen y headroom.',
    outcomes: [
      'Mixes consistentes en estudio, club, auto y mobile.',
      'Master adaptado a release, branding y formato.',
      'Versionado rapido para campañas y revisiones.'
    ]
  },
  {
    title: 'Sound design y bibliotecas',
    body: 'Creacion de identidades sonoras, presets, texturas y recursos de libreria para produccion moderna.',
    outcomes: [
      'Timbres originales con sello ALLYX / Ethereal.',
      'Kits y assets para acelerar sesiones HOLLOW BITS.',
      'Diseno sonoro para contenido, marca y performance.'
    ]
  },
  {
    title: 'Performance engineering',
    body: 'Preparacion tecnica de sets en vivo y sesiones complejas con enfoque en estabilidad y control creativo.',
    outcomes: [
      'Template de live set optimizado por escenas.',
      'Routing, stems y snapshots listos para escenario.',
      'Plan de contingencia para shows y streaming.'
    ]
  },
  {
    title: 'Formacion y adopcion pro',
    body: 'Capacitacion para equipos creativos y productores que buscan dominar el ecosistema de manera profesional.',
    outcomes: [
      'Onboarding tecnico para estudios y talentos.',
      'Metodologia de trabajo con less clicks, more results.',
      'Buenas practicas de calidad y release readiness.'
    ]
  }
];

export const roadmap: RoadmapItem[] = [
  {
    phase: 'Q1 - Foundation and determinism',
    focus: 'Transport, clip operations, recording hardening y base de testeo.',
    deliverables: [
      'Determinismo de transporte en stress real.',
      'Acciones visibles de clip 100% funcionales y undoable.',
      'Ruta de recovery y seguridad de proyecto robusta.'
    ]
  },
  {
    phase: 'Q2 - Pro production depth',
    focus: 'MIDI audible engine, automation runtime y routing avanzado.',
    deliverables: [
      'Produccion completa con herramientas nativas.',
      'Automation estable en proyectos de escala.',
      'Paridad de export entre rutas de render.'
    ]
  },
  {
    phase: 'Q3 - Session and live performance',
    focus: 'Session view v2, freeze/bounce, control de CPU y edicion avanzada.',
    deliverables: [
      'Workflow de performance en vivo de baja friccion.',
      'Escenas y lanzamientos con respuesta consistente.',
      'Control de carga para setlists complejas.'
    ]
  },
  {
    phase: 'Q4 - Differentiation layer',
    focus: 'Colaboracion, AI action engine y hardening de release desktop.',
    deliverables: [
      'Funciones diferenciales sobre DAWs tradicionales.',
      'Flujos AI accionables dentro del proyecto.',
      'Telemetria y rollout por etapas para versiones nuevas.'
    ]
  }
];

export const faqs: FaqItem[] = [
  {
    question: 'En que plataforma corre HOLLOW BITS hoy?',
    answer: 'El foco actual es Windows desktop-first. Linux y macOS ya estan contemplados en el roadmap y la arquitectura se prepara para esa expansion.'
  },
  {
    question: 'Que diferencia a HOLLOW BITS frente a un DAW tradicional?',
    answer: 'La combinacion de workflow rapido, validacion tecnica integrada, performance gate medible y una capa creativa orientada a resultados concretos.'
  },
  {
    question: 'La web solo presenta software o tambien servicios?',
    answer: 'Presenta el ecosistema completo: DAW, servicios de Ethereal Sounds, direccion de ALLYX y pipeline tecnico-comercial para proyectos reales.'
  },
  {
    question: 'Se puede integrar a un estudio profesional?',
    answer: 'Si. La propuesta incluye export multiformato, stems, control de mezcla, protocolos de calidad y una ruta de adopcion para equipos de produccion.'
  }
];
