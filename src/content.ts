export interface RouteMeta {
  id: string; label: string; path: string;
}

export interface MetricCardData {
  value: string; label: string; detail: string;
}

export interface FeatureCardData {
  icon: string; title: string; body: string;
}

export interface PricingTier {
  name: string; price: string; period: string; desc: string;
  features: string[]; featured?: boolean; cta: string;
}

export interface RoadmapPhaseData {
  phase: string; horizon: string; body: string;
  deliverables: string[];
}

export interface ConsoleFeature {
  icon: string; title: string; body: string;
}

export const routeMeta: RouteMeta[] = [
  { id: 'home', label: 'Inicio', path: '/' },
  { id: 'features', label: 'Features', path: '/features' },
  { id: 'pricing', label: 'Pricing', path: '/pricing' },
  { id: 'console', label: 'Console', path: '/console' },
  { id: 'roadmap', label: 'Roadmap', path: '/roadmap' },
  { id: 'contact', label: 'Contacto', path: '/contact' },
];

export const heroMetrics: MetricCardData[] = [
  { value: '<2ms', label: 'Latencia nativa', detail: 'Motor WASAPI exclusivo con scheduling determinístico de alta precisión.' },
  { value: '∞', label: 'Sesiones simultáneas', detail: 'Colabora en tiempo real con múltiples productores en el mismo proyecto.' },
  { value: '40+', label: 'Checks de calidad', detail: 'Matrix de confiabilidad SR×Buffer validada antes de cada release.' },
  { value: 'Web+Desktop', label: 'Dual platform', detail: 'El mismo estudio profesional en tu escritorio o desde cualquier navegador.' },
];

export const coreFeatures: FeatureCardData[] = [
  { icon: 'Cpu', title: 'Motor Nativo Rust', body: 'Audio engine construido en Rust con WASAPI exclusivo. Zero-copy buffer management y scheduling determinístico para latencia imperceptible.' },
  { icon: 'Users', title: 'Colaboración en Tiempo Real', body: 'Comparte un enlace y produce junto a tu equipo. Edición simultánea con resolución de conflictos y snapshots automáticos.' },
  { icon: 'LayoutGrid', title: 'Session + Arrange Unificado', body: 'Flujo dual sin fricción. Lanza clips en session view y transiciona al arrange sin perder contexto ni momentum creativo.' },
  { icon: 'Sparkles', title: 'IA Contextual', body: 'Co-productor inteligente que sugiere mezcla, arreglo y correcciones dentro de tu flujo. No es chat: es acción directa sobre tu proyecto.' },
  { icon: 'HardDrive', title: 'Cloud + Local-First', body: 'Tu proyecto vive en tu máquina. La nube sincroniza, respalda y habilita colaboración. Nunca dependes de una conexión.' },
  { icon: 'Sliders', title: 'Mixer Profesional', body: 'Buses, returns, sends pre/post, grupos VCA y metering centralizado. Routing serio para producción real.' },
];

export const pricingTiers: PricingTier[] = [
  {
    name: 'Free', price: '$0', period: '', desc: 'Todo lo que necesitas para crear. Sin límites de tiempo.',
    features: [
      'Proyectos ilimitados',
      'Tracks ilimitados por proyecto',
      'Motor de audio Rust/WASAPI completo',
      '12+ instrumentos · 20+ efectos nativos',
      '5GB almacenamiento cloud',
      'Export WAV 24-bit · MP3 320kbps · FLAC',
      'Collab en tiempo real (2 usuarios)',
      'Perfil público + 10 tracks publicados',
      '50 requests IA/mes',
      'Offline mode (PWA)',
    ],
    cta: 'Empezar gratis',
  },
  {
    name: 'Pro', price: '$4.99', period: '/mes', desc: 'Herramientas profesionales. Menos que un café.',
    features: [
      'Todo en Free',
      'VST3/CLAP plugin bridge',
      '30+ instrumentos · 40+ efectos',
      '100GB almacenamiento cloud',
      'Export WAV 32-bit · Stems · Batch',
      'Collab en tiempo real (5 usuarios)',
      '500 requests IA/mes + Mix Analysis',
      '5000+ samples · 500 descargas/mes',
      'Version history (30 días)',
      'Soporte prioritario',
    ],
    featured: true, cta: 'Comenzar con Pro',
  },
  {
    name: 'Studio', price: '$14.99', period: '/mes', desc: 'Para equipos, estudios y profesionales.',
    features: [
      'Todo en Pro',
      '1TB almacenamiento cloud',
      'Collab en tiempo real (25 usuarios)',
      'IA Mastering automático + Stem Separation',
      'Samples ilimitados + vende en marketplace',
      'Version history ilimitado',
      'Video scoring · Podcast mode',
      'API/Webhooks de integración',
      'Soporte dedicado 24/7',
      'Perfil verificado ✓',
    ],
    cta: 'Empezar con Studio',
  },
];

export const consoleFeatures: ConsoleFeature[] = [
  { icon: 'Globe', title: 'Acceso desde cualquier navegador', body: 'Sin instalación. Abre tu estudio desde Chrome, Edge o Firefox con rendimiento nativo vía WebAssembly.' },
  { icon: 'Link', title: 'Comparte como Canva', body: 'Genera un enlace y cualquier colaborador con acceso puede editar en tiempo real. Sin setup, sin fricciones.' },
  { icon: 'Cloud', title: 'Proyectos en la nube', body: 'Autoguardado continuo, versionado de estados y recuperación instantánea. Tu trabajo nunca se pierde.' },
  { icon: 'Shield', title: 'Seguridad de estudio', body: 'Permisos granulares, cifrado end-to-end y control total sobre quién puede ver, editar o exportar tu proyecto.' },
];

export const roadmapPhases: RoadmapPhaseData[] = [
  {
    phase: 'Phase 1 — Actual', horizon: 'Foundation & Determinism',
    body: 'Transporte determinístico, recording hardening y crash recovery. La base respira bajo presión.',
    deliverables: ['Scheduler dual (worklet + interval fallback)', 'Recording con finalize resiliente', 'Autosave + crash recovery + integrity checks'],
  },
  {
    phase: 'Phase 2', horizon: 'Pro Production Depth',
    body: 'MIDI audible, automation runtime y routing completo para producción profesional.',
    deliverables: ['Synth interno + instrument rack v1', 'Automation para volume, pan y device params', 'Buses, returns, sends pre/post y track groups'],
  },
  {
    phase: 'Phase 3', horizon: 'Web Console & Collaboration',
    body: 'La versión web del DAW sale a producción con colaboración en tiempo real.',
    deliverables: ['Web DAW vía WebAssembly', 'Real-time collab con CRDT', 'Cloud sync + project versioning'],
  },
  {
    phase: 'Phase 4', horizon: 'AI & Differentiation',
    body: 'IA accionable y diferenciación real. No maquillaje: workflows completamente nuevos.',
    deliverables: ['AI action engine para mezcla y arreglo', 'Collaborative editing seguro', 'Desktop release hardening + telemetry'],
  },
];
