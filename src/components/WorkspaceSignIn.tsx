import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FilePenLine,
  Globe2,
  Handshake,
  Landmark,
  MonitorCog,
  ServerCog,
  Settings2,
  ShieldCheck,
  Sprout,
  Sparkles,
  TreePine,
  type LucideIcon
} from "lucide-react";
import { type CSSProperties } from "react";
import { ROLE_ACCESS_SUMMARIES, ROLE_LABELS, type Role } from "../auth/roles";
import { useI18n } from "../i18n";
import { roleAreaPresentation, type SignedInRole } from "../workspace/roleAreaPresentation";
import { workspaceConfigForRole } from "../workspace/workspaceConfig";

const PROGRAMME_ROLES = ["applicant", "grantee", "reviewer", "national"] as const satisfies readonly SignedInRole[];
const AGENCY_ROLES = [
  "undp-admin",
  "fao-admin",
  "ci-admin"
] as const satisfies readonly SignedInRole[];
const ADMINISTRATION_ROLES = [
  "platform-admin",
  "it-frontend",
  "it-backend",
  "super-admin"
] as const satisfies readonly SignedInRole[];

const ROLE_ICONS: Record<SignedInRole, LucideIcon> = {
  applicant: FilePenLine,
  grantee: Handshake,
  reviewer: ClipboardCheck,
  national: Landmark,
  "fao-admin": Sprout,
  "ci-admin": TreePine,
  "undp-admin": Globe2,
  "platform-admin": Settings2,
  "it-frontend": MonitorCog,
  "it-backend": ServerCog,
  "super-admin": ShieldCheck
};

type WorkspaceSignInProps = {
  onSignIn: (role: SignedInRole) => void;
};

function RoleCard({ role, onSignIn }: { role: SignedInRole; onSignIn: WorkspaceSignInProps["onSignIn"] }) {
  const { t } = useI18n();
  const Icon = ROLE_ICONS[role];
  const presentation = roleAreaPresentation(role);
  const workspace = workspaceConfigForRole(role);
  const style = { "--signin-accent": presentation.accent } as CSSProperties;

  return (
    <button
      className="workspace-signin-card"
      data-role={role}
      data-access-level={`L${presentation.level}`}
      style={style}
      type="button"
      onClick={() => onSignIn(role)}
      aria-label={`${t("Sign in as")} ${t(ROLE_LABELS[role])}`}
    >
      <span className="workspace-signin-card__top">
        <span className="workspace-signin-card__icon" aria-hidden="true"><Icon size={24} strokeWidth={1.8} /></span>
        <span className="workspace-signin-card__level">L{presentation.level}</span>
      </span>
      <span className="workspace-signin-card__copy">
        <strong>{ROLE_LABELS[role]}</strong>
        <span>{ROLE_ACCESS_SUMMARIES[role]}</span>
      </span>
      <span className="workspace-signin-card__action">
        <span>{workspace.label}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </span>
    </button>
  );
}

function RoleGroup({
  id,
  eyebrow,
  title,
  description,
  roles,
  onSignIn
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  roles: readonly SignedInRole[];
  onSignIn: WorkspaceSignInProps["onSignIn"];
}) {
  return (
    <section className="workspace-signin-group" aria-labelledby={`workspace-signin-${id}`}>
      <header>
        <span>{eyebrow}</span>
        <h2 id={`workspace-signin-${id}`}>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="workspace-signin-grid">
        {roles.map((role) => <RoleCard key={role} role={role} onSignIn={onSignIn} />)}
      </div>
    </section>
  );
}

export function WorkspaceSignIn({ onSignIn }: WorkspaceSignInProps) {
  return (
    <section className="workspace-signin" aria-labelledby="workspace-signin-title">
      <div className="workspace-signin__ambient" aria-hidden="true" />
      <div className="content-width workspace-signin__inner">
        <header className="workspace-signin__hero">
          <div className="workspace-signin__intro">
            <span className="workspace-signin__eyebrow"><ShieldCheck size={16} aria-hidden="true" /> Workspace access</span>
            <h1 id="workspace-signin-title">Sign in to open your workspace</h1>
            <p>Choose a preview user type to see the tools, records and priorities available to that role. Your selection stays on this device and can be changed at any time.</p>
          </div>
          <div className="workspace-signin__assurances" aria-label="Preview access information">
            <span><BadgeCheck size={18} aria-hidden="true" /><strong>Role-based access</strong></span>
            <span><Sparkles size={18} aria-hidden="true" /><strong>Separate workspaces</strong></span>
            <span><ShieldCheck size={18} aria-hidden="true" /><strong>Technical demo version</strong></span>
          </div>
        </header>

        <div className="workspace-signin__groups">
          <RoleGroup
            id="programme"
            eyebrow="Programme access"
            title="Programme workspaces"
            description="Application, review, grant delivery and country programme tools."
            roles={PROGRAMME_ROLES}
            onSignIn={onSignIn}
          />
          <RoleGroup
            id="agency"
            eyebrow="Agency access"
            title="Agency workspaces"
            description="UNDP, FAO and Conservation International administration workspaces."
            roles={AGENCY_ROLES}
            onSignIn={onSignIn}
          />
          <RoleGroup
            id="administration"
            eyebrow="Authorized access"
            title="Administration and operations"
            description="Governance, platform and technical operations workspaces."
            roles={ADMINISTRATION_ROLES}
            onSignIn={onSignIn}
          />
        </div>

      </div>
    </section>
  );
}

export const WORKSPACE_SIGN_IN_ROLES: readonly Exclude<Role, "public">[] = [
  ...PROGRAMME_ROLES,
  ...AGENCY_ROLES,
  ...ADMINISTRATION_ROLES
];
