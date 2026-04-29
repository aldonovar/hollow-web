import type { ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MetricCardData } from '../content';

interface SectionHeaderProps {
  kicker: string; title: ReactNode; description?: string;
}

export function SectionHeader({ kicker, title, description }: SectionHeaderProps) {
  return (
    <header className="section__header" data-reveal>
      <span className="section__kicker">{kicker}</span>
      <h2 className="section__title">{title}</h2>
      {description && <p className="section__desc">{description}</p>}
    </header>
  );
}

export function MetricCard({ item }: { item: MetricCardData }) {
  return (
    <article className="metric-card" data-reveal>
      <span className="metric-card__value">{item.value}</span>
      <h3 className="metric-card__label">{item.label}</h3>
      <p className="metric-card__detail">{item.detail}</p>
    </article>
  );
}

interface BtnProps {
  to: string; children: ReactNode; variant?: 'primary' | 'ghost';
}

export function Btn({ to, children, variant = 'primary' }: BtnProps) {
  const isExternal = to.startsWith('http');
  const icon = variant === 'ghost'
    ? <ArrowRight size={16} strokeWidth={1.8} />
    : <ArrowUpRight size={16} strokeWidth={1.8} />;

  if (isExternal) {
    return (
      <a className={`btn btn--${variant}`} href={to} target="_blank" rel="noopener noreferrer">
        <span>{children}</span>{icon}
      </a>
    );
  }

  return (
    <Link className={`btn btn--${variant}`} to={to}>
      <span>{children}</span>{icon}
    </Link>
  );
}
