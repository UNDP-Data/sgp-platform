import { lazy, Suspense, useEffect } from "react";
import { isPrivilegedRole, type Role } from "./auth/roles";
import { AssistantDock } from "./components/Assistant";
import { Loading } from "./components/PagePrimitives";
import { AccessRequired, Redirect } from "./components/RouteStates";
import { Shell } from "./components/Shell";
import { WorkspaceSignIn } from "./components/WorkspaceSignIn";
import { AssistantProvider, useAssistant } from "./contexts/AssistantContext";
import { useBrowserLocation } from "./hooks/useBrowserLocation";
import { usePreviewSession } from "./hooks/usePreviewSession";
import { navigateTo } from "./lib/browser/navigation";
import {
  AdminPage, CommunityPage, FundingPage, HelpPage, HomePage, KnowledgePage, NotFoundPage,
  PortfolioPage, SearchPage, StoriesPage, UtilityPage, WorkspacePage
} from "./Pages";
import sitemap from "./runtime-sitemap.json";
import { canAccessPath, requiredAccessArea } from "./routing/access";
import { legacyDestination, preserveLocation } from "./routing/legacyRedirects";
import {
  DEMO_ROLE_QUERY_PARAM,
  DemoRoleRoutingProvider,
  demoRoleFromLocation,
  isDemoRoleRoute,
  withDemoRole
} from "./routing/demoRoleRouting";
import { findRoute } from "./routing";
import { CommunityWorkspaceProvider, useCommunityWorkspace } from "./workspace/CommunityWorkspaceStore";
import { type SignedInRole } from "./workspace/roleAreaPresentation";
import { workspaceConfigForRole } from "./workspace/workspaceConfig";

const ApiDocumentationPage = lazy(() => import("./ApiDocumentationPage").then((module) => ({ default: module.ApiDocumentationPage })));

function AssistantScopeBridge({ path, role }: { path: string; role: Role }) {
  const assistant = useAssistant();
  const workspace = useCommunityWorkspace();
  useEffect(() => {
    if (path.startsWith("/workspace") && role !== "public") {
      assistant.setScope(`${role}:${workspace.activeOrganization.id}`, workspace.activeOrganization.name);
    } else {
      assistant.setScope(`general:${role}`, "General SGP knowledge");
    }
  }, [assistant.setScope, path, role, workspace.activeOrganization.id, workspace.activeOrganization.name]);
  return null;
}

type RoutedPageProps = {
  path: string;
  search: string;
  hash: string;
  role: Role;
  saved: string[];
  toggleSaved: (id: string) => void;
  signInToWorkspace: (role: SignedInRole) => void;
};

function RoutedPage({ path, search, hash, role, saved, toggleSaved, signInToWorkspace }: RoutedPageProps) {
  const redirect = legacyDestination(path);
  if (redirect) return <Redirect to={preserveLocation(redirect, search, hash)} />;
  if (findRoute(sitemap.routes, path)?.path === "*") return <NotFoundPage />;
  if (role === "public" && path.startsWith("/workspace")) return <WorkspaceSignIn onSignIn={signInToWorkspace} />;
  if (!canAccessPath(role, path)) {
    if (role !== "public") return <Redirect to={withDemoRole(workspaceConfigForRole(role).homeHref, role)} />;
    return <AccessRequired area={requiredAccessArea(path) || "this area"} />;
  }
  if (path === "/workspace" && isPrivilegedRole(role)) {
    return <Redirect to={withDemoRole(workspaceConfigForRole(role).homeHref, role)} />;
  }
  if (path === "/") return <HomePage role={role} savedCount={saved.length} />;
  if (path.startsWith("/funding")) return <FundingPage path={path} role={role} />;
  if (path === "/portfolio") return <PortfolioPage path={path} />;
  if (path.startsWith("/knowledge")) return <KnowledgePage path={path} saved={saved} toggleSaved={toggleSaved} />;
  if (path.startsWith("/stories")) return <StoriesPage path={path} />;
  if (path.startsWith("/community")) return <CommunityPage path={path} />;
  if (path.startsWith("/help")) return <HelpPage path={path} />;
  if (path.startsWith("/workspace")) return <WorkspacePage path={path} role={role} saved={saved} />;
  if (path.startsWith("/admin") || path.startsWith("/platform-admin") || path.startsWith("/it-admin") || path.startsWith("/super-admin")) {
    return <AdminPage path={path} role={role} integrationContent={<Suspense fallback={<Loading label="Loading API documentation" />}><ApiDocumentationPage /></Suspense>} />;
  }
  if (path === "/search") return <SearchPage />;
  if (["/prototype-notice", "/privacy", "/accessibility"].includes(path)) return <UtilityPage path={path} />;
  return <NotFoundPage />;
}

export function App() {
  const location = useBrowserLocation();
  const routeRole = demoRoleFromLocation(location.path, location.search);
  const { role, setRole, saved, toggleSaved } = usePreviewSession(routeRole);
  useEffect(() => {
    if (!isDemoRoleRoute(location.path)) return;
    const currentRoleParam = new URLSearchParams(location.search).get(DEMO_ROLE_QUERY_PARAM);
    const desiredRoleParam = role === "public" ? null : role;
    if (currentRoleParam === desiredRoleParam) return;
    navigateTo(
      withDemoRole(`${location.path}${location.search}${location.hash}`, role),
      "replace",
      location.locale
    );
  }, [location.hash, location.locale, location.path, location.search, role]);

  const changeRole = (nextRole: Role) => {
    setRole(nextRole);
    const currentHref = `${location.path}${location.search}${location.hash}`;
    const nextHref = withDemoRole(currentHref, nextRole);
    if (nextHref !== currentHref) navigateTo(nextHref, "replace", location.locale);
  };
  const signInToWorkspace = (nextRole: SignedInRole) => {
    setRole(nextRole);
    navigateTo(
      withDemoRole(workspaceConfigForRole(nextRole).homeHref, nextRole),
      "replace",
      location.locale
    );
  };

  return (
    <DemoRoleRoutingProvider role={role}>
      <AssistantProvider>
        <CommunityWorkspaceProvider>
          <AssistantScopeBridge path={location.path} role={role} />
          <Shell path={location.path} role={role} onRoleChange={changeRole}>
            <RoutedPage
              path={location.path}
              search={location.search}
              hash={location.hash}
              role={role}
              saved={saved}
              toggleSaved={toggleSaved}
              signInToWorkspace={signInToWorkspace}
            />
          </Shell>
        </CommunityWorkspaceProvider>
        <AssistantDock />
      </AssistantProvider>
    </DemoRoleRoutingProvider>
  );
}
