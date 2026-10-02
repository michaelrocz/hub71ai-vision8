export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface PoiMarker {
  latitude: number;
  longitude: number;
  type: 'hospital' | 'bus' | 'shop' | 'home' | 'business' | 'bank' | 'school';
  name: string;
  source?: string;
  isReal?: boolean;
}

export interface RouteDetails {
  distanceKm: number;
  durationMins: number;
  outdoorWalkMins: number;
  coordinates: RouteCoordinate[];
  source: string;
  isLive: boolean;
  walkLegIsLive?: boolean;
  routeType: 'foot' | 'ac_transit';
}

export interface InvestmentExamples {
  entityType: 'ADGM' | 'Mainland' | 'Masdar Freezone' | 'Hub71';
  corporateTaxRate: string;
  corporateTaxLegalRef: string;
  foreignOwnership: string;
  foreignOwnershipLegalRef: string;
  setupTimeline: string;
  setupPortalRef: string;
  goldenVisaEligible?: boolean;
  goldenVisaLegalRef: string;
  hub71IncentiveDetails?: string;
}

export interface SimulationResponse {
  voiceReply: string;
  mapAction?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  poiMarkers?: PoiMarker[];
  route?: RouteCoordinate[];
  routeDetails?: RouteDetails;
  distanceKm?: number;
  durationMins?: number;
  routingSource?: string;
  isLiveRouting?: boolean;
  investmentMetrics?: InvestmentExamples;
  responseSource?: 'AI coach' | 'demo scenario';
}

export interface FrictionResponse {
  counterpartReply: string;
  personaType: 'landlord' | 'adgm_officer' | 'bank_manager';
  confidenceScore: number;
  missingQuestions: string[];
  warnings: string[];
  tips: string[];
  mapAction?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  responseSource?: 'AI coach' | 'demo scenario';
}

// --- Seed map points attributed to OpenStreetMap or named source records ---
export const ABU_DHABI_POIS: PoiMarker[] = [
  // Yas Island Residential Hub
  {
    latitude: 24.4863687,
    longitude: 54.6082376,
    type: 'hospital',
    name: 'Medeor Medical Clinic (OpenStreetMap)',
    source: 'OSM Node 3965804675 (amenity=clinic)',
    isReal: true
  },
  {
    latitude: 24.4852524,
    longitude: 54.6073360,
    type: 'bus',
    name: 'Yas Mall Bus Stop (OpenStreetMap)',
    source: 'OSM Node 3246317524 (highway=bus_stop)',
    isReal: true
  },
  {
    latitude: 24.4570513,
    longitude: 54.6155897,
    type: 'shop',
    name: 'Waitrose Market (OpenStreetMap)',
    source: 'OSM Node 3177722109 (shop=supermarket)',
    isReal: true
  },
  // Business & Investment Flagships
  {
    latitude: 24.5005,
    longitude: 54.3888,
    type: 'business',
    name: 'ADGM Financial Free Zone (Al Maryah Island)',
    source: 'Official ADGM Jurisdiction (English Common Law & ADGM Courts)',
    isReal: true
  },
  {
    latitude: 24.5012,
    longitude: 54.3895,
    type: 'bank',
    name: 'Hub71 Tech Ecosystem (Al Maryah Island)',
    source: 'Hub71 Company Incentive Programme (Subsidized Housing & Grants)',
    isReal: true
  },
  {
    latitude: 24.4285,
    longitude: 54.6186,
    type: 'business',
    name: 'Masdar City Clean-Tech Free Zone',
    source: '100% Foreign Ownership Clean Energy Hub (ADDED Registered)',
    isReal: true
  }
];

export const SIMULATION_LOCATIONS = {
  yasResidential: {
    latitude: 24.4890,
    longitude: 54.6060,
    name: 'Yas Island Residential (Building 15)',
    category: 'residential'
  },
  alMaryahBusiness: {
    latitude: 24.5005,
    longitude: 54.3888,
    name: 'ADGM Financial Square (Al Maryah Island)',
    category: 'business'
  },
  masdarTech: {
    latitude: 24.4285,
    longitude: 54.6186,
    name: 'Masdar City Innovation Zone',
    category: 'business'
  }
};

/**
 * Fetch direct walking route from Project OSRM (OpenStreetMap data)
 * Returns live vs cached fallback flag to ensure absolute provenance honesty
 */
export async function fetchOsrmWalkingRoute(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): Promise<RouteDetails> {
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP status ${res.status}`);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const r = data.routes[0];
      const distanceKm = parseFloat((r.distance / 1000).toFixed(1));
      const durationMins = Math.max(1, Math.round(r.distance / 80));
      const coordinates: RouteCoordinate[] = r.geometry.coordinates.map((pt: [number, number]) => ({
        latitude: pt[1],
        longitude: pt[0]
      }));
      return {
        distanceKm,
        durationMins,
        outdoorWalkMins: durationMins,
        coordinates,
        source: 'Live OSRM foot geometry (OpenStreetMap routing service)',
        isLive: true,
        routeType: 'foot'
      };
    }
  } catch (err) {
    console.warn("OSRM live fetch failed; reverting to illustrative cached geometry:", err);
  }

  return {
    distanceKm: 1.2,
    durationMins: 15,
    outdoorWalkMins: 15,
    coordinates: [
      { latitude: 24.4890, longitude: 54.6060 },
      { latitude: 24.4883, longitude: 54.6065 },
      { latitude: 24.4875, longitude: 54.6072 },
      { latitude: 24.4868, longitude: 54.6078 },
      { latitude: 24.4863687, longitude: 54.6082376 }
    ],
    source: 'Cached Fallback Geometry (Yas Island Pedestrian Way)',
    isLive: false,
    routeType: 'foot'
  };
}

/**
 * Fetch Air-Conditioned Transit Reroute:
 * Leg 1: Short 400m walk to Yas Mall Bus Stop (5 mins outdoor)
 * Leg 2: Air-Conditioned Bus 102 transit straight to Medeor Clinic (6 mins AC transit)
 * Total outdoor exposure reduced from 15 mins down to 5 mins!
 */
export async function fetchAcTransitRoute(): Promise<RouteDetails> {
  const busStopCoord = { latitude: 24.4852524, longitude: 54.6073360 };
  const clinicCoord = { latitude: 24.4863687, longitude: 54.6082376 };
  const homeCoord = SIMULATION_LOCATIONS.yasResidential;

  let walkLeg: RouteCoordinate[] = [
    { latitude: homeCoord.latitude, longitude: homeCoord.longitude },
    { latitude: 24.4872, longitude: 54.6066 },
    { latitude: busStopCoord.latitude, longitude: busStopCoord.longitude }
  ];
  let isLive = false;

  try {
    const res = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${homeCoord.longitude},${homeCoord.latitude};${busStopCoord.longitude},${busStopCoord.latitude}?overview=full&geometries=geojson`);
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.[0]?.geometry?.coordinates) {
        walkLeg = data.routes[0].geometry.coordinates.map((pt: [number, number]) => ({
          latitude: pt[1],
          longitude: pt[0]
        }));
        isLive = true;
      }
    }
  } catch (e) {
    console.warn("Transit pedestrian connection fetch fallback:", e);
  }

  // Bus 102 route connection across Yas street network to clinic
  const transitLeg: RouteCoordinate[] = [
    { latitude: busStopCoord.latitude, longitude: busStopCoord.longitude },
    { latitude: 24.4858, longitude: 54.6077 },
    { latitude: 24.4861, longitude: 54.6080 },
    { latitude: clinicCoord.latitude, longitude: clinicCoord.longitude }
  ];

  return {
    distanceKm: 1.4,
    durationMins: 11,
    outdoorWalkMins: 5,
    coordinates: [...walkLeg, ...transitLeg],
    source: isLive
      ? 'Illustrative Bus 102 scenario; first walk leg uses live OSRM geometry'
      : 'Illustrative Bus 102 scenario with cached walking geometry',
    isLive: false,
    walkLegIsLive: isLive,
    routeType: 'ac_transit'
  };
}

/**
 * Illustrative investment figures for the MVP interface. These are not live-verified legal guidance.
 */
export const INVESTMENT_EXAMPLES: Record<string, InvestmentExamples> = {
  adgm: {
    entityType: 'ADGM',
    corporateTaxRate: '0% Qualifying Free Zone / 9% Standard',
    corporateTaxLegalRef: 'UAE Federal Decree-Law No. 47 of 2022 on the Taxation of Corporations and Businesses & Cabinet Decision No. 55 of 2023',
    foreignOwnership: '100% Foreign Ownership Permitted',
    foreignOwnershipLegalRef: 'Abu Dhabi Global Market Founding Law No. 4 of 2013 & English Common Law Jurisdiction',
    setupTimeline: '2 to 3 weeks via ADGM Registration Authority',
    setupPortalRef: 'ADGM Digital Access Portal (access.adgm.com)',
    goldenVisaLegalRef: 'UAE Cabinet Resolution No. 65 of 2022 (10-Yr Investor Visa for AED 2,000,000+ capital)',
    hub71IncentiveDetails: 'Hub71 Incentive Programme: up to AED 500k subsidized housing, office space on Al Maryah Island, and health insurance'
  },
  mainland: {
    entityType: 'Mainland',
    corporateTaxRate: '9% on taxable income > AED 375,000 (0% below)',
    corporateTaxLegalRef: 'UAE Federal Decree-Law No. 47 of 2022 (Small Business Relief applicable for revenue < AED 3M)',
    foreignOwnership: '100% Foreign Ownership Allowed',
    foreignOwnershipLegalRef: 'Federal Decree-Law No. 32 of 2021 on Commercial Companies',
    setupTimeline: '3 to 5 business days via TAMM',
    setupPortalRef: 'Abu Dhabi Unified Government Services Platform (TAMM.abudhabi)',
    goldenVisaLegalRef: 'Abu Dhabi Residents Office (ADRO) Commercial Investor Track',
    hub71IncentiveDetails: 'Eligible for ADIO (Abu Dhabi Investment Office) Innovation Programme Grants'
  }
};

async function requestAi<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`AI request failed (${response.status})`);
  return response.json() as Promise<T>;
}

/**
 * Simulation Agent via OpenAI ChatGPT (gpt-4o-mini / Codex)
 */
export async function getSimulationResponse(
  chatHistory: { role: 'user' | 'model' | 'assistant'; text: string }[],
  mode: 'residential' | 'business' = 'residential',
  preferTransit: boolean = false,
  weather?: { apparentTemp: number; isLive: boolean },
  sessionContext?: Record<string, unknown>
): Promise<SimulationResponse> {
  const lastMessage = (chatHistory.at(-1)?.text || '').toLowerCase();
  
  const isRoutingQuery = lastMessage.includes('hospital') || lastMessage.includes('clinic') || lastMessage.includes('walk') || lastMessage.includes('direction') || lastMessage.includes('transit') || preferTransit;
  const isBusinessQuery = lastMessage.includes('invest') || lastMessage.includes('tax') || lastMessage.includes('adgm') || lastMessage.includes('business') || lastMessage.includes('company') || lastMessage.includes('freezone') || mode === 'business';

  // Calculate route with live vs cached labeling
  let routeData: RouteDetails | undefined;
  if (isRoutingQuery) {
    if (preferTransit || lastMessage.includes('bus') || lastMessage.includes('transit') || lastMessage.includes('air-condition') || lastMessage.includes('ac')) {
      routeData = await fetchAcTransitRoute();
    } else {
      routeData = await fetchOsrmWalkingRoute(
        { latitude: SIMULATION_LOCATIONS.yasResidential.latitude, longitude: SIMULATION_LOCATIONS.yasResidential.longitude },
        { latitude: ABU_DHABI_POIS[0].latitude, longitude: ABU_DHABI_POIS[0].longitude }
      );
    }
  }

  const defaultFallback: SimulationResponse = isBusinessQuery
    ? {
        voiceReply: "The map is centered on ADGM on Al Maryah Island. I can help you rehearse which company setup, tax, ownership, and licensing questions to verify with current official sources.",
        mapAction: { latitude: 24.5005, longitude: 54.3888, zoom: 15 },
        poiMarkers: ABU_DHABI_POIS,
        investmentMetrics: INVESTMENT_EXAMPLES.adgm
      }
    : {
        voiceReply: isRoutingQuery
          ? (routeData?.routeType === 'ac_transit'
              ? `Here is an illustrative air-conditioned transit scenario to Medeor Clinic: about ${routeData.durationMins} minutes total, with ${routeData.outdoorWalkMins} minutes outdoors. Check the bus service and stops before traveling.`
              : `The nearby clinic is Medeor Medical Clinic, about ${routeData?.distanceKm || 1.2} km or ${routeData?.durationMins || 15} minutes away by ${routeData?.isLive ? 'live walking geometry' : 'illustrative walking estimate'}.`)
          : "Navigating to Yas Island, Building 15.",
        mapAction: isRoutingQuery && routeData
          ? { ...routeData.coordinates[routeData.coordinates.length - 1], zoom: 16 }
          : { latitude: 24.4890, longitude: 54.6060, zoom: 15 },
        poiMarkers: ABU_DHABI_POIS,
        route: routeData?.coordinates,
        routeDetails: routeData,
        distanceKm: routeData?.distanceKm,
        durationMins: routeData?.durationMins,
        routingSource: routeData?.source,
        isLiveRouting: routeData?.isLive
      };

  try {
    const generated = await requestAi<Partial<SimulationResponse>>({
      kind: 'simulation',
      mode,
      messages: chatHistory,
      weather,
      context: {
        ...sessionContext,
        route: routeData ? {
          mode: routeData.routeType,
          distanceKm: routeData.distanceKm,
          durationMins: routeData.durationMins,
          outdoorWalkMins: routeData.outdoorWalkMins,
          source: routeData.source,
          isLive: routeData.isLive,
        } : null,
        investmentExamples: isBusinessQuery ? INVESTMENT_EXAMPLES.adgm : null,
      },
    });
    if (!generated.voiceReply) return { ...defaultFallback, responseSource: 'demo scenario' };
    return {
      ...defaultFallback,
      voiceReply: generated.voiceReply,
      responseSource: 'AI coach',
    };
  } catch {
    return { ...defaultFallback, responseSource: 'demo scenario' };
  }
}

/**
 * Negotiation & Advisory Coach
 */
export async function getCoachResponse(
  messages: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>,
  mode: 'landlord' | 'investment' = 'landlord',
  sessionContext?: Record<string, unknown>
): Promise<FrictionResponse> {
  const defaultLandlordFallback: FrictionResponse = {
    counterpartReply: "Welcome to Abu Dhabi. I am Mr. Rashed, a sample landlord persona. You are interested in a 2-bedroom apartment on Al Reem Island. In this practice scenario, I ask for one cheque and a quick decision. How would you respond?",
    personaType: 'landlord',
    confidenceScore: 78,
    missingQuestions: [
      "Ask whether cooling charges are included and request a written breakdown.",
      "Ask how many payment cheques the owner would accept and check the terms in writing.",
      "Ask which tenancy registration steps apply to this property and where to verify them."
    ],
    warnings: [
      "Cooling providers and charges vary by property and contract; request current written details."
    ],
    tips: [
      "Before paying, verify the property, payment instructions, contract, and registration process through official channels."
    ]
  };

  const defaultInvestmentFallback: FrictionResponse = {
    counterpartReply: "Welcome to the Abu Dhabi investment practice desk. I am Tariq, an illustrative advisor persona. What type of entity are you exploring—an SPV, holding company, or operating company?",
    personaType: 'adgm_officer',
    confidenceScore: 84,
    missingQuestions: [
      "Ask which current corporate tax rules apply to this entity, activity, and income.",
      "Ask which current visa criteria apply to this applicant and investment type.",
      "Ask which licenses are needed for the planned activity and where to confirm them."
    ],
    warnings: [
      "Banking timelines and documentation vary; request current requirements directly from the selected bank."
    ],
    tips: [
      "Ask whether current Hub71 or ADIO programs fit the company and request their published eligibility and terms."
    ]
  };

  const fallback = mode === 'investment' ? defaultInvestmentFallback : defaultLandlordFallback;

  try {
    const generated = await requestAi<Partial<FrictionResponse>>({
      kind: 'coach',
      mode,
      messages,
      context: sessionContext,
    });
    if (!generated.counterpartReply) return { ...fallback, responseSource: 'demo scenario' };
    return {
      ...fallback,
      ...generated,
      confidenceScore: Math.max(0, Math.min(100, Math.round(Number(generated.confidenceScore) || 0))),
      missingQuestions: Array.isArray(generated.missingQuestions) ? generated.missingQuestions : [],
      warnings: Array.isArray(generated.warnings) ? generated.warnings : [],
      tips: Array.isArray(generated.tips) ? generated.tips : [],
      responseSource: 'AI coach',
    };
  } catch {
    return { ...fallback, responseSource: 'demo scenario' };
  }
}
