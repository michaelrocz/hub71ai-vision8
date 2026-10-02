export type PlaceCategory = 'business' | 'hospital' | 'bus' | 'shop';

export interface RehearsalPlace {
  id: string;
  areaId: string;
  name: string;
  shortName: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  source: string;
  sourceUrl: string;
  arrival: string;
  questions: string[];
}

// Public OSM records checked on 2 October 2026. Building points are not surveyed doorways.
export const REHEARSAL_PLACES: RehearsalPlace[] = [
  { id: 'adgm', areaId: 'al-maryah-island', name: 'ADGM · Al Khatem Tower', shortName: 'ADGM offices', category: 'business', latitude: 24.5017193, longitude: 54.3895632, address: '9th floor, Al Khatem Tower, ADGM Square, Al Maryah Island', description: 'Rehearse your first setup conversation at the building currently listed for ADGM personnel.', source: 'OSM way 218681127 + ADGM contact page', sourceUrl: 'https://www.adgm.com/contact-us', arrival: 'ADGM lists its personnel here during building refurbishment. Confirm your meeting and visitor access before travelling. Car Park D is listed for visitors.', questions: ['Which permitted activity describes my actual business?', 'Do I need regulatory approval before incorporation?', 'What office, lease and supporting documents apply to my entity?'] },
  { id: 'hub71', areaId: 'al-maryah-island', name: 'Hub71 · Al Khatem Tower', shortName: 'Hub71', category: 'business', latitude: 24.5017193, longitude: 54.3895632, address: 'Al Khatem Tower, ADGM Square, Al Maryah Island', description: 'Explore the startup ecosystem and prepare the questions behind a tech company’s next chapter.', source: 'OSM way 218681127 + Hub71 registered address', sourceUrl: 'https://www.hub71.com', arrival: 'Hub71 and ADGM share this building point. Programme admission, a meeting appointment and licensing are separate steps.', questions: ['Which programme fits our stage and sector?', 'What evidence of traction and team commitment is required?', 'Which costs and obligations remain outside any support package?'] },
  { id: 'galleria', areaId: 'al-maryah-island', name: 'The Galleria · Main Entrance', shortName: 'The Galleria', category: 'shop', latitude: 24.5011158, longitude: 54.3896652, address: 'Al Maryah Island, Abu Dhabi', description: 'A named arrival point for a short first walk into ADGM Square.', source: 'OSM node 2491267670 (main entrance)', sourceUrl: 'https://www.openstreetmap.org/node/2491267670', arrival: 'This OSM record is labelled Main Entrance. Confirm opening times and access on the day.', questions: ['Where will I park or get dropped off?', 'Can I complete this walk comfortably in the current heat?'] },
  { id: 'cleveland', areaId: 'al-maryah-island', name: 'Cleveland Clinic Abu Dhabi', shortName: 'Cleveland Clinic', category: 'hospital', latitude: 24.4970572, longitude: 54.3878835, address: 'Al Maryah Island, Abu Dhabi', description: 'Locate a real healthcare building and rehearse the approach before an appointment.', source: 'OSM way 219107792', sourceUrl: 'https://www.openstreetmap.org/way/219107792', arrival: 'This is the mapped hospital footprint point. Appointment availability, insurance and the correct department entrance need confirmation.', questions: ['Does my insurance cover the service I need?', 'Which entrance and department should I use?', 'Do I need an appointment or referral?'] },
  { id: 'maryah-bus', areaId: 'al-maryah-island', name: 'Al Maryah St / The Galleria bus stop', shortName: 'Galleria bus stop', category: 'bus', latitude: 24.4988773, longitude: 54.3900072, address: 'Al Maryah Street, Abu Dhabi', description: 'Preview the walk to a mapped stop. The route preview does not include a bus service.', source: 'OSM node 9465637317', sourceUrl: 'https://www.openstreetmap.org/node/9465637317', arrival: 'Verify service, direction and departure times with the transport operator. This preview covers the walking leg only.', questions: ['Is this the stop for my direction of travel?', 'What are the current service and waiting times?'] },
  { id: 'masdar', areaId: 'masdar-city', name: 'Masdar Free Zone · One Stop Shop', shortName: 'One Stop Shop', category: 'business', latitude: 24.4332603, longitude: 54.6185145, address: 'Masdar City, Abu Dhabi', description: 'Prepare a free zone setup conversation and locate the mapped business service point.', source: 'OSM node 3949644434 + Masdar registration guidance', sourceUrl: 'https://masdarcityfreezone.com/explore/license-and-registration', arrival: 'Confirm your appointment and the current customer service location with Masdar City Free Zone before travelling.', questions: ['Which approved activities and package fit my business?', 'What is the full first-year and renewal cost?', 'What workspace and visa allocation are included?'] },
  { id: 'irena', areaId: 'masdar-city', name: 'IRENA headquarters', shortName: 'IRENA district', category: 'business', latitude: 24.4270554, longitude: 54.6187256, address: 'Masdar City, Abu Dhabi', description: 'An orientation landmark in the innovation district; it is not a company registration office.', source: 'OSM way 334446897', sourceUrl: 'https://www.openstreetmap.org/way/334446897', arrival: 'Use this landmark to explore the district. Do not assume public access or a meeting without an appointment.', questions: ['Where would my team work within this district?', 'How would staff reach our chosen workspace?'] },
  { id: 'medeor', areaId: 'yas-island', name: 'Medeor Medical Clinic', shortName: 'Medeor clinic', category: 'hospital', latitude: 24.4863687, longitude: 54.6082376, address: 'Yas Island, Abu Dhabi', description: 'Rehearse a healthcare errand with a named clinic and a real pedestrian route.', source: 'OSM node 3965804675', sourceUrl: 'https://www.openstreetmap.org/node/3965804675', arrival: 'Confirm the clinic’s current services, insurance coverage and appointment availability. The pin is the mapped place point.', questions: ['Does this clinic offer the service my family needs?', 'Is the visit covered by our insurance?', 'What documents and appointment details should I bring?'] },
  { id: 'yas-bus', areaId: 'yas-island', name: 'Yas Mall bus stop', shortName: 'Yas Mall stop', category: 'bus', latitude: 24.4852524, longitude: 54.607336, address: 'Yas Island, Abu Dhabi', description: 'Learn the pedestrian approach to a real mapped bus stop.', source: 'OSM node 3246317524', sourceUrl: 'https://www.openstreetmap.org/node/3246317524', arrival: 'This is a walk to the stop, not a verified bus itinerary. Check the current service and direction separately.', questions: ['Which services stop here today?', 'How long will I wait outside?', 'Is the return stop on the other side of the road?'] },
  { id: 'saadiyat-bus', areaId: 'saadiyat-island', name: 'Saadiyat Public Beach bus stop', shortName: 'Public Beach stop', category: 'bus', latitude: 24.5470674, longitude: 54.4359557, address: 'Saadiyat Island, Abu Dhabi', description: 'Locate a named island stop and understand the walking distance from your starting point.', source: 'OSM node 2429391973', sourceUrl: 'https://www.openstreetmap.org/node/2429391973', arrival: 'Verify current service and direction. Walking times are distance-based estimates and exclude waiting.', questions: ['Does this service connect to my workplace?', 'Would this approach be comfortable at midday?'] },
];

export const findRehearsalPlace = (id?: string) => REHEARSAL_PLACES.find((place) => place.id === id);
export const placesForArea = (id: string) => REHEARSAL_PLACES.filter((place) => place.areaId === id);

export const BUSINESS_SETUP = {
  adgm: {
    title: 'Your ADGM setup plan',
    sourceUrl: 'https://www.adgm.com/setting-up',
    sourceLabel: 'ADGM · official setup guidance',
    steps: [
      ['Define your activity', 'Match your business to permitted activities. Financial services require the relevant authorisation before incorporation.'],
      ['Choose your structure', 'Select the legal entity and check the rules that apply to that structure.'],
      ['Check your company name', 'Check availability and any approval needed for sensitive terms.'],
      ['Arrange your workspace', 'Confirm physical presence and lease evidence. Specific exceptions apply to SPVs.'],
      ['Prepare the application', 'Assemble identity, ownership, resolutions and business documents required for your entity.'],
      ['Apply and plan operations', 'Submit through the official registry. Separately confirm banking, tax, immigration and ongoing compliance.'],
    ],
  },
  masdar: {
    title: 'Your Masdar setup plan',
    sourceUrl: 'https://masdarcityfreezone.com/explore/license-and-registration',
    sourceLabel: 'Masdar City Free Zone · registration guidance',
    steps: [
      ['Choose activities and a package', 'Describe what the company will do and confirm the permitted activities, workspace and visa needs.'],
      ['Start your application', 'Reserve the company name and provide the initial company information.'],
      ['Prepare supporting documents', 'Use the current official checklist for your ownership and legal structure.'],
      ['Review workspace and costs', 'Confirm the full quotation, payment terms, lease and renewal obligations.'],
      ['Complete registration', 'Sign the required legal documents and complete licence issuance with the free zone.'],
      ['Prepare to operate', 'Plan banking, tax registration where applicable, immigration and continuing compliance.'],
    ],
  },
};
