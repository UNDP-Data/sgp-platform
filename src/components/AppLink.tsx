import { type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useI18n } from "../i18n";
import { navigateTo, toBrowserHref } from "../lib/browser/navigation";

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
  return (
    <a
      href={toBrowserHref(href, locale)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!shouldUseBrowserNavigation(event, href)) return;
        event.preventDefault();
        navigateTo(href, "push", locale);
      }}
    >
      {children}
    </a>
  );
}
