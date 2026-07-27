import type { ProjectRecord } from "../data/schema";

export type GrantMapRegion = {
  key: string;
  label: string;
  light: string;
  dark: string;
};

export type HistoricalCountryStat = {
  iso3: string;
  countryName: string;
  regionId: string;
  projectCount: number;
};

export const GRANT_MAP_REGIONS: GrantMapRegion[] = [
  { key: "RBA", label: "Africa", light: "#cce9d9", dark: "#176b50" },
  { key: "RBAP", label: "Asia & Pacific", light: "#c9e2f4", dark: "#17689f" },
  { key: "RBAS", label: "Arab States", light: "#f4dfad", dark: "#a96513" },
  { key: "RBEC", label: "Europe & CIS", light: "#ddd8f3", dark: "#6653ad" },
  { key: "RBLAC", label: "Latin America", light: "#f3cedd", dark: "#ae326a" }
];

export const PACIFIC_EAST_WRAP_ISO3 = new Set(["COK", "FJI", "KIR", "NIU", "TKL", "TON", "WSM"]);

export function eastWrapPacificLongitude(iso3: string, longitude: number) {
  return PACIFIC_EAST_WRAP_ISO3.has(iso3) && longitude < 0 ? longitude + 360 : longitude;
}

const UNKNOWN_REGION: GrantMapRegion = {
  key: "unknown",
  label: "Other programme area",
  light: "#d9e1e4",
  dark: "#5b7079"
};

export function grantMapRegion(regionId: string | null | undefined) {
  return GRANT_MAP_REGIONS.find((region) => region.key === regionId) ?? UNKNOWN_REGION;
}

export function buildHistoricalCountryStats(projects: ProjectRecord[]) {
  const countries = new Map<string, {
    countryName: string;
    regionId: string;
    projectIds: Set<string>;
  }>();

  for (const project of projects) {
    const iso3 = project.countryIso3?.trim().toUpperCase();
    if (!iso3) continue;
    const current = countries.get(iso3) ?? {
      countryName: project.countryName || iso3,
      regionId: project.regionId,
      projectIds: new Set<string>()
    };
    current.projectIds.add(project.projectNumberNormalized || project.projectNumber || project.rowId);
    countries.set(iso3, current);
  }

  return new Map<string, HistoricalCountryStat>(
    [...countries.entries()].map(([iso3, country]) => [iso3, {
      iso3,
      countryName: country.countryName,
      regionId: country.regionId,
      projectCount: country.projectIds.size
    }])
  );
}
