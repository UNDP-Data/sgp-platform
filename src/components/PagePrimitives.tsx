import { Search } from "lucide-react";
import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  intro: string;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function PageHero({ eyebrow, title, intro, actions, compact = false, className = "" }: PageHeroProps) {
  const classes = ["page-hero", compact && "page-hero--compact", className].filter(Boolean).join(" ");
  return (
    <header className={classes}>
      <div className="content-width">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function DemoBadge() {
  return <span className="badge badge--demo">Demonstration</span>;
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <Search size={26} />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

export function Loading({ label = "Loading records" }: { label?: string }) {
  return <div className="loading-state" role="status"><span /><strong>{label}</strong></div>;
}
