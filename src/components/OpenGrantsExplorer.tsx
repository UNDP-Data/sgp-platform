import * as d3 from "d3";
import {
  ArrowDownAZ, ArrowRight, CalendarClock, CalendarDays, CircleDollarSign, CloudSun, ExternalLink, Layers3, Leaf,
  MapPin, Minus, Mountain, Plus, Recycle, RotateCcw, Search, Shield, Sparkles, Users, Waves, X
} from "lucide-react";
import { Component, type CSSProperties, type MouseEvent, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useProjects } from "../hooks/useContent";
import { useI18n } from "../i18n";
import {
  buildHistoricalCountryStats,
  eastWrapPacificLongitude,
  GRANT_MAP_REGIONS,
  grantMapRegion,
  PACIFIC_EAST_WRAP_ISO3,
  type HistoricalCountryStat
} from "../lib/grants/historicalMap";
import { parseScaleTranslateMatrix } from "../lib/grants/mapTransform";
import { publicAssetUrl } from "../lib/browser/assets";
import { loadWorldGeo } from "../lib/data/loaders";
import { focalAreaColor } from "../lib/viz/color";
import { OPEN_GRANTS, OPEN_GRANT_THEMES, openGrantHref, type OpenGrant, type OpenGrantTheme } from "../data/open-grants";
import type { Role } from "../auth/roles";
import { OptimizedImage } from "./OptimizedImage";
import { AppLink } from "./AppLink";
import type { WorldGeo } from "./WorldChoropleth";

const THEME_ICONS = {
  "Biodiversity": Leaf,
  "Climate Change": CloudSun,
  "Land Degradation": Mountain,
  "Multifocal Area": Layers3,
  "Capacity Development": Users,
  "International Waters": Waves,
  "Chemicals and Waste": Recycle,
  "Climate Change Adaptation": Shield
} satisfies Record<OpenGrantTheme, typeof Leaf>;

const OPEN_GRANT_REGION_IDS: Record<string, string> = {
  "Africa": "RBA",
  "Asia and the Pacific": "RBAP",
  "Arab States": "RBAS",
  "Europe and Central Asia": "RBEC",
  "Latin America and the Caribbean": "RBLAC"
};

const OPEN_GRANT_AGENCIES = ["UNDP", "FAO", "CI"] as const satisfies readonly OpenGrant["managingAgency"][];
type OpenGrantAgency = OpenGrant["managingAgency"];
const OPEN_GRANT_AGENCY_LOGOS: Record<OpenGrantAgency, string> = {
  UNDP: "/brand/agencies/undp.svg",
  FAO: "/brand/agencies/fao.svg",
  CI: "/brand/agencies/conservation-international.svg"
};

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;
const MAP_TRANSITION_MS = 680;
const MAP_BASE_SCALE = 1000;
const RADIANS = Math.PI / 180;

type MapTooltip = {
  iso3: string;
  country: string;
  historicCount: number;
  openCount: number;
  region: string;
};

type ProjectedFeatureGeometry = {
  path: string | undefined;
  bounds: [[number, number], [number, number]];
  centroid: [number, number];
};

class OpenGrantsMapBoundary extends Component<
  { children: ReactNode; fallback: (retry: () => void) => ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  private retry = () => {
    this.setState({ failed: false });
  };

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}

function fitProjectedGeometry(
  geometries: ProjectedFeatureGeometry[],
  horizontalPadding: number,
  verticalPadding: number,
  maximumProjectionScale: number
) {
  const validBounds = geometries.map((geometry) => geometry.bounds).filter((bounds) => bounds.flat().every(Number.isFinite));
  if (!validBounds.length) return { scale: .175, translate: [MAP_WIDTH / 2, MAP_HEIGHT / 2] as [number, number] };
  const x0 = Math.min(...validBounds.map((bounds) => bounds[0][0]));
  const y0 = Math.min(...validBounds.map((bounds) => bounds[0][1]));
  const x1 = Math.max(...validBounds.map((bounds) => bounds[1][0]));
  const y1 = Math.max(...validBounds.map((bounds) => bounds[1][1]));
  const availableWidth = MAP_WIDTH - horizontalPadding * 2;
  const availableHeight = MAP_HEIGHT - verticalPadding * 2;
  const fittedScale = Math.min(availableWidth / Math.max(1, x1 - x0), availableHeight / Math.max(1, y1 - y0));
  const scale = Math.min(fittedScale, maximumProjectionScale / MAP_BASE_SCALE);
  return {
    scale,
    translate: [
      MAP_WIDTH / 2 - scale * (x0 + x1) / 2,
      MAP_HEIGHT / 2 - scale * (y0 + y1) / 2
    ] as [number, number]
  };
}

function MapMarker({ x, y, count, selected }: { x: number; y: number; count: number; selected: boolean }) {
  return <g className="open-grants-marker" transform={`translate(${x} ${y})`} aria-hidden="true">
    <g className="open-grants-marker__scale">
      <circle className="open-grants-marker__pulse" r={selected ? 17 : 14} />
      <circle className="open-grants-marker__dot" r={selected ? 12 : 9} />
      <text y="3.5" textAnchor="middle">{count}</text>
    </g>
  </g>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00Z`));
}

function searchableGrant(grant: OpenGrant) {
  return [
    grant.title, grant.summary, grant.countryName, grant.location, grant.region, grant.agencyLabel,
    ...grant.themes, ...grant.applicantTypes, ...grant.priorities
  ].join(" ").toLowerCase();
}

function ThemeSymbols({ themes, labelled = false }: { themes: OpenGrantTheme[]; labelled?: boolean }) {
  const { t } = useI18n();
  const translatedThemes = themes.map((theme) => t(theme));
  return <div className={`grant-theme-symbols ${labelled ? "grant-theme-symbols--labelled" : ""}`} aria-label={`${t("Themes")}: ${translatedThemes.join(", ")}`}>
    {themes.map((theme) => {
      const Icon = THEME_ICONS[theme];
      return <span key={theme} title={t(theme)} style={{ "--grant-theme-color": focalAreaColor(theme) } as CSSProperties}><Icon size={labelled ? 16 : 14} aria-hidden="true" />{labelled && <b>{t(theme)}</b>}</span>;
    })}
  </div>;
}

function AgencyMark({ agency }: { agency: OpenGrantAgency }) {
  return <span className={`open-grants-agency-mark open-grants-agency-mark--${agency.toLowerCase()}`} aria-hidden="true">
    <img src={publicAssetUrl(OPEN_GRANT_AGENCY_LOGOS[agency])} alt="" width="48" height="28" decoding="async" />
  </span>;
}

function OpenGrantsMap({
  geo,
  grants,
  historicalCountries,
  historicalLoading,
  historicalError,
  filters,
  selectedRegion,
  fitToMatchingGrants,
  selectedCountry,
  hoveredCountry,
  onCountrySelect,
  onCountryHover
}: {
  geo: WorldGeo;
  grants: OpenGrant[];
  historicalCountries: Map<string, HistoricalCountryStat>;
  historicalLoading: boolean;
  historicalError: string;
  filters: ReactNode;
  selectedRegion: string | null;
  fitToMatchingGrants: boolean;
  selectedCountry: string | null;
  hoveredCountry: string | null;
  onCountrySelect: (iso3: string | null) => void;
  onCountryHover: (iso3: string | null) => void;
}) {
  const { t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const navigationLayerRef = useRef<SVGGElement>(null);
  const geometryLayerRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipFrameRef = useRef<number | null>(null);
  const pendingTooltipPositionRef = useRef<[number, number] | null>(null);
  const grantsByCountry = useMemo(() => {
    const result = new Map<string, OpenGrant[]>();
    for (const grant of grants) result.set(grant.countryIso3, [...(result.get(grant.countryIso3) ?? []), grant]);
    return result;
  }, [grants]);
  const activeHistoricalCountries = useMemo(() => selectedRegion
    ? new Map([...historicalCountries].filter(([, country]) => country.regionId === selectedRegion))
    : historicalCountries, [historicalCountries, selectedRegion]);
  const focusIso3 = useMemo(() => {
    if (selectedCountry) return new Set([selectedCountry]);
    if (fitToMatchingGrants && grantsByCountry.size) return new Set(grantsByCountry.keys());
    if (selectedRegion) return new Set(activeHistoricalCountries.keys());
    return new Set(activeHistoricalCountries.keys());
  }, [activeHistoricalCountries, fitToMatchingGrants, grantsByCountry, selectedCountry, selectedRegion]);
  const projectedFeatureGeometry = useMemo(() => {
    const standardPath = d3.geoPath(
      d3.geoNaturalEarth1().scale(MAP_BASE_SCALE).translate([0, 0]).precision(.2)
    ).digits(4);
    const naturalEarthRaw = d3.geoNaturalEarth1Raw as unknown as (longitude: number, latitude: number) => [number, number];
    const pacificEastProjection = (iso3: string) => d3.geoTransform({
      point(longitude, latitude) {
        const wrappedLongitude = eastWrapPacificLongitude(iso3, longitude);
        const [x, y] = naturalEarthRaw(wrappedLongitude * RADIANS, latitude * RADIANS);
        this.stream.point(x * MAP_BASE_SCALE, -y * MAP_BASE_SCALE);
      }
    });
    return geo.features.map((feature) => {
      const iso3 = String(feature.properties?.iso3 ?? "");
      const renderer = PACIFIC_EAST_WRAP_ISO3.has(iso3) ? d3.geoPath(pacificEastProjection(iso3)).digits(4) : standardPath;
      return {
        path: renderer(feature) ?? undefined,
        bounds: renderer.bounds(feature),
        centroid: renderer.centroid(feature)
      } satisfies ProjectedFeatureGeometry;
    });
  }, [geo.features]);
  const geometryByIso = useMemo(() => new Map(geo.features.map((feature, index) => [
    String(feature.properties?.iso3 ?? ""),
    projectedFeatureGeometry[index]
  ])), [geo.features, projectedFeatureGeometry]);
  const focusGeometries = useMemo(() => [...focusIso3].map((iso3) => geometryByIso.get(iso3)).filter((geometry): geometry is ProjectedFeatureGeometry => Boolean(geometry)), [focusIso3, geometryByIso]);
  const viewport = useMemo(() => {
    const geometries = focusGeometries.length ? focusGeometries : projectedFeatureGeometry;
    const sparseView = focusGeometries.length > 0 && focusGeometries.length <= 4;
    const horizontalPadding = selectedCountry ? 96 : sparseView ? 62 : 48;
    const verticalPadding = selectedCountry ? 72 : sparseView ? 48 : 38;
    const maximumScale = selectedCountry ? 1750 : sparseView ? 1300 : selectedRegion || fitToMatchingGrants ? 820 : 250;
    return fitProjectedGeometry(geometries, horizontalPadding, verticalPadding, maximumScale);
  }, [fitToMatchingGrants, focusGeometries, projectedFeatureGeometry, selectedCountry, selectedRegion]);
  const geometryTransform = useMemo(() => {
    const [translateX, translateY] = viewport.translate;
    const scale = viewport.scale;
    return `matrix(${scale.toFixed(5)} 0 0 ${scale.toFixed(5)} ${translateX.toFixed(3)} ${translateY.toFixed(3)})`;
  }, [viewport]);
  const maxHistoricalCount = Math.max(1, ...[...historicalCountries.values()].map((country) => country.projectCount));
  const historicalFill = useMemo(() => {
    const fills = new Map<string, string>();
    for (const [iso3, country] of activeHistoricalCountries) {
      const region = grantMapRegion(country.regionId);
      const intensity = .18 + .78 * (Math.log1p(country.projectCount) / Math.log1p(maxHistoricalCount));
      fills.set(iso3, d3.interpolateLab(region.light, region.dark)(intensity));
    }
    return fills;
  }, [activeHistoricalCountries, maxHistoricalCount]);
  const kpiGrantRows = selectedCountry ? grantsByCountry.get(selectedCountry) ?? [] : grants;
  const kpiGrants = kpiGrantRows.length;
  const kpiFunding = kpiGrantRows.reduce((total, grant) => total + grant.fundingMax, 0);
  const kpiCountries = selectedCountry ? Number(kpiGrants > 0) : grantsByCountry.size;
  const selectedCountryName = selectedCountry
    ? grantsByCountry.get(selectedCountry)?.[0]?.countryName ?? historicalCountries.get(selectedCountry)?.countryName
    : "";
  const markerPositions = useMemo(() => {
    return [...grantsByCountry.entries()].flatMap(([iso3, rows]) => {
      const geometry = geometryByIso.get(iso3);
      if (!geometry) return [];
      const point = geometry.centroid;
      return point.every(Number.isFinite) ? [{ iso3, rows, point }] : [];
    });
  }, [geometryByIso, grantsByCountry]);
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null);

  useLayoutEffect(() => {
    const layer = geometryLayerRef.current;
    if (!layer) return;
    const selection = d3.select(layer);
    const markerScales = selection.selectAll<SVGGElement, unknown>(".open-grants-marker__scale");
    selection.interrupt("viewport");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const currentTransform = layer.getAttribute("transform");
    const targetScale = viewport.scale;
    const [targetX, targetY] = viewport.translate;

    if (!currentTransform || reducedMotion) {
      selection.attr("transform", geometryTransform);
      markerScales.attr("transform", `scale(${1 / targetScale})`);
      return () => { selection.interrupt("viewport"); };
    }

    const matrix = parseScaleTranslateMatrix(currentTransform);
    if (!matrix) {
      selection.attr("transform", geometryTransform);
      markerScales.attr("transform", `scale(${1 / targetScale})`);
      return () => { selection.interrupt("viewport"); };
    }
    const startScale = matrix.scale;
    const interpolateScale = d3.interpolateNumber(startScale, targetScale);
    const interpolateX = d3.interpolateNumber(matrix.translate[0], targetX);
    const interpolateY = d3.interpolateNumber(matrix.translate[1], targetY);

    markerScales
      .filter(function initializeNewMarker() { return !this.hasAttribute("transform"); })
      .attr("transform", `scale(${1 / startScale})`);

    selection
      .transition("viewport")
      .duration(MAP_TRANSITION_MS)
      .ease(d3.easeCubicInOut)
      .tween("viewport", () => (progress) => {
        const scale = interpolateScale(progress);
        layer.setAttribute("transform", `matrix(${scale} 0 0 ${scale} ${interpolateX(progress)} ${interpolateY(progress)})`);
        d3.select(layer)
          .selectAll<SVGGElement, unknown>(".open-grants-marker__scale")
          .attr("transform", `scale(${1 / scale})`);
      });

    return () => { selection.interrupt("viewport"); };
  }, [geometryTransform, markerPositions, viewport]);

  useEffect(() => {
    const svg = svgRef.current;
    const navigationLayer = navigationLayerRef.current;
    if (!svg || !navigationLayer) return;
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]])
      .scaleExtent([1, 4])
      .translateExtent([[-MAP_WIDTH, -MAP_HEIGHT], [MAP_WIDTH * 2, MAP_HEIGHT * 2]])
      .filter((event) => !event.button || event.type === "wheel")
      .on("zoom", (event) => {
        d3.select(navigationLayer).attr("transform", event.transform.toString());
      });
    zoomBehaviorRef.current = zoomBehavior;
    d3.select(svg).call(zoomBehavior);
    return () => {
      d3.select(svg).on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;
    d3.select(svg).interrupt().call(zoomBehavior.transform, d3.zoomIdentity);
  }, [geometryTransform]);

  useEffect(() => () => {
    if (tooltipFrameRef.current !== null) cancelAnimationFrame(tooltipFrameRef.current);
  }, []);

  function changeZoom(factor: number) {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;
    const currentScale = d3.zoomTransform(svg).k;
    const nextScale = Math.max(1, Math.min(4, currentScale * factor));
    d3.select(svg)
      .interrupt()
      .transition()
      .duration(260)
      .ease(d3.easeCubicOut)
      .call(zoomBehavior.scaleTo, nextScale, [MAP_WIDTH / 2, MAP_HEIGHT / 2]);
  }

  function resetZoom() {
    const svg = svgRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svg || !zoomBehavior) return;
    d3.select(svg)
      .interrupt()
      .transition()
      .duration(300)
      .ease(d3.easeCubicOut)
      .call(zoomBehavior.transform, d3.zoomIdentity);
  }

  function positionTooltip(event: MouseEvent<SVGPathElement>) {
    const frame = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!frame) return;
    pendingTooltipPositionRef.current = [
      Math.max(10, Math.min(frame.width - 190, event.clientX - frame.left + 14)),
      Math.max(10, Math.min(frame.height - 82, event.clientY - frame.top + 14))
    ];
    if (tooltipFrameRef.current !== null) return;
    tooltipFrameRef.current = requestAnimationFrame(() => {
      tooltipFrameRef.current = null;
      const position = pendingTooltipPositionRef.current;
      if (!position || !tooltipRef.current) return;
      tooltipRef.current.style.transform = `translate3d(${position[0]}px, ${position[1]}px, 0)`;
    });
  }

  function showTooltip(event: MouseEvent<SVGPathElement>, iso3: string, country: string) {
    const historic = historicalCountries.get(iso3);
    setTooltip({
      iso3,
      country,
      historicCount: historic?.projectCount ?? 0,
      openCount: grantsByCountry.get(iso3)?.length ?? 0,
      region: grantMapRegion(historic?.regionId).label
    });
    positionTooltip(event);
  }

  function hideTooltip() {
    pendingTooltipPositionRef.current = null;
    if (tooltipFrameRef.current !== null) {
      cancelAnimationFrame(tooltipFrameRef.current);
      tooltipFrameRef.current = null;
    }
    setTooltip(null);
  }

  function resetMapSelection() {
    hideTooltip();
    onCountryHover(null);
    onCountrySelect(null);
    resetZoom();
  }

  const mapContext = historicalLoading
    ? t("Loading historical programme coverage")
    : historicalError
      ? t("Historical coverage unavailable")
      : selectedCountryName || (selectedRegion ? grantMapRegion(selectedRegion).label : "");

  return <section className="open-grants-map" aria-labelledby="open-grants-map-title">
    <header>
      <div className="open-grants-map-heading">
        <span>Operational under SGP 2.0</span>
        <h3 id="open-grants-map-title">View available SGP Grants</h3>
        {mapContext && <p>{mapContext}</p>}
      </div>
    </header>
    <div className="open-grants-map-kpis" role="status" aria-live="polite">
      <span><strong>{kpiGrants}</strong><small>Open grants</small></span>
      <span><strong>{kpiCountries}</strong><small>Countries with grants available</small></span>
      <span title={formatMoney(kpiFunding)}><strong>{formatCompactMoney(kpiFunding)}</strong><small>Available grant funding</small></span>
    </div>
    {filters}
    <div className="open-grants-map-frame">
      <svg ref={svgRef} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="open-grants-map-svg-title" onClick={resetMapSelection}>
        <title id="open-grants-map-svg-title">World map colored by SGP region and shaded by historical project count, with markers for currently open grant opportunities</title>
        <g ref={navigationLayerRef}>
        <g ref={geometryLayerRef} className="open-grants-geometry-layer">
        {geo.features.map((feature, featureIndex) => {
          const iso3 = String(feature.properties?.iso3 ?? "");
          const rows = grantsByCountry.get(iso3) ?? [];
          const historic = activeHistoricalCountries.get(iso3);
          const hasGrants = rows.length > 0;
          const hasHistory = Boolean(historic);
          const selected = selectedCountry === iso3;
          const hovered = hoveredCountry === iso3 || tooltip?.iso3 === iso3;
          const country = rows[0]?.countryName ?? historic?.countryName ?? String(feature.properties?.name ?? iso3);
          return <path
            key={iso3 || String(feature.properties?.name)}
            d={projectedFeatureGeometry[featureIndex]?.path}
            className={["open-grants-country", hasHistory ? "has-history" : "", hasGrants ? "has-grants" : "", selected ? "is-selected" : "", hovered ? "is-hovered" : ""].filter(Boolean).join(" ")}
            fill={historicalFill.get(iso3) ?? (hasGrants ? "#e8b94f" : "#d9e1e4")}
            aria-hidden="true"
            focusable="false"
            onMouseEnter={(event) => {
              if (hasGrants) onCountryHover(iso3);
              if (hasHistory || hasGrants) showTooltip(event, iso3, country);
            }}
            onMouseMove={(event) => (hasHistory || hasGrants) && positionTooltip(event)}
            onMouseLeave={() => { hideTooltip(); onCountryHover(null); }}
            onClick={(event) => {
              if (!hasGrants) return;
              event.stopPropagation();
              onCountrySelect(selected ? null : iso3);
            }}
          />;
        })}
        {markerPositions.map(({ iso3, rows, point }) => <MapMarker key={`marker-${iso3}`} x={point[0]} y={point[1]} count={rows.length} selected={selectedCountry === iso3} />)}
        </g>
        </g>
      </svg>
      <div className="open-grants-map-control-dock" role="group" aria-label="Map navigation">
        <button type="button" onClick={() => changeZoom(1.45)} aria-label="Zoom in" title="Zoom in"><Plus size={16} /></button>
        <button type="button" onClick={() => changeZoom(1 / 1.45)} aria-label="Zoom out" title="Zoom out"><Minus size={16} /></button>
        <span className="open-grants-map-control-divider" aria-hidden="true" />
        <button className="open-grants-map-reset" type="button" onClick={resetMapSelection} aria-label="Reset map view and country selection" title="Reset map"><RotateCcw size={15} /></button>
      </div>
      {tooltip && <div ref={tooltipRef} className="open-grants-map-tooltip">
        <strong>{tooltip.country}</strong>
        <span>{tooltip.region}</span>
        <small>{tooltip.historicCount.toLocaleString()} {t(tooltip.historicCount === 1 ? "past project" : "past projects")}{tooltip.openCount > 0 ? ` · ${tooltip.openCount} ${t(tooltip.openCount === 1 ? "open grant" : "open grants")}` : ""}</small>
      </div>}
    </div>
  </section>;
}

function GrantCard({ grant, active, onHover, onOpen }: { grant: OpenGrant; active: boolean; onHover: (active: boolean) => void; onOpen: () => void }) {
  const { locale } = useI18n();
  return <article
    className={`open-grant-card ${active ? "is-active" : ""}`}
    tabIndex={0}
    onMouseEnter={() => onHover(true)}
    onMouseLeave={() => onHover(false)}
    onFocus={() => onHover(true)}
    onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && onHover(false)}
    onClick={onOpen}
    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } }}
    aria-label={`Open details for ${grant.title}`}
  >
    <OptimizedImage src={grant.imageUrl} alt={grant.imageAlt} sizes="(max-width: 520px) 84px, 100px" />
    <div className="open-grant-card__body">
      <div className="open-grant-card__meta"><span>{grant.countryName}</span><b>{grant.managingAgency}</b></div>
      <h3>{grant.title}</h3>
      <ThemeSymbols themes={grant.themes} />
      <div className="open-grant-card__facts">
        <span><small>Up to</small><strong>{formatMoney(grant.fundingMax)}</strong></span>
        <span><small>Closes</small><strong key={locale}>{formatDate(grant.deadline, locale)}</strong></span>
        <span className="open-grant-card__action">Details <ArrowRight size={14} /></span>
      </div>
    </div>
  </article>;
}

function GrantDetailMedia({ grant, page = false }: { grant: OpenGrant; page?: boolean }) {
  return <figure className={page ? "open-grant-page__media" : undefined}>
    <OptimizedImage
      src={grant.imageUrl}
      alt={grant.imageAlt}
      sizes={page ? "(max-width: 900px) 100vw, 1180px" : "(max-width: 768px) 94vw, 736px"}
      priority
    />
    <figcaption><a href={grant.photoSourceUrl} target="_blank" rel="noreferrer">Photo from the SGP story archive <ExternalLink size={12} /></a></figcaption>
  </figure>;
}

function GrantDetailContent({
  grant,
  role,
  headingId,
  headingLevel = 2,
  beforeNavigate
}: {
  grant: OpenGrant;
  role: Role;
  headingId: string;
  headingLevel?: 1 | 2;
  beforeNavigate?: () => void;
}) {
  const { locale } = useI18n();
  const external = grant.managingAgency !== "UNDP";
  const countryOperator = role === "programme-assistant" || role === "national-coordinator";
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return <>
    <div className="grant-detail-kicker"><span>Test opportunity</span><b>Open</b></div>
    <p className="grant-detail-place"><MapPin size={16} />{grant.countryName} · {grant.location}</p>
    <Heading id={headingId}>{grant.title}</Heading>
    <ThemeSymbols themes={grant.themes} labelled />
    <p className="grant-detail-summary">{grant.summary}</p>
    <div className="grant-detail-facts">
      <div><CircleDollarSign /><span><small>Funding range</small><strong>{formatMoney(grant.fundingMin)}-{formatMoney(grant.fundingMax)}</strong></span></div>
      <div><CalendarDays /><span><small>Deadline</small><strong key={locale}>{formatDate(grant.deadline, locale)}</strong></span></div>
      <div><Sparkles /><span><small>Delivery period</small><strong>{grant.durationMonths}</strong></span></div>
    </div>
    <section><h3>Who can apply</h3><p>{grant.eligibility}</p><div className="grant-detail-tags">{grant.applicantTypes.map((item) => <span key={item}>{item}</span>)}</div></section>
    <div className="grant-detail-columns"><section><h3>Priority areas</h3><ul>{grant.priorities.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>Expected outputs</h3><ul>{grant.expectedOutputs.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
    <section className="grant-detail-agency"><span>Managing agency</span><strong>{grant.agencyLabel}</strong><small>Experience pattern: {grant.referenceProject}</small></section>
    {external ? <a className="button button--primary" href={grant.managingAgency === "FAO" ? "https://www.fao.org/" : "https://www.conservation.org/"} target="_blank" rel="noreferrer">
      Continue with {grant.managingAgency} <ExternalLink size={16} />
    </a> : countryOperator ? <AppLink className="button button--primary" href="/workspace/intake" onClick={beforeNavigate}>
      Open country intake <ArrowRight size={16} />
    </AppLink> : <AppLink className="button button--primary" href={`/help/contact?topic=grant&country=${encodeURIComponent(grant.countryName)}`} onClick={beforeNavigate}>
      Contact country programme <ArrowRight size={16} />
    </AppLink>}
    <div className="grant-eligibility-note" role="status"><Shield /><span><strong>Country-managed application process</strong><small>Applicant organizations submit through the process named by the country programme; they do not require a KLP account in the current model.</small></span></div>
    <AppLink className="grant-detail-guidance-link" href="/help/applicants" onClick={beforeNavigate}>Review the funding pathway</AppLink>
  </>;
}

function GrantDetailPanel({ grant, onClose, role }: { grant: OpenGrant; onClose: () => void; role: Role }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: globalThis.KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  return <div className="grant-detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="grant-detail-panel" role="dialog" aria-modal="true" aria-labelledby="grant-detail-dialog-title">
      <button className="grant-detail-close" type="button" onClick={onClose} aria-label="Close grant details"><X /></button>
      <GrantDetailMedia grant={grant} />
      <div className="grant-detail-content">
        <div className="grant-detail-nav">
          <button className="grant-detail-return" type="button" onClick={onClose}><ArrowRight size={15} />Return to grant map</button>
          <AppLink className="grant-detail-page-link" href={openGrantHref(grant.id)} onClick={onClose}>Open grant page <ArrowRight size={15} /></AppLink>
        </div>
        <GrantDetailContent grant={grant} role={role} headingId="grant-detail-dialog-title" beforeNavigate={onClose} />
      </div>
    </aside>
  </div>;
}

export function OpenGrantPage({ grant, role }: { grant: OpenGrant; role: Role }) {
  return <section className="open-grant-page" aria-labelledby="open-grant-page-title">
    <div className="content-width open-grant-page__inner">
      <AppLink className="open-grant-page__return" href="/funding"><ArrowRight size={16} />Back to open grants</AppLink>
      <article className="open-grant-page__card">
        <GrantDetailMedia grant={grant} page />
        <div className="grant-detail-content open-grant-page__content">
          <GrantDetailContent grant={grant} role={role} headingId="open-grant-page-title" headingLevel={1} />
        </div>
      </article>
    </div>
  </section>;
}

export function OpenGrantsExplorer({ role }: { role: Role }) {
  const { t } = useI18n();
  const explorerRef = useRef<HTMLElement>(null);
  const [geo, setGeo] = useState<WorldGeo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<OpenGrantTheme[]>([]);
  const [previewedTheme, setPreviewedTheme] = useState<OpenGrantTheme | "all" | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<OpenGrant["managingAgency"] | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredGrantId, setHoveredGrantId] = useState<string | null>(null);
  const [selectedGrant, setSelectedGrant] = useState<OpenGrant | null>(null);
  const [grantSort, setGrantSort] = useState<"closing" | "alphabetical">("closing");
  const [resultsLayout, setResultsLayout] = useState({ height: 0, sticky: false });
  const { projects, loading: historicalLoading, error: historicalError } = useProjects();

  useEffect(() => {
    let active = true;
    loadWorldGeo().then((world) => active && setGeo(world as WorldGeo)).catch((error: Error) => active && setLoadError(error.message));
    return () => { active = false; };
  }, []);

  useLayoutEffect(() => {
    const explorer = explorerRef.current;
    if (!explorer) return;
    let frame = 0;
    const syncResultsLayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = Math.ceil(explorer.getBoundingClientRect().height);
        const sticky = window.innerWidth > 980 && height <= window.innerHeight - 104;
        setResultsLayout((current) => current.height === height && current.sticky === sticky ? current : { height, sticky });
      });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncResultsLayout);
    observer?.observe(explorer);
    window.addEventListener("resize", syncResultsLayout, { passive: true });
    syncResultsLayout();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", syncResultsLayout);
    };
  }, []);

  const historicalCountries = useMemo(() => buildHistoricalCountryStats(projects), [projects]);
  const openGrantRegionIds = useMemo(() => new Map(OPEN_GRANTS.map((grant) => [
    grant.id,
    historicalCountries.get(grant.countryIso3)?.regionId ?? OPEN_GRANT_REGION_IDS[grant.region] ?? ""
  ])), [historicalCountries]);
  const terms = query.trim().toLowerCase();
  const queryMatches = useMemo(() => OPEN_GRANTS.filter((grant) =>
    !terms || searchableGrant(grant).includes(terms)
  ), [terms]);
  const agencyMatches = useMemo(() => queryMatches.filter((grant) =>
    !selectedAgency || grant.managingAgency === selectedAgency
  ), [queryMatches, selectedAgency]);
  const thematicMatches = useMemo(() => agencyMatches.filter((grant) =>
    (!selectedThemes.length || selectedThemes.some((theme) => grant.themes.includes(theme)))
  ), [agencyMatches, selectedThemes]);
  const regionalMatches = useMemo(() => thematicMatches.filter((grant) => !selectedRegion || openGrantRegionIds.get(grant.id) === selectedRegion), [openGrantRegionIds, selectedRegion, thematicMatches]);
  const visibleGrants = useMemo(() => regionalMatches.filter((grant) => !selectedCountry || grant.countryIso3 === selectedCountry), [regionalMatches, selectedCountry]);
  const sortedVisibleGrants = useMemo(() => [...visibleGrants].sort((left, right) =>
    grantSort === "alphabetical"
      ? left.title.localeCompare(right.title)
      : left.deadline.localeCompare(right.deadline)
  ), [grantSort, visibleGrants]);
  const themeCountSource = useMemo(() => agencyMatches.filter((grant) =>
    (!selectedRegion || openGrantRegionIds.get(grant.id) === selectedRegion)
  ), [agencyMatches, openGrantRegionIds, selectedRegion]);
  const themeCounts = useMemo(() => new Map(OPEN_GRANT_THEMES.map((theme) => [theme, themeCountSource.filter((grant) => grant.themes.includes(theme)).length])), [themeCountSource]);
  const regionGrantCounts = useMemo(() => new Map(GRANT_MAP_REGIONS.map((region) => [
    region.key,
    thematicMatches.filter((grant) => openGrantRegionIds.get(grant.id) === region.key).length
  ])), [openGrantRegionIds, thematicMatches]);
  const agencyCountSource = useMemo(() => queryMatches.filter((grant) =>
    (!selectedThemes.length || selectedThemes.some((theme) => grant.themes.includes(theme))) &&
    (!selectedRegion || openGrantRegionIds.get(grant.id) === selectedRegion)
  ), [openGrantRegionIds, queryMatches, selectedRegion, selectedThemes]);
  const agencyCounts = useMemo(() => new Map(OPEN_GRANT_AGENCIES.map((agency) => [
    agency,
    agencyCountSource.filter((grant) => grant.managingAgency === agency).length
  ])), [agencyCountSource]);
  const hoveredGrant = hoveredGrantId ? OPEN_GRANTS.find((grant) => grant.id === hoveredGrantId) : null;
  const effectiveHoveredCountry = hoveredGrant?.countryIso3 ?? hoveredCountry;
  const selectedCountryName = selectedCountry ? OPEN_GRANTS.find((grant) => grant.countryIso3 === selectedCountry)?.countryName ?? selectedCountry : "";
  const selectedRegionMeta = selectedRegion ? grantMapRegion(selectedRegion) : null;
  const resultContext = selectedCountryName
    || selectedRegionMeta?.label
    || (selectedAgency ? `${selectedAgency} grants` : "");
  const hasActiveFilters = Boolean(query || selectedThemes.length || selectedRegion || selectedAgency || selectedCountry);

  function toggleTheme(theme: OpenGrantTheme) {
    setSelectedThemes((current) => current.includes(theme)
      ? current.filter((selectedTheme) => selectedTheme !== theme)
      : [...current, theme]
    );
    setSelectedCountry(null);
  }

  function toggleRegion(regionId: string | null) {
    setSelectedRegion(regionId);
    setSelectedCountry(null);
    setHoveredCountry(null);
    setHoveredGrantId(null);
  }

  function toggleAgency(agency: OpenGrantAgency | null) {
    setSelectedAgency(agency);
    setSelectedCountry(null);
    setHoveredCountry(null);
    setHoveredGrantId(null);
  }

  function clearFilters() {
    setQuery("");
    setSelectedThemes([]);
    setSelectedRegion(null);
    setSelectedAgency(null);
    setSelectedCountry(null);
    setHoveredCountry(null);
    setHoveredGrantId(null);
  }

  const regionFilter = <div className="open-grants-filter-group open-grants-region-filter">
    <span className="open-grants-filter-label">Region</span>
    <div className="open-grants-region-slider" role="radiogroup" aria-label="Filter by region">
      <button type="button" role="radio" className={`open-grants-all-regions ${selectedRegion ? "" : "is-active"}`} aria-label={`${t("All regions")}: ${thematicMatches.length}`} aria-checked={!selectedRegion} onClick={() => toggleRegion(null)}>
        <span className="open-grants-region-title"><b className="open-grants-region-swatch open-grants-region-swatch--all" aria-hidden="true">{thematicMatches.length}</b><span>{t("All regions")}</span></span>
      </button>
      {GRANT_MAP_REGIONS.map((region) => {
        const active = selectedRegion === region.key;
        const count = regionGrantCounts.get(region.key) ?? 0;
        return <button key={region.key} type="button" role="radio" aria-label={`${t(region.label)}: ${count}`} aria-checked={active} className={active ? "is-active" : ""} disabled={!active && count === 0} onClick={() => toggleRegion(active ? null : region.key)} style={{ "--region-light": region.light, "--region-dark": region.dark } as CSSProperties}>
          <span className="open-grants-region-title"><b className="open-grants-region-swatch" aria-hidden="true">{count}</b><span>{t(region.label)}</span></span>
        </button>;
      })}
    </div>
  </div>;

  const themeFilter = <div className="open-grants-filter-group open-grants-theme-filter">
    <span className="open-grants-filter-label">Theme</span>
    <div className={`grant-theme-wheel ${selectedThemes.length ? "has-selection" : ""}`} role="group" aria-label="Filter by environmental theme">
      {OPEN_GRANT_THEMES.map((theme, index) => {
        const Icon = THEME_ICONS[theme];
        const active = selectedThemes.includes(theme);
        const count = themeCounts.get(theme) ?? 0;
        const visibleLabel = active || previewedTheme === theme;
        return <div key={theme}>
          <button
            type="button"
            className={`grant-theme-wheel__item grant-theme-wheel__item--${index} ${active ? "is-active" : ""}`}
            aria-label={`${t(theme)}: ${count}`}
            aria-pressed={active}
            disabled={!active && count === 0}
            onClick={() => toggleTheme(theme)}
            onMouseEnter={() => setPreviewedTheme(theme)}
            onMouseLeave={() => setPreviewedTheme(null)}
            onFocus={() => setPreviewedTheme(theme)}
            onBlur={() => setPreviewedTheme(null)}
            style={{ "--theme-accent": focalAreaColor(theme) } as CSSProperties}
          >
            <span className="grant-theme-wheel__icon"><Icon size={18} strokeWidth={2.25} aria-hidden="true" /></span>
          </button>
          <span
            className={`grant-theme-wheel__slice-label grant-theme-wheel__slice-label--${index} ${visibleLabel ? "is-visible" : ""} ${active ? "is-pinned" : ""}`}
            aria-hidden="true"
            style={{ "--theme-accent": focalAreaColor(theme) } as CSSProperties}
          >
            <strong>{t(theme)}</strong><b>{count}</b>
          </span>
        </div>;
      })}
      <button
        type="button"
        className={`grant-theme-wheel__hub ${selectedThemes.length ? "" : "is-active"}`}
        aria-label={`${t("All themes")}: ${themeCountSource.length}`}
        aria-pressed={!selectedThemes.length}
        onClick={() => { setSelectedThemes([]); setSelectedCountry(null); }}
        onMouseEnter={() => setPreviewedTheme("all")}
        onMouseLeave={() => setPreviewedTheme(null)}
        onFocus={() => setPreviewedTheme("all")}
        onBlur={() => setPreviewedTheme(null)}
      >
        <Layers3 size={22} strokeWidth={2.1} aria-hidden="true" /><span className="sr-only">{t("All themes")}</span>
      </button>
      <span
        className={`grant-theme-wheel__hub-tooltip ${previewedTheme === "all" ? "is-visible" : ""}`}
        aria-hidden="true"
      >
        <strong>{t("All themes")}</strong><b>{themeCountSource.length}</b>
      </span>
    </div>
  </div>;

  const grantFilters = <div className="open-grants-toolbar" aria-label="Grant filters">
    <div className="open-grants-search-row">
      <div className="open-grants-search" role="search">
        <Search className="open-grants-search-icon" size={15} aria-hidden="true" />
        {(selectedThemes.length > 0 || selectedRegionMeta || selectedAgency || selectedCountryName) && <div className="open-grants-search-filter-cards">
          {selectedThemes.length > 0 && <button
            type="button"
            className="open-grants-search-filter-card open-grants-search-filter-card--theme"
            onClick={() => { setSelectedThemes([]); setSelectedCountry(null); }}
            aria-label={`${t("Remove")}: ${selectedThemes.map((theme) => t(theme)).join(", ")}`}
            title={selectedThemes.map((theme) => t(theme)).join(", ")}
            style={{ "--filter-card-accent": focalAreaColor(selectedThemes[0]) } as CSSProperties}
          >
            <i aria-hidden="true" /><span>{t("Theme")}</span><strong>{t(selectedThemes[0])}{selectedThemes.length > 1 ? ` +${selectedThemes.length - 1}` : ""}</strong><X size={11} aria-hidden="true" />
          </button>}
          {selectedRegionMeta && <button
            type="button"
            className="open-grants-search-filter-card"
            onClick={() => toggleRegion(null)}
            aria-label={`${t("Remove")}: ${t(selectedRegionMeta.label)}`}
            style={{ "--filter-card-accent": selectedRegionMeta.dark } as CSSProperties}
          >
            <i aria-hidden="true" /><span>{t("Region")}</span><strong>{t(selectedRegionMeta.label)}</strong><X size={11} aria-hidden="true" />
          </button>}
          {selectedAgency && <button
            type="button"
            className="open-grants-search-filter-card"
            onClick={() => toggleAgency(null)}
            aria-label={`${t("Remove")}: ${selectedAgency}`}
            style={{ "--filter-card-accent": selectedAgency === "FAO" ? "#16865b" : selectedAgency === "CI" ? "#007f70" : "#006eb5" } as CSSProperties}
          >
            <i aria-hidden="true" /><span>{t("Agency")}</span><strong>{selectedAgency}</strong><X size={11} aria-hidden="true" />
          </button>}
          {selectedCountryName && <button
            type="button"
            className="open-grants-search-filter-card"
            onClick={() => setSelectedCountry(null)}
            aria-label={`${t("Remove")}: ${selectedCountryName}`}
            style={{ "--filter-card-accent": "#2f855a" } as CSSProperties}
          >
            <i aria-hidden="true" /><span>{t("Country:")}</span><strong>{selectedCountryName}</strong><X size={11} aria-hidden="true" />
          </button>}
        </div>}
        <input aria-label="Search open grants" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedCountry(null); }} placeholder="Search grants by country, theme or applicant" />
        {query && <button className="open-grants-search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
      </div>
      <button type="button" className="open-grants-clear" onClick={clearFilters} disabled={!hasActiveFilters} aria-label="Clear all grant filters">
        <X size={13} aria-hidden="true" />Clear all
      </button>
    </div>
    <div className="open-grants-filter-layout">
      <div className="open-grants-filter-stack">
        <div className="open-grants-filter-group open-grants-agency-filter">
          <span className="open-grants-filter-label">Agency</span>
          <div className="open-grants-agency-selector" role="group" aria-label="Filter by managing agency">
            <button type="button" className={`open-grants-agency-all ${selectedAgency ? "" : "is-active"}`} aria-pressed={!selectedAgency} onClick={() => toggleAgency(null)}>
              <span>{t("All Agencies")}</span><b>{agencyCountSource.length}</b>
            </button>
            {OPEN_GRANT_AGENCIES.map((agency) => {
              const active = selectedAgency === agency;
              const count = agencyCounts.get(agency) ?? 0;
              return <button key={agency} type="button" className={active ? "is-active" : ""} aria-pressed={active} disabled={!active && count === 0} onClick={() => toggleAgency(active ? null : agency)}>
                <AgencyMark agency={agency} /><span>{agency}</span><b>{count}</b>
              </button>;
            })}
          </div>
        </div>
        {regionFilter}
      </div>
      {themeFilter}
    </div>
  </div>;

  return <>
    <main className="content-width open-grants-layout">
      <section ref={explorerRef} className="open-grants-explorer" aria-label="Grant map and filters">
        {loadError ? <>{grantFilters}<div className="open-grants-map-error"><MapPin /><strong>Map unavailable</strong><p>{loadError}</p></div></> : geo ? <OpenGrantsMapBoundary fallback={(retry) => <>{grantFilters}<div className="open-grants-map-error" role="alert"><MapPin /><strong>Map temporarily unavailable</strong><p>The grant list is still available. Reload the map to try again.</p><button type="button" onClick={retry}>Reload map</button></div></>}><OpenGrantsMap geo={geo} grants={regionalMatches} historicalCountries={historicalCountries} historicalLoading={historicalLoading} historicalError={historicalError} filters={grantFilters} selectedRegion={selectedRegion} fitToMatchingGrants={Boolean(terms || selectedThemes.length || selectedAgency)} selectedCountry={selectedCountry} hoveredCountry={effectiveHoveredCountry} onCountrySelect={setSelectedCountry} onCountryHover={setHoveredCountry} /></OpenGrantsMapBoundary> : <>{grantFilters}<div className="open-grants-map-loading"><span /><strong>Loading grant map</strong></div></>}
      </section>
      <section
        className={`open-grants-results ${resultsLayout.sticky ? "is-sticky" : ""}`}
        style={resultsLayout.height ? { "--open-grants-results-height": `${resultsLayout.height}px` } as CSSProperties : undefined}
        aria-labelledby="open-grants-results-title"
      >
        <header>
          <div><span>{hasActiveFilters ? "Filtered results" : "Open now"}</span><h2 id="open-grants-results-title">{resultContext || "Open opportunities"}</h2></div>
          <div className="open-grants-sort" role="group" aria-label={t("Sort opportunities")}>
            <button type="button" className={grantSort === "closing" ? "is-active" : ""} aria-pressed={grantSort === "closing"} title={t("Sort by closing date")} onClick={() => setGrantSort("closing")}>
              <CalendarClock size={16} aria-hidden="true" /><span className="sr-only">{t("Sort by closing date")}</span>
            </button>
            <button type="button" className={grantSort === "alphabetical" ? "is-active" : ""} aria-pressed={grantSort === "alphabetical"} title={t("Sort alphabetically")} onClick={() => setGrantSort("alphabetical")}>
              <ArrowDownAZ size={16} aria-hidden="true" /><span className="sr-only">{t("Sort alphabetically")}</span>
            </button>
          </div>
        </header>
        <div className="open-grants-list">{sortedVisibleGrants.length ? sortedVisibleGrants.map((grant) => <GrantCard key={grant.id} grant={grant} active={hoveredGrantId === grant.id || hoveredCountry === grant.countryIso3} onHover={(active) => setHoveredGrantId(active ? grant.id : null)} onOpen={() => setSelectedGrant(grant)} />) : <div className="open-grants-empty"><Search /><strong>No grants match these filters</strong><p>Try another region, theme or search term.</p><button type="button" onClick={clearFilters}>Show all opportunities</button></div>}</div>
      </section>
    </main>
      {selectedGrant && <GrantDetailPanel grant={selectedGrant} role={role} onClose={() => setSelectedGrant(null)} />}
  </>;
}
