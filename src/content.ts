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
  { id: 'home', label: 'HOLLOW BITS', path: '/' },
  { id: 'engine', label: 'Engine Core', path: '/engine' },
  { id: 'ecosistema', label: 'Ecosistema', path: '/ecosystem' },
  { id: 'roadmap', label: 'Roadmap', path: '/roadmap' },
  { id: 'contacto', label: 'Contacto B2B', path: '/contact' }
];

export const heroStats: StatItem[] = [
  {
    value: '0ms',
    label: 'Jitter de Transporte',
    detail: 'Determinismo de fase absoluto. A diferencia de motores heredados dictados por el SO, nuestro reloj maestro es inquebrantable.'
  },
  {
    value: '6',
    label: 'Escenarios Benchmark A/B',
    detail: 'Destrozando las limitaciones del Interval Clock. Worklet-node asíncrono puro bajo cargas extremas sin degradación.'
  },
  {
    value: '160+',
    label: 'Pistas Audio/MIDI x Sesión',
    detail: 'Performance estable sin dropouts en arreglos densos. Donde las arquitecturas de 20 años colapsan, nosotros escalamos.'
  },
  {
    value: '<30ms',
    label: 'Latency Roundtrip p99',
    detail: 'Monitoreo a través de capas de efectos en tiempo real con matemática de precisión de 64-bits. Estándar de la industria, redefinido.'
  }
];

export const capabilities: CapabilityItem[] = [
  {
    title: 'Flujo Lineal y No Lineal Perfeccionado',
    body: 'El caos de clips y la rigidez de las líneas de tiempo rígidas son reliquias. Integramos Session View y Arrangement en un tejido conectivo sin fricción para prototipado balístico y finalización estricta.',
    bullets: [
      'Cuantización no destructiva con micro-timing de precisión de muestreo.',
      'Operaciones de clip instantáneas: consolidación asíncrona y warping transparente.',
      'Bounce-in-place y masterización offline determinista a velocidades extremas.'
    ]
  },
  {
    title: 'Auditoría Técnica Continua (Performance Gate)',
    body: 'Los DAWs tradicionales mienten sobre la latencia y dropean samples silenciosamente. HOLLOW BITS ejecuta telemetría real. Si falla el benchmark p99, no lo lanzamos. Construido para no fallar en el escenario.',
    bullets: [
      'Reportes SR x Buffer en tiempo real, visibles sin ocultar fallas.',
      'Puntos de restauración asíncronos distribuidos en worker threads.',
      'Aislamiento de crash de plugins VST3/AU encapsulados (sandbox).'
    ]
  },
  {
    title: 'Enrutamiento y DSP Puro',
    body: 'Arquitectura de señal diseñada contra el aliasing y la distorsión de fase. No más sumas opacas ni motores de audio coloreados por defecto.',
    bullets: [
      'Matriz de ruteo N-a-N, paralela e ilimitada.',
      'Automatización con interpolación spline de 64-bits (Touch, Latch, Write de grado cirujano).',
      'Motor ADC/DAC nativo puenteado a WASAPI/ASIO sin cuellos de botella del OS.'
    ]
  },
  {
    title: 'Augmentación Inteligente (No Gimmicks)',
    body: 'La IA integrada en HOLLOW BITS no escribe canciones por ti, destruye el trabajo tedioso. Herramientas técnicas para mentes creativas superiores.',
    bullets: [
      'Detección de fase y alineación transitoria automática multi-track.',
      'Análisis de espectro proyectivo y deducción espectral para limpieza de mezcla.',
      'Transposición Audio-to-MIDI algorítmica sin artefactos perceptibles.'
    ]
  }
];

export const engineHighlights: EngineItem[] = [
  {
    title: 'El fin del cuello de botella monolítico',
    titleEng: 'Ending the Monolithic Bottleneck',
    body: 'Mientras competidores atrapan el pipeline DSP en el hilo principal o hilos de UI acoplados, nuestro Scheduler Dual distribuye la carga en Web Audio API Worklets estructurados para evitar GC pauses. Máxima fluidez garantizada.'
  },
  {
    title: 'Validación Matemática de Audio',
    body: 'No confíes en tus oídos si el motor hace dithering sin permiso. Exportamos JSON arrays con el histórico de compensación de latencia, drift asíncrono, y phase-cancel testing.'
  },
  {
    title: 'Acuerdos de Nivel de Servicio Técnico (SLAs)',
    body: 'Estamos tan confiados que exponemos nuestras métricas internas: p95 drift <= 36ms, lag p95 <= 32ms. Si Logic Pro o Ableton publicaran esto, tendrían que reescribir sus motores core.'
  },
  {
    title: 'Arquitectura Nativa para Sistemas Pesados',
    body: 'Nacido en Windows porque es donde habitan los entusiastas del silicio real y las cargas pesadas. Planeado para expandir su hegemonía a macOS y Linux bajo el mismo framework binario.'
  }
];

export const matrixLegend: StatItem[] = [
  {
    value: 'PASS',
    label: 'Cálculo Isocrónico',
    detail: 'Pipeline DSP operando dentro de umbrales asíncronos estrictos de microsegundos.'
  },
  {
    value: 'WARN',
    label: 'Drift Dinámico',
    detail: 'Compensación de latencia automática en efecto debido a sobrecarga de thread perimetral.'
  },
  {
    value: 'FAIL',
    label: 'Corte Quirúrgico',
    detail: 'Aborte de render. Salvado automático preventivo. Protegiendo la integridad estricta del archivo.'
  }
];

export const services: ServiceItem[] = [
  {
    title: 'Post-Producción Hiperdimensional',
    body: 'Traspasando la simple "mezcla". Ethereal Sounds esculpe topologías sonoras con precisión forense y dirección creativa para discos que definen la era, no que la siguen.',
    outcomes: [
      'Claridad implacable en todos los medios (Club, Dolby, Mobile).',
      'Modelado de transitorios y espectros para peso comercial real.',
      'Preparación integral CUE, STEMS y Deliverables MQA.'
    ]
  },
  {
    title: 'Modelado Sonoro (Sound Design B2B)',
    body: 'Marcas top, sellos boutique y publishers no usan presets públicos. Diseñamos la química base desde los osciladores hasta el timbre final usando HOLLOW BITS.',
    outcomes: [
      'Identidad sonora patentable (Audio Branding).',
      'Bibliotecas privadas de assets DSP generativos.',
      'Integración Wwise/FMOD para interactividad nativa.'
    ]
  },
  {
    title: 'Optimización Live Performance Stage',
    body: 'Fallar en vivo no es una opción. Auditamos arquitecturas de sets complejos de Ableton y realizamos migraciones al entorno HOLLOW BITS para redundancia cero-fallos.',
    outcomes: [
      'Sistemas de failover nativos para rigs de hardware y MIDI.',
      'Distribución de carga de plugins pesados y limitación técnica.',
      'Protocolos de ensayo y latencia medida en arenas de gran escala.'
    ]
  }
];

export const roadmap: RoadmapItem[] = [
  {
    phase: 'Q1 [La Purga]',
    focus: 'Demostrar superioridad en el Determinismo de Transporte y Estabilidad de Archivo.',
    deliverables: [
      'Gestor asíncrono de eventos MIDI a prueba de stress.',
      'Undo-history infinito almacenado en buffer diferencial (Zero RAM Leak).',
      'Ruta de guardado y checksum validado por bloque.'
    ]
  },
  {
    phase: 'Q2 [La Amenaza (Pipeline Pro)]',
    focus: 'Implementación del routing monstruoso y motor de automatización Bezier puro.',
    deliverables: [
      'Latencia de matriz de envío reducida a 0.2ms inter-track.',
      'Automatizaciones visuales hiper-fluidas a 60fps usando Lenis API.',
      'Sistemas de bus paralelo pre-fader real.'
    ]
  },
  {
    phase: 'Q3 [El Reemplazo (Session V2)]',
    focus: 'Asalto directo al Session View tradicional. Lanzamiento de clips sin saltos de fase audible en modo quantize-off.',
    deliverables: [
      'Interpolación en vivo de clips de audio y warp adaptativo.',
      'Crossfades de lanzamiento automáticos de 5ms.',
      'Rendimiento estático bajo cargas de CPU L3 Cache complejas (Multi-Core).'
    ]
  },
  {
    phase: 'Q4 [El Estándar (IA & Rollout)]',
    focus: 'Herramientas analíticas y de soporte IA nativo, no intrusivo.',
    deliverables: [
      'Análisis predictivo de frecuencias resonantes molestas (Visual EQ).',
      'Smart-Comping de tomas vocales basado en micro-variaciones paramétricas.',
      'Extracción modular y licencia comercial de Enterprise.'
    ]
  }
];

export const faqs: FaqItem[] = [
  {
    question: 'Si son tan buenos, ¿por qué no corren en Mac desde el día 1?',
    answer: 'La supremacía requiere enfoque. Windows provee el acceso a hardware bruto y paralelismo brutal necesario para forjar nuestro Engine Dual inicial. Una vez validada nuestra tasa matemática de win-rate (99.8%), la arquitectura agnóstica dominará macOS sin el legacy core-audio baggage de GarageBand/Logic.'
  },
  {
    question: 'No creo sus métricas contra Ableton/Logic. ¿Tienen pruebas?',
    answer: 'Sí. A diferencia de nuestros competidores cerrados, HOLLOW BITS incluye un módulo generador de reportes JSON nativos. Tú mismo puedes correr nuestra matriz Benchmark y comparar cómo ellos "suavizan" audio para ocultar dropouts mientras nosotros arrojamos VERDAD absoluta bit a bit.'
  },
  {
    question: 'Ethereal Sounds es un estudio. ALLYX desarrolla. ¿Quién manda?',
    answer: 'Es una simbiosis despiadada. Ethereal inyecta el requerimiento elitista y musical de altas ligas. ALLYX responde con la matemática C++/WebAudio. Este DAW no lo hicieron programadores sordos ni productores que no saben codear. Es el pináculo táctico.'
  }
];
