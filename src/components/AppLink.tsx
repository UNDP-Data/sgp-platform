import { type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useI18n } from "../i18n";
import { navigateTo, toBrowserHref } from "../lib/browser/navigation";
import { useDemoRoleForLinks, withDemoRole } from "../routing/demoRoleRouting";

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
  return href.startsWith("/")
    && !href.startsWith("//")
    && !event.defaultPrevented
    && event.button === 0
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey
    && event.currentTarget.target !== "_blank";
}

export function AppLink({ href, children, onClick, ...props }: AppLinkProps) {
  const { locale } = useI18n();
  const role = useDemoRoleForLinks();
  const routedHref = withDemoRole(href, role);
  return (
    <a
      href={toBrowserHref(routedHref, locale)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!shouldUseBrowserNavigation(event, routedHref)) return;
        event.preventDefault();
        navigateTo(routedHref, "push", locale);
      }}
    >
      {children}
    </a>
  );
}
