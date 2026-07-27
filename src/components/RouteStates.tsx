import { useEffect } from "react";
import { navigateTo } from "../lib/browser/navigation";
import { AppLink } from "./AppLink";
import { Loading } from "./PagePrimitives";

export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => navigateTo(to, "replace"), 0);
    return () => window.clearTimeout(timeout);
  }, [to]);
  return <Loading label="Opening the updated page" />;
}

export function AccessRequired({ area, signedIn = false }: { area: string; signedIn?: boolean }) {
  return (
    <section className="access-required">
      <div>
        <span>Permissioned area</span>
        <h1>{signedIn ? `Access required for ${area}` : `Sign in to open ${area}`}</h1>
        <p>{signedIn
          ? "This account does not have the role required for this area. Select an appropriate test role from the profile menu."
          : "Select an appropriate test role from the profile menu to preview this part of the platform."}</p>
        <AppLink href="/" className="button button--primary">Return home</AppLink>
      </div>
    </section>
  );
}
