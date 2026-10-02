export interface AbuDhabiArea {
  id: string;
  name: string;
  track: 'residential' | 'business';
  latitude: number;
  longitude: number;
  zoom: number;
  descriptor: string;
  description: string;
}

export const ABU_DHABI_AREAS: AbuDhabiArea[] = [
  {
    id: 'yas-island',
    name: 'Yas Island',
    track: 'residential',
    latitude: 24.489,
    longitude: 54.606,
    zoom: 14,
    descriptor: 'Family life · waterfront · entertainment',
    description: 'Rehearse commutes, family routines, everyday errands, and the questions to ask before choosing a home.',
  },
  {
    id: 'saadiyat-island',
    name: 'Saadiyat Island',
    track: 'residential',
    latitude: 24.5358,
    longitude: 54.434,
    zoom: 14,
    descriptor: 'Culture · coast · residential',
    description: 'Explore a real island setting and think through daily access, services, and the rhythm of coastal living.',
  },
  {
    id: 'al-maryah-island',
    name: 'Al Maryah Island',
    track: 'business',
    latitude: 24.5005,
    longitude: 54.3888,
    zoom: 15,
    descriptor: 'ADGM · finance · business',
    description: 'Explore the business district, then rehearse setup, office, licensing, and advisor conversations.',
  },
  {
    id: 'masdar-city',
    name: 'Masdar City',
    track: 'business',
    latitude: 24.4285,
    longitude: 54.6186,
    zoom: 15,
    descriptor: 'Innovation · clean technology · business',
    description: 'Explore a real innovation district and rehearse the practical questions behind a business base.',
  },
];

export function findAbuDhabiArea(nameOrId: string): AbuDhabiArea | undefined {
  const query = nameOrId.trim().toLowerCase();
  return ABU_DHABI_AREAS.find((area) => area.id === query || area.name.toLowerCase() === query);
}
