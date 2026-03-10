export interface RouteMeta {
  id: string;
  label: string;
  path: string;
  kicker: string;
  stamp: string;
  summary: string;
}

export interface PosterCardData {
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
  accent: 'sky' | 'ocean' | 'sand' | 'ink' | 'gold';
  variant: 'moon' | 'portal' | 'horizon' | 'signal' | 'sunrise';
  verticalLabel?: string;
}

export interface MetricCardData {
  value: string;
  label: string;
  detail: string;
  tone?: 'sky' | 'ocean' | 'gold' | 'ink';
}

export interface ComparisonCardData {
  eyebrow: string;
  title: string;
  body: string;
  detail: string;
}

export interface NarrativeScene {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  poster: PosterCardData;
}

export interface AtlasItem {
  stat: string;
  title: string;
  body: string;
}

export interface RoadmapPhaseData {
  phase: string;
  horizon: string;
  body: string;
  deliverables: string[];
  note: string;
}

export interface AccessReason {
  tag: string;
  title: string;
  body: string;
}

export const routeMeta: RouteMeta[] = [
  {
    id: 'home',
    label: 'Manifesto',
    path: '/',
    kicker: 'Editorial launch',
    stamp: 'HB-00',
    summary: 'Una home cinematica para presentar HOLLOW BITS como un DAW que piensa la estabilidad como lenguaje creativo.',
  },
  {
    id: 'engine',
    label: 'Engine',
    path: '/engine',
    kicker: 'Proof layer',
    stamp: 'HB-01',
    summary: 'Scheduler dual, matrix de confiabilidad y quality gates convertidos en una experiencia de legitimidad visual.',
  },
  {
    id: 'ecosystem',
    label: 'Flow',
    path: '/ecosystem',
    kicker: 'Studio scenes',
    stamp: 'HB-02',
    summary: 'Session, arrange, browser, automation y direccion AI mostrados como escenas de uso, no como una lista de features.',
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    path: '/roadmap',
    kicker: 'Future states',
    stamp: 'HB-03',
    summary: 'Foundation, parity y diferenciacion narradas como una evolucion deseable del estudio digital.',
  },
  {
    id: 'contact',
    label: 'Access',
    path: '/contact',
    kicker: 'Private circle',
    stamp: 'HB-04',
    summary: 'Acceso temprano premium para productores, estudios y sound designers que quieren entrar antes del release publico.',
  },
];

export const homeHeroMetrics: MetricCardData[] = [
  {
    value: '40',
    label: 'SR x Buffer checks',
    detail: 'La app madre ya corre una matrix de confiabilidad con 40 combinaciones antes de hablar de release.',
    tone: 'sky',
  },
  {
    value: '2',
    label: 'Scheduler moods',
    detail: 'Worklet-clock para el pulso mas estricto e interval fallback cuando el entorno pide otra clase de elegancia.',
    tone: 'ocean',
  },
  {
    value: 'Win x64',
    label: 'Primary target',
    detail: 'Desktop-first, local-first y con foco real en rendimiento estable sobre Windows moderno.',
    tone: 'gold',
  },
  {
    value: 'Gates',
    label: 'Release discipline',
    detail: 'Typecheck, tests, build y smoke gates antes de convertir una intuicion visual en promesa publica.',
    tone: 'ink',
  },
];

export const homePosters: PosterCardData[] = [
  {
    eyebrow: 'New terrain',
    title: 'The idea should feel larger than the software.',
    body: 'HOLLOW BITS nace para que el estudio vuelva a sentirse inmenso: menos menus muertos, mas impulso, mas aire, mas respuesta.',
    meta: 'SESSION + ARRANGE IN ONE STATE',
    accent: 'sky',
    variant: 'moon',
    verticalLabel: 'HOLLOW',
  },
  {
    eyebrow: 'Reliability as aura',
    title: 'No romance without discipline.',
    body: 'Detras del gesto editorial hay una columna dura: benchmarks, budgets de drift y una arquitectura que no negocia el pulso.',
    meta: 'WORKLET CLOCK / QUALITY GATES',
    accent: 'ocean',
    variant: 'portal',
    verticalLabel: 'ENGINE',
  },
  {
    eyebrow: 'Digital body',
    title: 'A studio that moves like a performance.',
    body: 'Launch quantization, timeline extensa, browser progresivo y surfaces listas para convertir edicion en gesto fisico.',
    meta: 'LIVE STAGE / TIMELINE / MIX',
    accent: 'sand',
    variant: 'horizon',
    verticalLabel: 'FLOW',
  },
];

export const homeComparisons: ComparisonCardData[] = [
  {
    eyebrow: 'What we inherited',
    title: 'Ableton taught speed.',
    body: 'La vista de session cambio la cultura de produccion. Pero velocidad sin una nueva profundidad tecnica sigue dejando huecos.',
    detail: 'HOLLOW BITS recoge esa energia y la empuja hacia mas control, mas diagnostico y mas escala.',
  },
  {
    eyebrow: 'What we respected',
    title: 'Logic taught polish.',
    body: 'El acabado importa. Un estudio serio necesita sentirse medido, legible y confiable incluso cuando el proyecto ya es enorme.',
    detail: 'La ambicion aqui no es copiar pantallas; es construir un lenguaje nuevo de precision y espacio.',
  },
  {
    eyebrow: 'What we are building',
    title: 'HOLLOW BITS chases the space after both.',
    body: 'Un DAW desktop-first que une workflow performativo, control profundo, benchmarking real y una identidad visual menos domestica.',
    detail: 'No una skin futurista. Un sistema completo que trata la estabilidad como parte del mood creativo.',
  },
];

export const manifestoMetrics: MetricCardData[] = [
  {
    value: 'Local-first',
    label: 'No cloud dependency for the core',
    detail: 'La idea principal vive en tu maquina. La nube aparece despues, como expansion, no como requisito.',
    tone: 'ocean',
  },
  {
    value: 'Virtualized',
    label: 'Timeline and session scale',
    detail: 'La app ya apunta a sesiones grandes con virtualizacion horizontal y vertical para mantener la interfaz ligera.',
    tone: 'sky',
  },
  {
    value: 'JSON',
    label: 'Benchmark export trail',
    detail: 'Los benchmarks no quedan como humo. Se exportan, se comparan y dejan rastro tecnico.',
    tone: 'gold',
  },
];

export const routePreviewPosters: PosterCardData[] = [
  {
    eyebrow: 'Proof layer',
    title: 'See the engine without flattening the myth.',
    body: 'Un recorrido por scheduler dual, budgets de latencia y protocolos de release.',
    meta: 'HB-01',
    accent: 'ink',
    variant: 'signal',
    verticalLabel: 'ENGINE',
  },
  {
    eyebrow: 'Studio scenes',
    title: 'Watch the workflow become physical.',
    body: 'Session, arrange, mixer, browser y capas de automatizacion pensadas como escenas de trabajo.',
    meta: 'HB-02',
    accent: 'sky',
    variant: 'sunrise',
    verticalLabel: 'FLOW',
  },
  {
    eyebrow: 'Private circle',
    title: 'Enter before it goes public.',
    body: 'Acceso temprano para quienes quieren empujar el producto mientras aun esta tomando forma.',
    meta: 'HB-04',
    accent: 'sand',
    variant: 'portal',
    verticalLabel: 'ACCESS',
  },
];

export const engineProofMetrics: MetricCardData[] = [
  {
    value: '40 cases',
    label: 'Reliability matrix',
    detail: 'La matrix SR x Buffer valida contexto activo, render audible y timing dentro de tolerancia.',
    tone: 'sky',
  },
  {
    value: 'drift <= 36ms',
    label: 'p95 target',
    detail: 'El performance gate exige budgets concretos para drift, lag y scheduler loop antes de dar luz verde.',
    tone: 'ocean',
  },
  {
    value: '>= 60%',
    label: 'Worklet win-rate',
    detail: 'El benchmark A/B espera que worklet-clock gane con consistencia frente al modo interval.',
    tone: 'gold',
  },
  {
    value: 'JSON trail',
    label: 'Traceable evidence',
    detail: 'Cada corrida deja reporte exportable para revisar fallos, restores y comparativas con contexto.',
    tone: 'ink',
  },
];

export const engineNarratives: ComparisonCardData[] = [
  {
    eyebrow: 'Clock behavior',
    title: 'When the pulse matters, the clock must feel inevitable.',
    body: 'Worklet-clock existe para los momentos donde el transporte no puede sonar como una aproximacion. Debe sentirse cerrado.',
    detail: 'Si el entorno necesita otra salida, interval fallback entra como gracia tecnica, no como improvisacion.',
  },
  {
    eyebrow: 'Graph discipline',
    title: 'Incremental graph patching over reconnect chaos.',
    body: 'La app madre ya trabaja con cambios incrementales de routing y mix params para reducir reconnect churn.',
    detail: 'Eso se traduce en una web que puede hablar de estabilidad con el cuerpo erguido.',
  },
  {
    eyebrow: 'Release culture',
    title: 'No release candidate while a gate is red.',
    body: 'No es solo una frase. Es una regla documentada en la disciplina de release del proyecto.',
    detail: 'La promesa publica se alinea con una cultura de chequeo, no con intuiciones vacias.',
  },
];

export const engineGateCommands = [
  'npm run typecheck',
  'npm run test:unit',
  'npm run build',
  'Desktop smoke: open / import / play / pause / record / export',
];

export const engineThresholds = [
  'drift p95 <= 36ms',
  'drift p99 <= 95ms',
  'event-loop lag p95 <= 32ms',
  'scheduler loop p99 <= 34ms',
  'worklet win-rate >= 60%',
];

export const enginePosters: PosterCardData[] = [
  {
    eyebrow: 'Scheduler dual',
    title: 'Precision should not look sterile.',
    body: 'La capa tecnica puede verse hermosa sin convertirse en decoracion. HOLLOW BITS quiere ambas cosas a la vez.',
    meta: 'WORKLET CLOCK + INTERVAL FALLBACK',
    accent: 'ocean',
    variant: 'portal',
    verticalLabel: 'CLOCK',
  },
  {
    eyebrow: 'Quality protocol',
    title: 'A benchmark is only useful when it can stop a release.',
    body: 'Los budgets, la exportacion JSON y los smoke gates importan porque tienen poder real sobre el proceso.',
    meta: 'GATES / REPORTS / RESTORE CHECKS',
    accent: 'gold',
    variant: 'signal',
    verticalLabel: 'GATE',
  },
];

export const ecosystemScenes: NarrativeScene[] = [
  {
    eyebrow: 'Scene 01',
    title: 'Session view with less ceremony.',
    body: 'El flujo no busca la nostalgia de una grid. Busca el momento donde lanzar, mutar y reordenar ideas se siente fisico.',
    bullets: [
      'Session workflow como motor de energia, no como panel secundario.',
      'Scene recording y quantized launch como horizonte inmediato del producto.',
      'Interfaz legible para sets vivos y decisiones rapidas.',
    ],
    poster: {
      eyebrow: 'Performance layout',
      title: 'Launches that feel like choreography.',
      body: 'Un lenguaje de posters, capas y profundidad para vender el set como un cuerpo en movimiento.',
      meta: 'SESSION / LIVE / SCENES',
      accent: 'sky',
      variant: 'sunrise',
      verticalLabel: 'LIVE',
    },
  },
  {
    eyebrow: 'Scene 02',
    title: 'Arrange, comping and recovery in one continuum.',
    body: 'Timeline grande, take lanes, punch workflows y journals de recording para que editar no rompa la confianza.',
    bullets: [
      'Recording lifecycle endurecido con finalize y fail reasons trazables.',
      'Comping y take lanes como parte de una historia de confiabilidad, no solo de edicion.',
      'Autosave, restore e integrity checks como capa de fondo del estudio.',
    ],
    poster: {
      eyebrow: 'Recorded memory',
      title: 'The timeline keeps its nerve.',
      body: 'La linea de tiempo se vende como un espacio respirable donde el detalle no se vuelve miedo.',
      meta: 'TAKE LANES / PUNCH / RESTORE',
      accent: 'sand',
      variant: 'horizon',
      verticalLabel: 'ARRANGE',
    },
  },
  {
    eyebrow: 'Scene 03',
    title: 'Browser, import and instrument depth without sludge.',
    body: 'El proyecto ya tiene import pipeline progresivo, preview, library drag flows y un camino serio hacia export y devices mas ricos.',
    bullets: [
      'Pipeline de importacion con control de concurrencia.',
      'Browser con preview y arrastre directo hacia el estudio.',
      'Instrumentos internos, export modal y direccion modular ya visibles en la app madre.',
    ],
    poster: {
      eyebrow: 'Asset motion',
      title: 'Bring sound in before friction notices.',
      body: 'La web debe sugerir una ingestion limpia de ideas, archivos y energia.',
      meta: 'BROWSER / IMPORT / EXPORT',
      accent: 'ocean',
      variant: 'moon',
      verticalLabel: 'ASSETS',
    },
  },
  {
    eyebrow: 'Scene 04',
    title: 'AI and collaboration as action, not wallpaper.',
    body: 'El roadmap del producto empuja hacia AI accionable y colaboracion segura. La web debe presentar eso como horizonte serio.',
    bullets: [
      'AI sidebar como semilla de una capa de direccion contextual.',
      'Collab snapshot y command history como base de trabajo compartido.',
      'La promesa no es charla. Es aplicacion real sobre el proyecto.',
    ],
    poster: {
      eyebrow: 'Future layer',
      title: 'A co-producer that can actually move the room.',
      body: 'La diferenciacion llega cuando el sistema empieza a ejecutar correcciones y sugerencias dentro del flujo.',
      meta: 'AI ACTION ENGINE / COLLAB',
      accent: 'ink',
      variant: 'signal',
      verticalLabel: 'FUTURE',
    },
  },
];

export const ecosystemAtlas: AtlasItem[] = [
  {
    stat: 'VIRTUALIZED',
    title: 'Large-session calm',
    body: 'Timeline horizontal y vertical virtualization para sesiones mas pesadas sin matar la interfaz.',
  },
  {
    stat: 'METERING',
    title: 'Centralized signal reading',
    body: 'Flujo de metering centralizado para reducir overhead por pista y sostener la claridad del mixer.',
  },
  {
    stat: 'AUDIO',
    title: 'Granular + native playback paths',
    body: 'Camino granular para clips warped y camino nativo para playback estandar segun lo que la sesion pide.',
  },
  {
    stat: 'EXPORT',
    title: 'Render as a trust exercise',
    body: 'Export parity y protocolos de release para que la salida no sea una apuesta de ultimo minuto.',
  },
];

export const roadmapPhases: RoadmapPhaseData[] = [
  {
    phase: 'Phase 1',
    horizon: 'Foundation and determinism',
    body: 'Primero se gana en transporte, recording y clip ops confiables. La base debe poder respirar bajo presion.',
    deliverables: [
      'Scheduler deterministic y transport truth en el engine.',
      'Recording hardening con finalize resiliente y clip integrity.',
      'Autosave, crash recovery y project integrity checks.',
    ],
    note: 'No transport regressions under stress.',
  },
  {
    phase: 'Phase 2',
    horizon: 'Pro production depth',
    body: 'Despues llega la profundidad: MIDI audible, automation runtime y routing serio para produccion real.',
    deliverables: [
      'Internal synth path e instrument rack v1.',
      'Automation runtime para volume, pan y device params.',
      'Buses, returns, sends pre/post y track groups.',
    ],
    note: 'Full song production with native tools only.',
  },
  {
    phase: 'Phase 3',
    horizon: 'Performance and session workflow',
    body: 'La energia en vivo se vuelve central: session v2, freeze, bounce in place y estrategias de overload con criterio.',
    deliverables: [
      'Quantized launch, scenes, follow actions y scene recording.',
      'CPU budget panel y fallback strategy.',
      'Editor tooling mas veloz para transformaciones complejas.',
    ],
    note: 'Live workflow stable and low-friction.',
  },
  {
    phase: 'Phase 4',
    horizon: 'Differentiation layer',
    body: 'AI accionable, colaboracion y desktop release hardening para salir del terreno de la paridad y entrar en el de la propuesta propia.',
    deliverables: [
      'Collaboration MVP con edicion segura.',
      'AI action engine para cambios reales sobre mezcla y arreglo.',
      'Desktop rollout mas duro, con telemetry y rollback path.',
    ],
    note: 'Different workflows, not just different visuals.',
  },
];

export const roadmapPrinciples = [
  'No major feature ships while reliability gates are red.',
  'Every feature carries acceptance criteria, tests and rollback notes.',
  'Desktop quality on Windows is a product pillar, not a support note.',
  'Differentiation only matters if the basics already feel inevitable.',
];

export const accessReasons: AccessReason[] = [
  {
    tag: 'Producers',
    title: 'For artists who already know what they hate about waiting.',
    body: 'Si tu idea siempre llega antes que tu DAW, este acceso temprano esta pensado para ti.',
  },
  {
    tag: 'Sound designers',
    title: 'For studios that need depth without mud.',
    body: 'Routing, diagnostics y una narrativa de precision para quienes viven dentro del detalle.',
  },
  {
    tag: 'Live performers',
    title: 'For performers who cannot afford a fragile set.',
    body: 'La promesa principal no es solo sonar bonito. Es mantenerse de pie cuando el show ya empezo.',
  },
];

export const accessOptions = [
  'Ableton Live',
  'Logic Pro',
  'Pro Tools',
  'FL Studio',
  'Reaper',
  'Otro flujo hibrido',
];
