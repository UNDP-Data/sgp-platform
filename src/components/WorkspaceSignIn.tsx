import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FilePenLine,
  Globe2,
  Landmark,
  ServerCog,
  Settings2,
  ShieldCheck,
  Sprout,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { type CSSProperties } from "react";
import { ROLE_ACCESS_SUMMARIES, ROLE_LABELS, type Role } from "../auth/roles";
import { useI18n } from "../i18n";
import { roleAreaPresentation, type SignedInRole } from "../workspace/roleAreaPresentation";
import { workspaceConfigForRole } from "../workspace/workspaceConfig";

const PROGRAMME_ROLES = [
  "programme-assistant",
  "reviewer",
  "nsc",
  "national-coordinator",
  "cpmt"
] as const satisfies readonly SignedInRole[];
const AGENCY_ROLES = [
  "agency-admin"
] as const satisfies readonly SignedInRole[];
const ADMINISTRATION_ROLES = [
  "platform-admin",
  "it-admin"
] as const satisfies readonly SignedInRole[];

const ROLE_ICONS: Record<SignedInRole, LucideIcon> = {
  "programme-assistant": FilePenLine,
  reviewer: ClipboardCheck,
  nsc: Landmark,
  "national-coordinator": Sprout,
  cpmt: Globe2,
  "agency-admin": Globe2,
  "platform-admin": Settings2,
  "it-admin": ServerCog
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
            <p>Choose an account type to open its assignment-scoped records and complete operational work. The temporary backend keeps records, files, case history and preferences available across browser sessions on this computer.</p>
          </div>
          <div className="workspace-signin__assurances" aria-label="Workspace access information">
            <span><BadgeCheck size={18} aria-hidden="true" /><strong>Role-based access</strong></span>
            <span><Sparkles size={18} aria-hidden="true" /><strong>Separate workspaces</strong></span>
            <span><ShieldCheck size={18} aria-hidden="true" /><strong>Persistent temporary backend</strong></span>
          </div>
        </header>

        <div className="workspace-signin__groups">
          <RoleGroup
            id="programme"
            eyebrow="Programme access"
            title="Programme workspaces"
            description="Country grant applications, programme delivery, committee, CPMT and participating-agency operations."
            roles={PROGRAMME_ROLES}
            onSignIn={onSignIn}
          />
          <RoleGroup
            id="agency"
            eyebrow="Agency access"
            title="Agency workspaces"
            description="Agency-scoped users, integrations and governed configuration."
            roles={AGENCY_ROLES}
            onSignIn={onSignIn}
          />
          <RoleGroup
            id="administration"
            eyebrow="Authorized access"
            title="Administration and operations"
            description="Platform-wide governance and technical operations workspaces."
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
