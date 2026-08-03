import { Bookmark, Camera, Check, ChevronDown, CircleUserRound, Facebook, Globe2, Instagram, LayoutDashboard, Linkedin, LogOut, Menu, Search, Settings, X, Youtube } from "lucide-react";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  ROLE_ACCESS_SUMMARIES, ROLE_LABELS, TEST_ROLES, type Role
} from "../auth/roles";
import { useDismissibleLayer } from "../hooks/useDismissibleLayer";
import { LANGUAGES, useI18n } from "../i18n";
import { publicAssetUrl } from "../lib/browser/assets";
import sitemap from "../runtime-sitemap.json";
import { roleAreaPresentation } from "../workspace/roleAreaPresentation";
import { workspaceConfigForRole } from "../workspace/workspaceConfig";
import { AppLink } from "./AppLink";

export function Shell({ children, path, role, onRoleChange }: { children: ReactNode; path: string; role: Role; onRoleChange: (role: Role) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const languageButton = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, language, t } = useI18n();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  const closeLanguage = useCallback(() => setLanguageOpen(false), []);
  useEffect(() => {
    closeMenu();
    closeAccount();
    closeLanguage();
  }, [closeAccount, closeLanguage, closeMenu, path]);
  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;
      progressRef.current?.style.setProperty("--scroll-progress", String(progress));
      frame = 0;
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [path]);
  useDismissibleLayer({ open: menuOpen, onDismiss: closeMenu, containerRef: menuButton, triggerRef: menuButton, dismissOnOutsidePress: false });
  useDismissibleLayer({ open: accountOpen, onDismiss: closeAccount, containerRef: accountRef, triggerRef: accountButton });
  useDismissibleLayer({ open: languageOpen, onDismiss: closeLanguage, containerRef: languageRef, triggerRef: languageButton });
  const section = `/${path.split("/").filter(Boolean)[0] || ""}`;
  const primaryArea = role === "public" ? null : workspaceConfigForRole(role);
  const roleArea = role === "public" ? null : roleAreaPresentation(role);
  const roleAreaStyle = roleArea ? { "--role-accent": roleArea.accent } as CSSProperties : undefined;
  return <div className="app-root">
    <div ref={progressRef} className="experience-progress" aria-hidden="true" />
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="global-header">
      <div className="header-inner">
        <AppLink href="/" className="brand" aria-current={path === "/" ? "page" : undefined}><img className="brand-logo" src={publicAssetUrl("/brand/sgp-logo-transparent.png")} width="500" height="223" decoding="async" alt="SGP" /><span className="brand-name"><span>{t("Knowledge &")}</span><span>{t("Learning")}</span><span>{t("Platform")}</span></span></AppLink>
        <button ref={menuButton} className="mobile-menu-button icon-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="primary-nav" aria-label={menuOpen ? "Close navigation" : "Open navigation"}>{menuOpen ? <X /> : <Menu />}</button>
        <nav id="primary-nav" className={menuOpen ? "primary-nav open" : "primary-nav"} aria-label="Primary navigation">
          {sitemap.primaryNavigation.map((item) => <AppLink key={item.path} href={item.path} className={section === item.path ? "active" : ""} aria-current={section === item.path ? "page" : undefined}>{item.label}</AppLink>)}
        </nav>
        <div className="header-tools">
          <AppLink href="/search" className="icon-button" aria-current={path === "/search" ? "page" : undefined}><Search size={19} /><span className="sr-only">Search</span></AppLink>
          <div className="language-menu" ref={languageRef} data-no-translate>
            <button ref={languageButton} className="language-button" type="button" onClick={() => { setLanguageOpen((value) => !value); setAccountOpen(false); }} aria-expanded={languageOpen} aria-controls="language-menu-panel" aria-haspopup="menu" aria-label={t("Select language")}><Globe2 size={17} /><span>{language.short}</span><ChevronDown className="language-chevron" size={14} /></button>
            {languageOpen && <div className="language-panel" id="language-menu-panel" role="menu" aria-label={t("Language")}>{LANGUAGES.map((item) => <button type="button" role="menuitemradio" aria-checked={locale === item.code} lang={item.code} dir="ltr" onClick={() => { setLocale(item.code); setLanguageOpen(false); }} key={item.code}><span><strong dir={item.dir}>{item.nativeLabel}</strong><small>{item.label}</small></span>{locale === item.code && <Check size={16} />}</button>)}</div>}
          </div>
          <div className="account-menu" ref={accountRef}>
            <button ref={accountButton} className="account-trigger" type="button" onClick={() => { setAccountOpen((value) => !value); setLanguageOpen(false); }} aria-expanded={accountOpen} aria-controls="account-menu-panel" aria-haspopup="dialog" aria-label={t("Open account menu")}><CircleUserRound size={26} /><span>{role === "public" ? "Sign in" : ROLE_LABELS[role]}</span><ChevronDown className="account-chevron" size={15} /></button>
            {accountOpen && <div className="account-panel" id="account-menu-panel">
              <header><CircleUserRound size={34} /><div className="account-identity"><div className="account-title-row"><strong>{role === "public" ? "Sign in" : "Account"}</strong><label><span className="sr-only">{role === "public" ? "Sign in as test user" : "Select user type"}</span><select className="account-role-select" aria-label={role === "public" ? "Sign in as test user" : "Select user type"} value={role === "public" ? "" : role} onChange={(event) => {
                const nextRole = event.target.value as Role;
                if (!nextRole) return;
                onRoleChange(nextRole);
              }}><option value="" disabled>Select user type</option>{TEST_ROLES.map((item) => <option value={item} key={item}>{ROLE_LABELS[item]}</option>)}</select></label></div><span>{role === "public" ? "Choose a test user to continue" : ROLE_ACCESS_SUMMARIES[role]}</span></div></header>
              {role !== "public" && <nav aria-label="Account">
                <AppLink href={primaryArea!.homeHref} className="account-primary-area" style={roleAreaStyle} data-access-level={`L${roleArea!.level}`}><LayoutDashboard size={17} /><span><strong>{primaryArea!.label}</strong><small>Role-specific tools, priorities and access</small></span></AppLink>
                <AppLink href="/workspace/saved"><Bookmark size={17} /><span><strong>Saved and AI History</strong><small>Knowledge items and permitted conversations</small></span></AppLink>
                <AppLink href="/workspace/profile"><Settings size={17} /><span><strong>Profile &amp; preferences</strong><small>Language and account settings</small></span></AppLink>
                <button className="account-logout" type="button" onClick={() => { onRoleChange("public"); setAccountOpen(false); }}><LogOut size={17} /><span><strong>Log out</strong><small>Return to the public experience</small></span></button>
              </nav>}
            </div>}
          </div>
        </div>
      </div>
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="gef-footer">
      <div className="gef-footer-main"><div className="content-width gef-footer-grid">
        <section className="gef-footer-brand" aria-labelledby="follow-gef"><a href="https://www.thegef.org/" target="_blank" rel="noreferrer"><img src={publicAssetUrl("/brand/gef-logo-white.svg")} alt="Global Environment Facility" /></a><h2 id="follow-gef">Follow Us</h2><div className="gef-socials"><a href="https://x.com/theGEF" target="_blank" rel="noreferrer" aria-label="GEF on X"><span aria-hidden="true">X</span></a><a href="https://www.facebook.com/TheGEF1/" target="_blank" rel="noreferrer" aria-label="GEF on Facebook"><Facebook /></a><a href="https://www.linkedin.com/company/global-environment-facility" target="_blank" rel="noreferrer" aria-label="GEF on LinkedIn"><Linkedin /></a><a href="https://www.instagram.com/gef_global_environment/?hl=en" target="_blank" rel="noreferrer" aria-label="GEF on Instagram"><Instagram /></a><a href="https://www.youtube.com/user/GEFSecretariat" target="_blank" rel="noreferrer" aria-label="GEF on YouTube"><Youtube /></a><a href="https://www.flickr.com/photos/thegef" target="_blank" rel="noreferrer" aria-label="GEF on Flickr"><Camera /></a></div></section>
        <nav className="gef-footer-links gef-footer-affiliates" aria-labelledby="gef-affiliated-sites"><h2 id="gef-affiliated-sites">GEF Affiliated Sites</h2><a href="https://gefportal.worldbank.org" target="_blank" rel="noreferrer">GEF Portal</a><a href="https://www.gefieo.org/" target="_blank" rel="noreferrer">Independent Evaluation Office</a><a href="https://www.stapgef.org/" target="_blank" rel="noreferrer">Scientific and Technical Advisory Panel</a><a href="https://www.thegef.org/what-we-do/topics/gef-small-grants-program" target="_blank" rel="noreferrer">Small Grants Program</a></nav>
        <nav className="gef-footer-links" aria-labelledby="gef-who-we-are"><h2 id="gef-who-we-are">Who We Are</h2><a href="https://www.thegef.org/who-we-are/staff" target="_blank" rel="noreferrer">GEF Secretariat Staff</a><a href="https://www.thegef.org/projects-operations/conflict-resolution-commissioner" target="_blank" rel="noreferrer">Conflict Resolution Commissioner</a><a href="https://www.thegef.org/who-we-are/gef-council/members-alternates" target="_blank" rel="noreferrer">Council Members &amp; Alternates</a><a href="https://www.thegef.org/who-we-are/focal-points" target="_blank" rel="noreferrer">Focal Points</a><a href="https://www.thegef.org/careers" target="_blank" rel="noreferrer">Careers</a><a href="https://www.thegef.org/legal" target="_blank" rel="noreferrer">Legal</a><a href="https://www.thegef.org/contact-us" target="_blank" rel="noreferrer">Contact Us</a></nav>
      </div></div>
      <div className="gef-footer-bar"><div className="content-width"><p>© 2026 Global Environment Facility, All Rights Reserved.</p><nav aria-label="Platform footer"><AppLink href="/privacy">Privacy</AppLink><AppLink href="/accessibility">Accessibility</AppLink><AppLink href="/help">Help</AppLink><a href="https://www.thegef.org/legal" target="_blank" rel="noreferrer">Legal</a></nav></div></div>
    </footer>
  </div>;
}
