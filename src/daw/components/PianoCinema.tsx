import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Note } from '../types';
import { buildScoreNoteKey, normalizeMidiVelocity } from '../services/pianoScoreConversionService';
import { midiNoteLabel } from '../services/synthesiaLayoutService';

interface PianoCinemaProps {
    notes: Note[];
    playhead16th: number;
    bpm: number;
    isPlaying: boolean;
    total16ths: number;
    selectedNoteKey: string | null;
    activeNoteIndexes: number[];
    livePitches: number[];
    sustainActive: boolean;
    pitchShiftSemitones?: number;
    zoom?: number;
    emptyTitle?: string;
    emptyMessage?: string;
    onSelectNoteKey?: (noteKey: string | null) => void;
    onSeekToTimeline16th?: (timeline16th: number) => void;
    onUpdateNote?: (noteIndex: number, nextNote: Note) => void;
}

interface PianoLaneNote extends Note {
    index: number;
    noteKey: string;
    sourcePitch: number;
}

type DragMode = 'move' | 'trim-duration';

interface DragState {
    pointerId: number;
    noteIndex: number;
    mode: DragMode;
    originPointerY: number;
    originStart: number;
    originDuration: number;
    originPitch: number;
}

const PIANO_MIN_MIDI = 21;
const PIANO_MAX_MIDI = 108;
const WHITE_KEY_SET = new Set([0, 2, 4, 5, 7, 9, 11]);
const BLACK_KEY_SET = new Set([1, 3, 6, 8, 10]);
const MAX_RIBBON_MARKERS = 48;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const isBlackKey = (pitch: number): boolean => BLACK_KEY_SET.has(((pitch % 12) + 12) % 12);

const buildKeyboardLayout = (minPitch: number, maxPitch: number) => {
    const layoutMinPitch = isBlackKey(minPitch) ? Math.max(PIANO_MIN_MIDI, minPitch - 1) : minPitch;
    const layoutMaxPitch = isBlackKey(maxPitch) ? Math.min(PIANO_MAX_MIDI, maxPitch + 1) : maxPitch;
    const keyFrames = new Map<number, { x: number; width: number; center: number; black: boolean }>();
    const whiteKeys: Array<{ pitch: number; x: number; width: number }> = [];
    const blackKeys: Array<{ pitch: number; x: number; width: number }> = [];
    const whiteKeyWidth = 28;
    const blackKeyWidth = 18;
    let whiteIndex = 0;

    for (let pitch = layoutMinPitch; pitch <= layoutMaxPitch; pitch += 1) {
        if (WHITE_KEY_SET.has(pitch % 12)) {
            const x = whiteIndex * whiteKeyWidth;
            whiteKeys.push({ pitch, x, width: whiteKeyWidth });
            keyFrames.set(pitch, {
                x,
                width: whiteKeyWidth,
                center: x + (whiteKeyWidth / 2),
                black: false
            });
            whiteIndex += 1;
        }
    }

    for (let pitch = layoutMinPitch; pitch <= layoutMaxPitch; pitch += 1) {
        if (!isBlackKey(pitch)) continue;
        const previousWhite = pitch - 1;
        const frame = keyFrames.get(previousWhite);
        if (!frame) continue;
        const x = frame.x + (frame.width * 0.68);
        blackKeys.push({ pitch, x, width: blackKeyWidth });
        keyFrames.set(pitch, {
            x,
            width: blackKeyWidth,
            center: x + (blackKeyWidth / 2),
            black: true
        });
    }

    return {
        width: whiteKeys.length * whiteKeyWidth,
        whiteKeys,
        blackKeys,
        keyFrames
    };
};

const findNearestPitch = (x: number, keyFrames: Map<number, { center: number }>): number => {
    let closestPitch = 60;
    let closestDistance = Number.POSITIVE_INFINITY;

    keyFrames.forEach((frame, pitch) => {
        const distance = Math.abs(frame.center - x);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPitch = pitch;
        }
    });

    return closestPitch;
};

const PianoCinema: React.FC<PianoCinemaProps> = ({
    notes,
    playhead16th,
    bpm,
    isPlaying,
    total16ths,
    selectedNoteKey,
    activeNoteIndexes,
    livePitches,
    sustainActive,
    pitchShiftSemitones = 0,
    zoom = 1,
    emptyTitle = 'Sin material en Piano Cinema',
    emptyMessage = 'Cuando haya notas, el editor inferior seguira el transporte en tiempo real.',
    onSelectNoteKey,
    onSeekToTimeline16th,
    onUpdateNote
}) => {
    const displayPitchShift = clamp(Math.round(pitchShiftSemitones), -48, 48);
    const pitchRange = useMemo(() => {
        const allPitches = [
            ...notes.map((note) => clamp(note.pitch + displayPitchShift, PIANO_MIN_MIDI, PIANO_MAX_MIDI)),
            ...livePitches
        ];
        if (allPitches.length === 0) {
            return { min: 36, max: 84 };
        }

        let min = clamp(Math.min(...allPitches) - 3, PIANO_MIN_MIDI, PIANO_MAX_MIDI);
        let max = clamp(Math.max(...allPitches) + 4, PIANO_MIN_MIDI, PIANO_MAX_MIDI);
        const minimumSpan = 28;

        if ((max - min) < minimumSpan) {
            const center = (min + max) / 2;
            min = clamp(Math.floor(center - (minimumSpan / 2)), PIANO_MIN_MIDI, PIANO_MAX_MIDI - minimumSpan);
            max = clamp(min + minimumSpan, PIANO_MIN_MIDI + minimumSpan, PIANO_MAX_MIDI);
        }

        return { min, max };
    }, [displayPitchShift, livePitches, notes]);

    const keyboard = useMemo(() => buildKeyboardLayout(pitchRange.min, pitchRange.max), [pitchRange.max, pitchRange.min]);
    const idPrefix = useId().replace(/:/g, '');
    const svgRef = useRef<SVGSVGElement>(null);
    const motionLayerRef = useRef<SVGGElement>(null);
    const ribbonPlayheadRef = useRef<SVGLineElement>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);

    const laneNotes = useMemo<PianoLaneNote[]>(() => {
        return [...notes]
            .map((note, index) => ({
                ...note,
                pitch: clamp(note.pitch + displayPitchShift, PIANO_MIN_MIDI, PIANO_MAX_MIDI),
                index,
                noteKey: buildScoreNoteKey(note, index),
                sourcePitch: note.pitch
            }))
            .sort((left, right) => left.start - right.start || left.pitch - right.pitch);
    }, [displayPitchShift, notes]);

    const selectedNote = useMemo(() => {
        return laneNotes.find((note) => note.noteKey === selectedNoteKey) || null;
    }, [laneNotes, selectedNoteKey]);

    const activeIndexSet = useMemo(() => new Set(activeNoteIndexes), [activeNoteIndexes]);
    const livePitchSet = useMemo(() => new Set(livePitches), [livePitches]);
    const activePitchSet = useMemo(() => {
        const pitches = new Set(livePitches);
        laneNotes.forEach((note) => {
            if (activeIndexSet.has(note.index)) pitches.add(note.pitch);
        });
        return pitches;
    }, [activeIndexSet, laneNotes, livePitches]);
    const pixelsPer16th = 16 * zoom;
    const lookAhead16ths = 56;
    const lookBehind16ths = 8;
    const headerHeight = 36;
    const mainHeight = 500;
    const keyboardHeight = 72;
    const noteViewportHeight = mainHeight - keyboardHeight;
    const keyboardTop = noteViewportHeight + 18;
    const totalBars = Math.max(1, Math.ceil(total16ths / 16));
    const ribbonMarkerStep = Math.max(1, Math.ceil(totalBars / MAX_RIBBON_MARKERS));
    const ribbonMarkers = useMemo(() => {
        const markers: number[] = [];
        for (let bar = 0; bar < totalBars; bar += ribbonMarkerStep) markers.push(bar);
        return markers;
    }, [ribbonMarkerStep, totalBars]);
    const musicalBar = Math.max(1, Math.floor(playhead16th / 16) + 1);
    const musicalBeat = Math.max(1, Math.floor((playhead16th % 16) / 4) + 1);
    const stageTitleId = `${idPrefix}-piano-cinema-title`;
    const stageDescriptionId = `${idPrefix}-piano-cinema-description`;

    useEffect(() => {
        const msPer16th = Math.max(1, 60000 / Math.max(1, bpm) / 4);
        const startedAt = performance.now();
        const basePlayhead16th = playhead16th;
        let frameId = 0;

        const paint = () => {
            const elapsed16ths = isPlaying ? (performance.now() - startedAt) / msPer16th : 0;
            const current16th = basePlayhead16th + elapsed16ths;
            const clamped16th = clamp(current16th, 0, Math.max(16, total16ths));

            if (motionLayerRef.current) {
                motionLayerRef.current.setAttribute('transform', `translate(0 ${clamped16th * pixelsPer16th})`);
            }

            const ribbonX = (clamped16th / Math.max(16, total16ths)) * keyboard.width;
            ribbonPlayheadRef.current?.setAttribute('x1', String(ribbonX));
            ribbonPlayheadRef.current?.setAttribute('x2', String(ribbonX));

            if (isPlaying) {
                frameId = window.requestAnimationFrame(paint);
            }
        };

        paint();
        return () => window.cancelAnimationFrame(frameId);
    }, [bpm, isPlaying, keyboard.width, pixelsPer16th, playhead16th, total16ths]);

    useEffect(() => {
        if (!dragState) return;

        const handlePointerMove = (event: PointerEvent) => {
            if (!svgRef.current || !dragState || event.pointerId !== dragState.pointerId) return;
            event.preventDefault();
            const rect = svgRef.current.getBoundingClientRect();
            const viewScaleY = mainHeight / rect.height;
            const viewScaleX = keyboard.width / rect.width;
            const pointerY = (event.clientY - rect.top) * viewScaleY;
            const pointerX = (event.clientX - rect.left) * viewScaleX;
            const targetPitch = clamp(findNearestPitch(pointerX, keyboard.keyFrames), PIANO_MIN_MIDI, PIANO_MAX_MIDI);
            const delta16th = (dragState.originPointerY - pointerY) / pixelsPer16th;
            const targetStart = clamp(dragState.originStart - delta16th, 0, Math.max(0, total16ths));

            if (dragState.mode === 'move') {
                onUpdateNote?.(dragState.noteIndex, {
                    pitch: clamp(targetPitch - displayPitchShift, PIANO_MIN_MIDI, PIANO_MAX_MIDI),
                    start: Math.round(targetStart * 4) / 4,
                    duration: dragState.originDuration,
                    velocity: normalizeMidiVelocity(notes[dragState.noteIndex]?.velocity ?? 96)
                });
                return;
            }

            const targetDuration = clamp(((keyboardTop - pointerY) / pixelsPer16th), 0.25, 64);
            onUpdateNote?.(dragState.noteIndex, {
                pitch: clamp(dragState.originPitch - displayPitchShift, PIANO_MIN_MIDI, PIANO_MAX_MIDI),
                start: dragState.originStart,
                duration: Math.round(targetDuration * 4) / 4,
                velocity: normalizeMidiVelocity(notes[dragState.noteIndex]?.velocity ?? 96)
            });
        };

        const handlePointerEnd = (event: PointerEvent) => {
            if (event.pointerId !== dragState.pointerId) return;
            if (svgRef.current?.hasPointerCapture?.(event.pointerId)) {
                svgRef.current.releasePointerCapture(event.pointerId);
            }
            setDragState(null);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerEnd);
        window.addEventListener('pointercancel', handlePointerEnd);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerEnd);
            window.removeEventListener('pointercancel', handlePointerEnd);
        };
    }, [displayPitchShift, dragState, keyboard.keyFrames, keyboard.width, keyboardTop, mainHeight, notes, onUpdateNote, pixelsPer16th, total16ths]);

    const handleSeekRibbonClick = (event: React.MouseEvent<SVGSVGElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        onSeekToTimeline16th?.(ratio * Math.max(16, total16ths));
    };

    const handleSeekRibbonKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
        let nextPlayhead: number | null = null;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextPlayhead = playhead16th - 1;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextPlayhead = playhead16th + 1;
        if (event.key === 'PageDown') nextPlayhead = playhead16th - 16;
        if (event.key === 'PageUp') nextPlayhead = playhead16th + 16;
        if (event.key === 'Home') nextPlayhead = 0;
        if (event.key === 'End') nextPlayhead = Math.max(16, total16ths);
        if (nextPlayhead === null) return;
        event.preventDefault();
        onSeekToTimeline16th?.(clamp(nextPlayhead, 0, Math.max(16, total16ths)));
    };

    return (
        <div
            data-piano-cinema="studio"
            className="flex h-full w-full flex-col overflow-hidden rounded-sm border border-[#303236] bg-[#151618]"
        >
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#303236] bg-[#1b1c1e] px-3">
                <div className="min-w-0">
                    <div className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#d7d8da]">Keys-fi</div>
                    <div className="mt-0.5 truncate text-[8px] font-semibold uppercase tracking-[0.14em] text-[#777a80]">Visualizador de interpretación</div>
                </div>
                <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <span className="hidden rounded-sm border border-[#34363a] bg-[#202124] px-2 py-1 text-[8px] font-semibold tabular-nums text-[#a2a5aa] sm:inline-flex">
                        {bpm.toFixed(0)} BPM
                    </span>
                    <span className="rounded-sm border border-[#34363a] bg-[#202124] px-2 py-1 text-[8px] font-semibold text-[#a2a5aa]">
                        {laneNotes.length} notas
                    </span>
                    <span className={`rounded-sm border px-2 py-1 text-[8px] font-semibold ${sustainActive ? 'border-[#7871b7] bg-[#37344f] text-[#dddafe]' : 'border-[#34363a] bg-[#202124] text-[#777a80]'}`}>
                        Sustain {sustainActive ? 'On' : 'Off'}
                    </span>
                    {livePitches.length > 0 && (
                        <span className="rounded-sm border border-[#7871b7] bg-[#37344f] px-2 py-1 text-[8px] font-semibold text-[#dddafe]">
                            Live {livePitches.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="shrink-0 border-b border-[#303236] bg-[#18191b] px-3 py-2">
                <svg
                    data-piano-cinema-ribbon="true"
                    className="h-11 w-full cursor-pointer rounded-sm outline-none ring-[#8e86d8] focus-visible:ring-1 motion-reduce:transition-none md:h-8"
                    viewBox={`0 0 ${keyboard.width} ${headerHeight}`}
                    preserveAspectRatio="none"
                    onClick={handleSeekRibbonClick}
                    onKeyDown={handleSeekRibbonKeyDown}
                    role="slider"
                    tabIndex={0}
                    aria-label="Posición del transporte de Keys-fi"
                    aria-valuemin={0}
                    aria-valuemax={Math.max(16, total16ths)}
                    aria-valuenow={clamp(playhead16th, 0, Math.max(16, total16ths))}
                    aria-valuetext={`Compás ${musicalBar}, pulso ${musicalBeat}`}
                >
                    <rect x={0} y={0} width={keyboard.width} height={headerHeight} rx={2} fill="#111214" />
                    <rect
                        x={0}
                        y={0}
                        width={(clamp(playhead16th, 0, Math.max(16, total16ths)) / Math.max(16, total16ths)) * keyboard.width}
                        height={headerHeight}
                        rx={2}
                        fill="rgba(142,134,216,0.16)"
                    />
                    {ribbonMarkers.map((bar) => {
                        const x = (bar / totalBars) * keyboard.width;
                        return (
                            <g key={`seek-bar-${bar}`} data-piano-cinema-ribbon-marker={bar + 1}>
                                <line x1={x} y1={6} x2={x} y2={30} stroke="#3d3f43" strokeWidth={bar % 4 === 0 ? 1.2 : 0.8} />
                                <text x={x + 5} y={15} fill="#777a80" fontSize={8} fontWeight={600}>
                                    {bar + 1}
                                </text>
                            </g>
                        );
                    })}
                    <line
                        ref={ribbonPlayheadRef}
                        x1={(clamp(playhead16th, 0, Math.max(16, total16ths)) / Math.max(16, total16ths)) * keyboard.width}
                        y1={4}
                        x2={(clamp(playhead16th, 0, Math.max(16, total16ths)) / Math.max(16, total16ths)) * keyboard.width}
                        y2={32}
                        stroke="#8e86d8"
                        strokeWidth={2}
                    />
                </svg>
            </div>

            <div className="relative min-h-0 flex-1 bg-[#151618] p-2">
                <svg
                    ref={svgRef}
                    data-piano-cinema-stage="true"
                    className="block h-full w-full touch-none rounded-sm bg-[#111214]"
                    viewBox={`0 0 ${keyboard.width} ${mainHeight}`}
                    preserveAspectRatio="none"
                    role="group"
                    aria-labelledby={`${stageTitleId} ${stageDescriptionId}`}
                    onLostPointerCapture={(event) => {
                        setDragState((current) => current?.pointerId === event.pointerId ? null : current);
                    }}
                >
                    <title id={stageTitleId}>Visualizador de interpretación Keys-fi</title>
                    <desc id={stageDescriptionId}>Notas musicales descienden hacia un teclado sincronizado con el transporte. Las notas se pueden seleccionar, mover y redimensionar.</desc>
                    <rect x={0} y={0} width={keyboard.width} height={mainHeight} fill="#111214" />

                    <g ref={motionLayerRef}>
                        {Array.from({ length: Math.ceil((lookAhead16ths + lookBehind16ths) / 4) }, (_, index) => {
                            const timeline16th = playhead16th - lookBehind16ths + (index * 4);
                            const y = keyboardTop - (timeline16th * pixelsPer16th);
                            return (
                                <g key={`grid-${index}`}>
                                    <line
                                        x1={0}
                                        y1={y}
                                        x2={keyboard.width}
                                        y2={y}
                                        stroke={index % 4 === 0 ? '#34363a' : '#25272a'}
                                        strokeWidth={index % 4 === 0 ? 1 : 0.75}
                                    />
                                </g>
                            );
                        })}

                        {laneNotes.map((note) => {
                            const frame = keyboard.keyFrames.get(note.pitch);
                            if (!frame) return null;

                            const relativeNoteBottom = keyboardTop - ((note.start - playhead16th) * pixelsPer16th);
                            const noteHeight = Math.max(8, note.duration * pixelsPer16th);
                            const noteBottom = keyboardTop - (note.start * pixelsPer16th);
                            const noteTop = noteBottom - noteHeight;

                            if (relativeNoteBottom < -24 || (relativeNoteBottom - noteHeight) > noteViewportHeight + 48) {
                                return null;
                            }

                            const isSelected = note.noteKey === selectedNoteKey;
                            const isActive = activeIndexSet.has(note.index) || livePitchSet.has(note.pitch);
                            const noteWidth = frame.black ? frame.width + 4 : frame.width - 4;
                            const noteX = frame.black ? frame.x - 2 : frame.x + 2;
                            const velocity = normalizeMidiVelocity(note.velocity);

                            return (
                                <g key={note.noteKey}>
                                    <rect
                                        x={noteX - 1}
                                        y={noteTop - 1}
                                        width={noteWidth + 2}
                                        height={noteHeight + 2}
                                        rx={2}
                                        fill={isSelected || isActive ? '#8e86d8' : '#45484d'}
                                        opacity={isSelected || isActive ? 1 : 0.82}
                                        pointerEvents="none"
                                    />
                                    <rect
                                        x={noteX}
                                        y={noteTop}
                                        width={noteWidth}
                                        height={noteHeight}
                                        rx={1.5}
                                        fill={isSelected || isActive ? '#8e86d8' : '#70747b'}
                                        opacity={isSelected || isActive ? 1 : 0.72 + ((velocity / 127) * 0.2)}
                                        stroke={isSelected ? '#dedbf8' : '#27292c'}
                                        strokeWidth={isSelected ? 1.5 : 0.75}
                                        className="cursor-pointer outline-none"
                                        role="button"
                                        tabIndex={isSelected || (!selectedNoteKey && note.index === laneNotes[0]?.index) ? 0 : -1}
                                        aria-label={`${midiNoteLabel(note.pitch)}, inicio ${note.start.toFixed(2)}, duración ${note.duration.toFixed(2)}, velocidad ${velocity}`}
                                        aria-pressed={isSelected}
                                        onKeyDown={(event) => {
                                            if (event.key !== 'Enter' && event.key !== ' ') return;
                                            event.preventDefault();
                                            onSelectNoteKey?.(note.noteKey);
                                        }}
                                        onPointerDown={(event) => {
                                            event.preventDefault();
                                            svgRef.current?.setPointerCapture?.(event.pointerId);
                                            onSelectNoteKey?.(note.noteKey);
                                            setDragState({
                                                pointerId: event.pointerId,
                                                noteIndex: note.index,
                                                mode: 'move',
                                                originPointerY: ((event.clientY - event.currentTarget.getBoundingClientRect().top) + (event.currentTarget.getBoundingClientRect().top - svgRef.current!.getBoundingClientRect().top)) * (mainHeight / svgRef.current!.getBoundingClientRect().height),
                                                originStart: note.start,
                                                originDuration: note.duration,
                                                originPitch: note.pitch
                                            });
                                        }}
                                    />
                                    {noteHeight >= 24 && (
                                        <text
                                            x={noteX + (noteWidth / 2)}
                                            y={noteTop + 14}
                                            textAnchor="middle"
                                            fill={isSelected || isActive ? '#f1efff' : '#e0e1e3'}
                                            fontSize={7}
                                            fontWeight={700}
                                            pointerEvents="none"
                                        >
                                            {midiNoteLabel(note.pitch)}
                                        </text>
                                    )}
                                    <rect
                                        x={noteX}
                                        y={noteTop}
                                        width={noteWidth}
                                        height={5}
                                        rx={1}
                                        fill="rgba(255,255,255,0.01)"
                                        className="cursor-ns-resize"
                                        aria-hidden="true"
                                        onPointerDown={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            svgRef.current?.setPointerCapture?.(event.pointerId);
                                            onSelectNoteKey?.(note.noteKey);
                                            setDragState({
                                                pointerId: event.pointerId,
                                                noteIndex: note.index,
                                                mode: 'trim-duration',
                                                originPointerY: ((event.clientY - event.currentTarget.getBoundingClientRect().top) + (event.currentTarget.getBoundingClientRect().top - svgRef.current!.getBoundingClientRect().top)) * (mainHeight / svgRef.current!.getBoundingClientRect().height),
                                                originStart: note.start,
                                                originDuration: note.duration,
                                                originPitch: note.pitch
                                            });
                                        }}
                                    />
                                </g>
                            );
                        })}
                    </g>

                    <line
                        x1={0}
                        y1={keyboardTop}
                        x2={keyboard.width}
                        y2={keyboardTop}
                        stroke="#8e86d8"
                        strokeWidth={1.5}
                    />

                    <g data-piano-cinema-keyboard="true">
                        {keyboard.whiteKeys.map((key) => {
                            const isLit = activePitchSet.has(key.pitch);
                            return (
                                <g key={`white-${key.pitch}`}>
                                    <rect
                                        data-piano-key={midiNoteLabel(key.pitch)}
                                        x={key.x}
                                        y={keyboardTop}
                                        width={key.width}
                                        height={keyboardHeight}
                                        fill={isLit ? '#d6d2f0' : '#dedfdf'}
                                        stroke={isLit ? '#8e86d8' : '#63666b'}
                                        strokeWidth={isLit ? 1.2 : 0.75}
                                    />
                                    {key.pitch % 12 === 0 && (
                                        <text
                                            x={key.x + (key.width / 2)}
                                            y={keyboardTop + keyboardHeight - 9}
                                            textAnchor="middle"
                                            fill="#5e6065"
                                            fontSize={7}
                                            fontWeight={700}
                                            pointerEvents="none"
                                        >
                                            {midiNoteLabel(key.pitch)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {keyboard.blackKeys.map((key) => {
                            const isLit = activePitchSet.has(key.pitch);
                            return (
                                <rect
                                    key={`black-${key.pitch}`}
                                    data-piano-key={midiNoteLabel(key.pitch)}
                                    x={key.x}
                                    y={keyboardTop}
                                    width={key.width}
                                    height={keyboardHeight * 0.62}
                                    rx={2}
                                    fill={isLit ? '#8e86d8' : '#242629'}
                                    stroke={isLit ? '#d6d2f0' : '#45484d'}
                                    strokeWidth={isLit ? 1.1 : 0.7}
                                />
                            );
                        })}
                    </g>
                </svg>

                <div className="pointer-events-none absolute left-4 top-4 rounded-sm border border-[#34363a] bg-[#191a1c]/95 px-2 py-1 text-[8px] font-semibold tabular-nums text-[#a2a5aa]">
                    Compás {musicalBar}.{musicalBeat}
                </div>
                <div className="pointer-events-none absolute right-4 top-4 rounded-sm border border-[#34363a] bg-[#191a1c]/95 px-2 py-1 text-[8px] font-semibold text-[#777a80]">
                    {midiNoteLabel(pitchRange.min)} — {midiNoteLabel(pitchRange.max)}
                </div>

                {laneNotes.length === 0 && livePitches.length === 0 && (
                    <div className="pointer-events-none absolute inset-6 flex items-center justify-center">
                        <div className="max-w-xl rounded-sm border border-[#3a3c40] bg-[#191a1c] px-6 py-5 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b7b9bd]">{emptyTitle}</div>
                            <div className="mt-2 text-sm leading-6 text-[#85888d]">
                                {emptyMessage}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex min-h-10 shrink-0 flex-col items-stretch gap-2 border-t border-[#303236] bg-[#1b1c1e] px-3 py-2 text-xs text-[#c7c8ca] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-sm border border-[#3a3c40] bg-[#202124] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#8d9095]">
                        Nota
                    </span>
                    <span className="truncate text-[11px] text-[#a2a5aa]">
                        {selectedNote
                            ? `${midiNoteLabel(selectedNote.pitch)} · Pitch ${selectedNote.pitch} · Inicio ${selectedNote.start.toFixed(2)} · Dur ${selectedNote.duration.toFixed(2)}`
                            : 'Selecciona una nota para editarla desde el piano inferior.'}
                    </span>
                    {displayPitchShift !== 0 && (
                        <span className="shrink-0 rounded-sm border border-[#7871b7] bg-[#37344f] px-2 py-1 text-[8px] font-semibold text-[#dddafe]">
                            Audio {displayPitchShift > 0 ? '+' : ''}{displayPitchShift} st
                        </span>
                    )}
                </div>

                <div className="flex min-h-11 items-center gap-3 sm:min-h-0">
                    <label className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                        <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#777a80]">Velocity</span>
                        <input
                            type="range"
                            min={1}
                            max={127}
                            value={selectedNote ? normalizeMidiVelocity(selectedNote.velocity) : 96}
                            disabled={!selectedNote}
                            aria-label="Velocidad de la nota seleccionada"
                            onChange={(event) => {
                                if (!selectedNote) return;
                                onUpdateNote?.(selectedNote.index, {
                                    pitch: selectedNote.sourcePitch,
                                    start: selectedNote.start,
                                    duration: selectedNote.duration,
                                    velocity: normalizeMidiVelocity(Number(event.target.value))
                                });
                            }}
                            className="min-w-0 flex-1 accent-[#8e86d8] sm:w-24 sm:flex-none"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default React.memo(PianoCinema);
