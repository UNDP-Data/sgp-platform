import { computeProjectMetrics } from "../aggregation/metrics";
import { COUNTRY_GROUP_OPTIONS, countryGroupContains } from "../data/countryGroups";
import type { AggregateRow, CofinancingRecord, ProjectRecord } from "../data/schema";
import type { DashboardFilters } from "../filters/filterTypes";
import { filtersToSearch } from "../filters/urlState";

export function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

export function isDefaultFilters(filters: DashboardFilters) {
  return filtersToSearch(filters) === "";
}

export function hasVisibleFocalArea(value: string | null | undefined): value is string {
  const normalized = (value ?? "").trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  return compact.length > 0 && !["missing", "na", "null", "undefined"].includes(compact);
}

export function visibleFocalRows(rows: AggregateRow[]) {
  return rows.filter((row) => hasVisibleFocalArea(row.label) && hasVisibleFocalArea(row.key));
}

export function isSingleValueSelection(values: string[], value: string) {
  return values.length === 1 && values[0] === value;
}

export function topValues<T>(items: T[], getter: (item: T) => string | null | undefined, limit = 40) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = getter(item) || "Missing";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export function projectYearDomain(projects: ProjectRecord[]): [number, number] {
  const years = projects
    .map((project) => project.startYear)
    .filter((year): year is number => Number.isFinite(year));
  if (!years.length) return [1992, 2026];
  return [Math.min(...years), Math.max(...years)];
}

export function metricRowFromProjects(
  key: string,
  label: string,
  projects: ProjectRecord[],
  cofinancing: CofinancingRecord[]
): AggregateRow {
  const metrics = computeProjectMetrics(projects, cofinancing, { includeMedianGrant: false });
  const cofinancingTotal = metrics.cofinancingTotal ?? 0;
  return {
    key,
    label,
    projectRecords: metrics.projectRecords ?? 0,
    uniqueProjectNumbers: metrics.uniqueProjectNumbers ?? 0,
    countries: metrics.countries ?? 0,
    grantAmount: metrics.grantAmount ?? 0,
    cofinancingCash: metrics.cofinancingCash ?? 0,
    cofinancingKind: metrics.cofinancingKind ?? 0,
    cofinancingTotal,
    totalInvestment: metrics.totalInvestment ?? 0,
    averageGrant: metrics.averageGrant,
    medianGrant: metrics.medianGrant,
    cofinancingLeverage: metrics.cofinancingLeverage,
    activeProjects: metrics.activeProjects ?? 0,
    completedProjects: metrics.completedProjects ?? 0,
    terminatedProjects: metrics.terminatedProjects ?? 0,
    cofinancingRows: metrics.cofinancingRows ?? 0,
    cofinancingPartnerCount: metrics.cofinancingPartnerCount ?? 0,
    cashShareOfCofinancing: cofinancingTotal > 0 ? (metrics.cofinancingCash ?? 0) / cofinancingTotal : null,
    inKindShareOfCofinancing: cofinancingTotal > 0 ? (metrics.cofinancingKind ?? 0) / cofinancingTotal : null
  };
}

export function buildCountryGroupRows(projects: ProjectRecord[], cofinancing: CofinancingRecord[]) {
  const projectsByGroup = new Map<string, ProjectRecord[]>();
  const cofinancingByGroup = new Map<string, CofinancingRecord[]>();
  const groupsByProjectNumber = new Map<string, Set<string>>();

  for (const option of COUNTRY_GROUP_OPTIONS) {
    projectsByGroup.set(option.key, []);
    cofinancingByGroup.set(option.key, []);
  }

  for (const project of projects) {
    for (const option of COUNTRY_GROUP_OPTIONS) {
      if (!countryGroupContains(option.key, project.countryIso3)) continue;
      projectsByGroup.get(option.key)?.push(project);
      const groups = groupsByProjectNumber.get(project.projectNumberNormalized) ?? new Set<string>();
      groups.add(option.key);
      groupsByProjectNumber.set(project.projectNumberNormalized, groups);
    }
  }

  for (const row of cofinancing) {
    const groups = groupsByProjectNumber.get(row.projectNumberNormalized);
    if (!groups) continue;
    for (const group of groups) cofinancingByGroup.get(group)?.push(row);
  }

  return COUNTRY_GROUP_OPTIONS
    .map((option) => metricRowFromProjects(
      option.key,
      option.label,
      projectsByGroup.get(option.key) ?? [],
      cofinancingByGroup.get(option.key) ?? []
    ))
    .filter((row) => row.projectRecords > 0);
}
