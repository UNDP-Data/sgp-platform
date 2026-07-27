export const OPEN_GRANT_THEMES = [
  "Biodiversity",
  "Climate Change",
  "Land Degradation",
  "Multifocal Area",
  "Capacity Development",
  "International Waters",
  "Chemicals and Waste",
  "Climate Change Adaptation"
] as const;

export type OpenGrantTheme = (typeof OPEN_GRANT_THEMES)[number];

export type OpenGrant = {
  id: string;
  title: string;
  summary: string;
  countryIso3: string;
  countryName: string;
  location: string;
  region: string;
  themes: OpenGrantTheme[];
  managingAgency: "UNDP" | "FAO" | "CI";
  agencyLabel: string;
  fundingMin: number;
  fundingMax: number;
  currency: "USD";
  opensAt: string;
  deadline: string;
  durationMonths: string;
  applicantTypes: string[];
  eligibility: string;
  priorities: string[];
  expectedOutputs: string[];
  imageUrl: string;
  imageAlt: string;
  photoSourceUrl: string;
  referenceProject: string;
  prototype: true;
};

export function openGrantHref(grantId: string) {
  return `/funding/grants/${encodeURIComponent(grantId)}`;
}

export const OPEN_GRANTS: OpenGrant[] = [
  {
    id: "test-kenya-biodiversity-2026",
    title: "Community biodiversity corridors and local stewardship",
    summary: "Support for locally governed habitat corridors, restoration agreements and community biodiversity monitoring around priority landscapes.",
    countryIso3: "KEN",
    countryName: "Kenya",
    location: "Mount Kenya landscape",
    region: "Africa",
    themes: ["Biodiversity", "Climate Change Adaptation"],
    managingAgency: "UNDP",
    agencyLabel: "United Nations Development Programme",
    fundingMin: 30000,
    fundingMax: 75000,
    currency: "USD",
    opensAt: "2026-07-15",
    deadline: "2026-09-18",
    durationMonths: "18-24 months",
    applicantTypes: ["Community-based organizations", "Local conservation NGOs", "Indigenous Peoples' organizations"],
    eligibility: "Applicants must be locally registered, demonstrate community governance, and work within or alongside a recognized biodiversity corridor in Kenya.",
    priorities: ["Habitat connectivity", "Community conservation agreements", "Participatory biodiversity monitoring"],
    expectedOutputs: ["A locally endorsed corridor action plan", "Restoration or stewardship activity across connected habitat", "Community-owned monitoring records"],
    imageUrl: "/media/grants/kenya.jpg",
    imageAlt: "Community territorial governance workshop in Kenya",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/485-working-towards-a-critical-mass-for-social-justice-in-community-territorial-governance-in-kenya.html",
    referenceProject: "Mt. Kenya Biodiversity Conservation & Climate Change mitigation project",
    prototype: true
  },
  {
    id: "test-jamaica-adaptation-2026",
    title: "Climate-resilient fisheries and youth livelihoods",
    summary: "Small grants for coastal organizations combining sustainable fisheries, youth enterprise and practical climate adaptation.",
    countryIso3: "JAM",
    countryName: "Jamaica",
    location: "North and south coast communities",
    region: "Latin America and the Caribbean",
    themes: ["Climate Change Adaptation", "International Waters"],
    managingAgency: "UNDP",
    agencyLabel: "United Nations Development Programme",
    fundingMin: 25000,
    fundingMax: 100000,
    currency: "USD",
    opensAt: "2026-07-20",
    deadline: "2026-10-02",
    durationMonths: "12-24 months",
    applicantTypes: ["Fishers' associations", "Youth-led organizations", "Community-based organizations"],
    eligibility: "Eligible organizations must operate in a Jamaican coastal community and show how proposed livelihood activities reduce climate or fisheries pressure.",
    priorities: ["Climate-smart fisheries", "Youth leadership", "Coastal livelihood diversification"],
    expectedOutputs: ["A community fisheries or adaptation plan", "Youth training and enterprise pilots", "Documented ecological and livelihood indicators"],
    imageUrl: "/media/grants/jamaica.jpg",
    imageAlt: "Coastal waters at Oracabessa, Jamaica",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/807-community-led-fisheries-projects-drive-marine-resilience-in-jamaica.html",
    referenceProject: "Increasing Climate Resilience Among Youth Farmers and Fisherfolks through Sustainable Practices and Technology",
    prototype: true
  },
  {
    id: "test-kna-land-2026",
    title: "Coastal land restoration and erosion control",
    summary: "Funding for community-led restoration of degraded coastal land using native vegetation, watershed measures and public stewardship.",
    countryIso3: "KNA",
    countryName: "Saint Kitts and Nevis",
    location: "Coastal settlements and watersheds",
    region: "Latin America and the Caribbean",
    themes: ["Land Degradation", "Climate Change Adaptation"],
    managingAgency: "UNDP",
    agencyLabel: "United Nations Development Programme",
    fundingMin: 20000,
    fundingMax: 70000,
    currency: "USD",
    opensAt: "2026-08-01",
    deadline: "2026-10-16",
    durationMonths: "12-18 months",
    applicantTypes: ["Community groups", "Local environmental NGOs", "Producer associations"],
    eligibility: "Proposals must identify a degraded coastal or watershed site and include written support from affected community stakeholders.",
    priorities: ["Native vegetation restoration", "Erosion reduction", "Community stewardship"],
    expectedOutputs: ["Site restoration design and baseline", "Implemented erosion-control measures", "Local maintenance agreement"],
    imageUrl: "/media/grants/saint-kitts-nevis.jpg",
    imageAlt: "Coastal landscape in Saint Kitts and Nevis",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/787-strengthening-ocean-conservation-and-sustainable-development-in-st-kitts-nevis.html",
    referenceProject: "Combating Land Degradation on the Historic New River and Coconut Walk Coastline",
    prototype: true
  },
  {
    id: "test-botswana-multifocal-2026",
    title: "Community watershed restoration and resilient livelihoods",
    summary: "Integrated support for watershed restoration, sustainable natural-resource use and women-led livelihood activities.",
    countryIso3: "BWA",
    countryName: "Botswana",
    location: "Eastern and southern community watersheds",
    region: "Africa",
    themes: ["Multifocal Area", "Land Degradation"],
    managingAgency: "UNDP",
    agencyLabel: "United Nations Development Programme",
    fundingMin: 25000,
    fundingMax: 60000,
    currency: "USD",
    opensAt: "2026-07-28",
    deadline: "2026-09-30",
    durationMonths: "18-24 months",
    applicantTypes: ["Women's organizations", "Community trusts", "Local development NGOs"],
    eligibility: "Applicants must demonstrate community decision-making authority and connect restoration activities to durable local livelihood benefits.",
    priorities: ["Watershed restoration", "Sustainable resource use", "Women-led livelihoods"],
    expectedOutputs: ["Participatory watershed plan", "Restoration and soil-management actions", "A tested community livelihood model"],
    imageUrl: "/media/grants/botswana.jpg",
    imageAlt: "Community knowledge fair site visit in Botswana",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/322-gef-sgp-botswana-celebrating-the-past-by-learning-for-a-sustainable-future.html",
    referenceProject: "Interactive Capacity Development for Restoration, Management and Use of Natural Resources in Gamolele - Gakgatla Watershed",
    prototype: true
  },
  {
    id: "test-palau-capacity-2026",
    title: "Civil society capacity for island resource governance",
    summary: "Organizational and technical capacity grants for Palauan civil society working on conservation, data stewardship and community resource governance.",
    countryIso3: "PLW",
    countryName: "Palau",
    location: "Nationwide",
    region: "Asia and the Pacific",
    themes: ["Capacity Development", "Biodiversity"],
    managingAgency: "CI",
    agencyLabel: "Conservation International",
    fundingMin: 15000,
    fundingMax: 80000,
    currency: "USD",
    opensAt: "2026-07-10",
    deadline: "2026-09-12",
    durationMonths: "9-18 months",
    applicantTypes: ["Palauan civil society organizations", "Community conservation networks", "Youth organizations"],
    eligibility: "Applicants must be based in Palau and pair organizational strengthening with a defined conservation or resource-governance outcome.",
    priorities: ["Organizational systems", "Community data stewardship", "Inclusive conservation leadership"],
    expectedOutputs: ["Capacity baseline and improvement plan", "Operational or data-governance tools", "Applied learning through a community initiative"],
    imageUrl: "/media/grants/palau.jpg",
    imageAlt: "Tobi Island in Palau",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/357-gef-sgp-and-un-sids-building-genuine-and-durable-partnerships.html",
    referenceProject: "Building Civil Society Capacity for Sustainable Resource Management and Conservation in Palau",
    prototype: true
  },
  {
    id: "test-cuba-waters-2026",
    title: "Wetland and coral-reef community action",
    summary: "Grants for coastal communities restoring wetlands, reducing land-to-sea pressures and monitoring coral-reef health.",
    countryIso3: "CUB",
    countryName: "Cuba",
    location: "Priority coastal and wetland landscapes",
    region: "Latin America and the Caribbean",
    themes: ["International Waters", "Biodiversity"],
    managingAgency: "UNDP",
    agencyLabel: "United Nations Development Programme",
    fundingMin: 40000,
    fundingMax: 120000,
    currency: "USD",
    opensAt: "2026-08-03",
    deadline: "2026-10-23",
    durationMonths: "18-30 months",
    applicantTypes: ["Community organizations", "Local scientific associations", "Coastal producer groups"],
    eligibility: "Projects must connect a community action area to a named wetland, seagrass or coral-reef system and include measurable ecosystem indicators.",
    priorities: ["Wetland restoration", "Land-to-sea pollution reduction", "Community reef monitoring"],
    expectedOutputs: ["Ecosystem baseline and monitoring protocol", "Implemented restoration or pressure-reduction actions", "Community learning products"],
    imageUrl: "/media/grants/cuba.jpg",
    imageAlt: "Community environmental work in Cuba",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/201-one-year-with-sgp-cuba.html",
    referenceProject: "Community actions improving wetland health and benefiting coral reefs in the Zapata Peninsula",
    prototype: true
  },
  {
    id: "test-china-chemicals-2026",
    title: "Community solutions for plastics and safer materials",
    summary: "Pilot funding for local organizations reducing plastic leakage and testing safer, circular material systems across the value chain.",
    countryIso3: "CHN",
    countryName: "China",
    location: "Selected urban and coastal communities",
    region: "Asia and the Pacific",
    themes: ["Chemicals and Waste", "Climate Change"],
    managingAgency: "UNDP",
    agencyLabel: "United Nations Development Programme",
    fundingMin: 35000,
    fundingMax: 150000,
    currency: "USD",
    opensAt: "2026-07-25",
    deadline: "2026-10-09",
    durationMonths: "18-24 months",
    applicantTypes: ["Environmental NGOs", "Community social enterprises", "Consumer or worker associations"],
    eligibility: "Applicants must identify a specific plastics or hazardous-material flow and include partners able to test collection, substitution or circular-use measures.",
    priorities: ["Plastic leakage prevention", "Safer material substitution", "Community circular-economy models"],
    expectedOutputs: ["Value-chain baseline", "A tested prevention or circular-use model", "Evidence for replication by local partners"],
    imageUrl: "/media/grants/china.jpg",
    imageAlt: "SGP programme activity in China",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/613-covid-19-updates.html",
    referenceProject: "Project of Plastic Pollution Prevention and Control Through the Entire Value Chain Modality",
    prototype: true
  },
  {
    id: "test-turkiye-climate-2026",
    title: "Circular rural enterprise and low-carbon production",
    summary: "Support for community enterprises combining waste prevention, efficient production and climate-smart rural value chains.",
    countryIso3: "TUR",
    countryName: "Türkiye",
    location: "Rural and peri-urban communities",
    region: "Europe and Central Asia",
    themes: ["Climate Change", "Chemicals and Waste"],
    managingAgency: "UNDP",
    agencyLabel: "United Nations Development Programme",
    fundingMin: 20000,
    fundingMax: 90000,
    currency: "USD",
    opensAt: "2026-08-05",
    deadline: "2026-10-30",
    durationMonths: "12-24 months",
    applicantTypes: ["Cooperatives", "Local NGOs", "Community social enterprises"],
    eligibility: "Applicants must operate in Türkiye and demonstrate a locally owned production or service model with measurable waste and emissions benefits.",
    priorities: ["Low-carbon production", "Waste prevention", "Rural cooperative enterprise"],
    expectedOutputs: ["Production and emissions baseline", "Operational circular-enterprise pilot", "Documented business and environmental results"],
    imageUrl: "/media/grants/turkiye.jpg",
    imageAlt: "Landscape connected to community conservation in Türkiye",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/262-the-gef-sgp-helps-establish-turkey-s-first-wildlife-corridor.html",
    referenceProject: "Representative Türkiye community environment and rural livelihood projects",
    prototype: true
  },
  {
    id: "test-fiji-islands-2026",
    title: "Renewable energy for resilient island communities",
    summary: "Community-scale renewable energy and adaptation grants for remote island services, livelihoods and locally managed infrastructure.",
    countryIso3: "FJI",
    countryName: "Fiji",
    location: "Outer-island communities",
    region: "Asia and the Pacific",
    themes: ["Climate Change", "Multifocal Area"],
    managingAgency: "FAO",
    agencyLabel: "Food and Agriculture Organization",
    fundingMin: 30000,
    fundingMax: 110000,
    currency: "USD",
    opensAt: "2026-07-30",
    deadline: "2026-10-12",
    durationMonths: "18-24 months",
    applicantTypes: ["Island community organizations", "Producer cooperatives", "Local NGOs"],
    eligibility: "Proposals must be community-led, identify an outer-island service or livelihood need, and include arrangements for long-term equipment stewardship.",
    priorities: ["Community renewable energy", "Resilient food and water services", "Locally managed infrastructure"],
    expectedOutputs: ["Participatory energy and resilience plan", "Installed or demonstrated renewable-energy solution", "Local maintenance and governance system"],
    imageUrl: "/media/grants/fiji.jpg",
    imageAlt: "Mountain landscape in Fiji",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/669-glispa-partners-with-the-gef-small-grants-programme-to-launch-global-island-bright-spots-programme.html",
    referenceProject: "Representative Fiji renewable-energy and island-resilience initiatives",
    prototype: true
  },
  {
    id: "test-nepal-energy-2026",
    title: "Clean energy enterprises for forest-edge communities",
    summary: "Seed grants for community enterprises using clean energy to improve livelihoods while reducing pressure on nearby forests.",
    countryIso3: "NPL",
    countryName: "Nepal",
    location: "Mid-hill and forest-edge communities",
    region: "Asia and the Pacific",
    themes: ["Climate Change", "Capacity Development"],
    managingAgency: "FAO",
    agencyLabel: "Food and Agriculture Organization",
    fundingMin: 15000,
    fundingMax: 65000,
    currency: "USD",
    opensAt: "2026-08-10",
    deadline: "2026-11-06",
    durationMonths: "12-18 months",
    applicantTypes: ["Forest user groups", "Producer cooperatives", "Women- or youth-led enterprises"],
    eligibility: "Applicants must link a viable community enterprise to reduced fuelwood use, improved energy efficiency or renewable productive use.",
    priorities: ["Productive-use renewable energy", "Forest pressure reduction", "Inclusive community enterprise"],
    expectedOutputs: ["Enterprise and energy-use baseline", "Operational clean-energy livelihood pilot", "Skills transfer and replication plan"],
    imageUrl: "/media/grants/nepal.jpg",
    imageAlt: "Solar-powered livelihood activity in Nepal",
    photoSourceUrl: "https://sgp.undp.org/resources-155/our-stories/611-mushrooms-are-magic-solar-powered-mushroom-farming-in-nepal-improves-livelihoods-and-nutrition,-and-reduces-deforestation.html",
    referenceProject: "Mushrooms are Magic: solar-powered mushroom farming in Nepal",
    prototype: true
  }
];

export function openGrantById(grantId: string) {
  return OPEN_GRANTS.find((grant) => grant.id === grantId);
}
