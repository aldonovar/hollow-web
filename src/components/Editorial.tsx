import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { MetricCardData, PosterCardData } from '../content';

interface SectionIntroProps {
  kicker: string;
  title: ReactNode;
  description: string;
  align?: 'left' | 'center';
}

interface PosterCardProps {
  item: PosterCardData;
  className?: string;
}

interface MetricCardProps {
  item: MetricCardData;
  className?: string;
}

interface LinkPillProps {
  to: string;
  children: ReactNode;
  quiet?: boolean;
}

export function SectionIntro({
  kicker,
  title,
  description,
  align = 'left',
}: SectionIntroProps) {
  return (
    <header className={`section-intro section-intro--${align}`} data-reveal>
      <span className="section-intro__kicker">{kicker}</span>
      <h2 className="section-intro__title">{title}</h2>
      <p className="section-intro__description">{description}</p>
    </header>
  );
}

export function PosterCard({ item, className = '' }: PosterCardProps) {
  return (
    <article
      className={`poster-card poster-card--${item.accent} poster-card--${item.variant} ${className}`.trim()}
      data-reveal
    >
      <div className="poster-card__grain" aria-hidden="true" />
      <div className="poster-card__art" aria-hidden="true">
        <span className="poster-card__halo poster-card__halo--a" />
        <span className="poster-card__halo poster-card__halo--b" />
        <span className="poster-card__frame" />
        <span className="poster-card__line" />
      </div>
      <div className="poster-card__copy">
        <span className="poster-card__eyebrow">{item.eyebrow}</span>
        <h3 className="poster-card__title">{item.title}</h3>
        <p className="poster-card__body">{item.body}</p>
        <span className="poster-card__meta">{item.meta}</span>
      </div>
      {item.verticalLabel ? (
        <span className="poster-card__vertical">{item.verticalLabel}</span>
      ) : null}
    </article>
  );
}

export function MetricCard({ item, className = '' }: MetricCardProps) {
  return (
    <article
      className={`metric-card metric-card--${item.tone ?? 'sky'} ${className}`.trim()}
      data-reveal
    >
      <span className="metric-card__value">{item.value}</span>
      <h3 className="metric-card__label">{item.label}</h3>
      <p className="metric-card__detail">{item.detail}</p>
    </article>
  );
}

export function LinkPill({ to, children, quiet = false }: LinkPillProps) {
  return (
    <Link className={`link-pill ${quiet ? 'link-pill--quiet' : ''}`.trim()} to={to}>
      <span>{children}</span>
      {quiet ? <ArrowRight size={16} strokeWidth={1.6} /> : <ArrowUpRight size={16} strokeWidth={1.6} />}
    </Link>
  );
}
