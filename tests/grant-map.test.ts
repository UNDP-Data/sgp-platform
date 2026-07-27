import { describe, expect, it } from "vitest";
import { buildHistoricalCountryStats, eastWrapPacificLongitude, grantMapRegion, PACIFIC_EAST_WRAP_ISO3 } from "../src/lib/grants/historicalMap";
import { parseScaleTranslateMatrix } from "../src/lib/grants/mapTransform";
import type { ProjectRecord } from "../src/lib/data/schema";

function project(overrides: Partial<ProjectRecord>): ProjectRecord {
  return {
    rowId: "row-1",
    sourceRowNumber: 1,
    projectNumber: "SGP-1",
    projectNumberNormalized: "SGP-1",
    duplicateProjectNumber: false,
    duplicateGroupSize: 1,
    operationalPhaseText: null,
    operationalPhaseNumber: null,
    operationalPhaseYear: null,
    fullGrant: false,
    projectCategory: null,
    projectTitle: "Project",
    regionId: "RBA",
    countryName: "Kenya",
    countryNameNormalized: "kenya",
    countryIso3: "KEN",
    countryMapStatus: "matched",
    institutionalType: null,
    granteeName: null,
    focalArea: null,
    status: "Completed",
    statusGroup: "completed",
    startMonth: null,
    startYear: 2020,
    startDate: null,
    endDate: null,
    nscApprovalDate: null,
    moaSignedDate: null,
    durationMonths: null,
    fundingSource: null,
    grantAmount: 0,
    cofinancingCash: 0,
    cofinancingKind: 0,
    cofinancingTotal: 0,
    totalInvestment: 0,
    cofinancingLeverage: null,
    cashShareOfCofinancing: null,
    inKindShareOfCofinancing: null,
    cofinancingRowCount: 0,
    cofinancingPartnerCount: 0,
    hasDetailedCofinancing: false,
    ...overrides
  };
}

describe("grant map historical coverage", () => {
  it("counts unique projects by country instead of duplicate records", () => {
    const result = buildHistoricalCountryStats([
      project({ rowId: "row-1" }),
      project({ rowId: "row-2" }),
      project({ rowId: "row-3", projectNumber: "SGP-2", projectNumberNormalized: "SGP-2" })
    ]);

    expect(result.get("KEN")).toMatchObject({
      countryName: "Kenya",
      regionId: "RBA",
      projectCount: 2
    });
  });

  it("ignores records without mapped country geometry", () => {
    const result = buildHistoricalCountryStats([
      project({ countryIso3: null, countryMapStatus: "unmapped" })
    ]);

    expect(result.size).toBe(0);
  });

  it("provides stable regional hues and a safe fallback", () => {
    expect(grantMapRegion("RBAP").label).toBe("Asia & Pacific");
    expect(grantMapRegion("unexpected").label).toBe("Other programme area");
  });

  it("keeps dateline Pacific countries together on the eastern side", () => {
    expect([...PACIFIC_EAST_WRAP_ISO3]).toEqual(expect.arrayContaining(["FJI", "KIR", "TON", "WSM"]));
    expect(eastWrapPacificLongitude("TON", -175)).toBe(185);
    expect(eastWrapPacificLongitude("KIR", -155)).toBe(205);
    expect(eastWrapPacificLongitude("KEN", -5)).toBe(-5);
    expect(eastWrapPacificLongitude("FJI", 178)).toBe(178);
  });

  it("parses browser SVG matrix serialization without DOMMatrix", () => {
    expect(parseScaleTranslateMatrix("matrix(0.15138 0 0 0.15138 438.891 246.674)")).toEqual({
      scale: .15138,
      translate: [438.891, 246.674]
    });
    expect(parseScaleTranslateMatrix("matrix(0.5, 0, 0, 0.5, 10, 20)")).toEqual({
      scale: .5,
      translate: [10, 20]
    });
    expect(parseScaleTranslateMatrix("translate(10 20) scale(.5)")).toBeNull();
    expect(parseScaleTranslateMatrix("matrix(not-a-number)")).toBeNull();
  });
});
