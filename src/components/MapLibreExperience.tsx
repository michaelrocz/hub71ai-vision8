import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  type GeoJSONSource,
  LngLatBounds,
  Map as MapLibre,
  Marker,
  MercatorCoordinate,
  NavigationControl,
  setWorkerUrl,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Activity, ArrowDown, ArrowUpRight, LocateFixed, MapPin, Mic, Navigation, Rotate3D, Search } from 'lucide-react';
import type { AbuDhabiArea } from '../lib/abuDhabiAreas';
import { findNearbyDestination, type PoiMarker, type RouteDetails, type SimulationResponse } from '../lib/openai';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(mapLibreWorkerUrl);

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const ABU_DHABI_BOUNDS: [[number, number], [number, number]] = [[54.12, 24.22], [54.82, 24.78]];

type SearchFeature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | number | undefined>;
};

function resultLabel(feature: SearchFeature) {
  const p = feature.properties;
  return [p.name, p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street, p.district || p.city || p.locality]
    .filter((part, index, all): part is string => typeof part === 'string' && part.length > 0 && all.indexOf(part) === index)
    .join(', ');
}

function featureKey(feature: MapGeoJSONFeature) {
  return typeof feature.id === 'number' || typeof feature.id === 'string' ? feature.id : undefined;
}

function closestPointOnRoad(map: MapLibreMap, lngLat: [number, number]) {
  const point = map.project(lngLat);
  const box: [[number, number], [number, number]] = [[point.x - 64, point.y - 64], [point.x + 64, point.y + 64]];
  let nearest: { coordinate: [number, number]; distance: number; name?: string } | undefined;
  const roads = map.queryRenderedFeatures(box).filter((feature) => feature.sourceLayer === 'transportation'
    && !['motorway', 'trunk', 'motorway_link', 'trunk_link', 'rail'].includes(String(feature.properties?.class || '')));

  for (const road of roads) {
    const geometry = road.geometry;
    const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'MultiLineString' ? geometry.coordinates : [];
    for (const line of lines) {
      for (let index = 1; index < line.length; index += 1) {
        const start = map.project(line[index - 1] as [number, number]);
        const end = map.project(line[index] as [number, number]);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
        const x = start.x + t * dx;
        const y = start.y + t * dy;
        const distance = Math.hypot(point.x - x, point.y - y);
        if (!nearest || distance < nearest.distance) {
          const coordinate = map.unproject([x, y]);
          nearest = { coordinate: [coordinate.lng, coordinate.lat], distance, name: String(road.properties?.name || road.properties?.name_en || '') };
        }
      }
    }
  }
  return nearest;
}

function closestPointOnBuildingEdge(map: MapLibreMap, feature: MapGeoJSONFeature, roadPoint: [number, number]) {
  const geometry = feature.geometry;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  const target = map.project(roadPoint);
  let closest: { coordinate: [number, number]; distance: number } | undefined;
  for (const polygon of polygons) {
    const boundary = polygon[0];
    for (let index = 1; index < boundary.length; index += 1) {
      const start = map.project(boundary[index - 1] as [number, number]);
      const end = map.project(boundary[index] as [number, number]);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared ? Math.max(0, Math.min(1, ((target.x - start.x) * dx + (target.y - start.y) * dy) / lengthSquared)) : 0;
      const x = start.x + t * dx;
      const y = start.y + t * dy;
      const distance = Math.hypot(target.x - x, target.y - y);
      if (!closest || distance < closest.distance) {
        const coordinate = map.unproject([x, y]);
        closest = { coordinate: [coordinate.lng, coordinate.lat], distance };
      }
    }
  }
  return closest?.coordinate;
}

function sampleRoute(coordinates: Array<[number, number]>, count: number) {
  const mercator = coordinates.map((coordinate) => MercatorCoordinate.fromLngLat(coordinate));
  const lengths = [0];
  for (let index = 1; index < mercator.length; index += 1) {
    lengths.push(lengths[index - 1] + Math.hypot(mercator[index].x - mercator[index - 1].x, mercator[index].y - mercator[index - 1].y));
  }
  const total = lengths.at(-1) || 0;
  if (!total) return [coordinates[0], coordinates.at(-1)!];
  const sampled: Array<[number, number]> = [];
  let segment = 1;
  for (let step = 0; step <= count; step += 1) {
    const distance = (step / count) * total;
    while (segment < lengths.length - 1 && lengths[segment] < distance) segment += 1;
    const span = lengths[segment] - lengths[segment - 1];
    const t = span ? (distance - lengths[segment - 1]) / span : 0;
    sampled.push([
      coordinates[segment - 1][0] + (coordinates[segment][0] - coordinates[segment - 1][0]) * t,
      coordinates[segment - 1][1] + (coordinates[segment][1] - coordinates[segment - 1][1]) * t,
    ]);
  }
  return sampled;
}

function addDestinationMarker(map: MapLibreMap, coordinate: [number, number], name: string) {
  const element = document.createElement('div');
  element.className = 'parallel-destination-pin';
  const dot = document.createElement('span');
  dot.className = 'parallel-destination-pin__dot';
  const label = document.createElement('span');
  label.className = 'parallel-destination-pin__label';
  label.textContent = name;
  element.append(dot, label);
  element.setAttribute('aria-label', `Route destination: ${name}`);
  return new Marker({ element, anchor: 'center' }).setLngLat(coordinate).addTo(map);
}

interface MapLibreExperienceProps {
  area: AbuDhabiArea;
  state: SimulationResponse | null;
  route?: RouteDetails;
  nearbyPlaces?: PoiMarker[];
  temperature?: string;
  apparentTemperature?: number;
  onWalkRecorded?: (walk: { origin: string; destination: string; distanceKm: number; durationMins: number; source: string }) => void;
}

export default function MapLibreExperience({ area, state, route, nearbyPlaces = [], temperature, apparentTemperature, onWalkRecorded }: MapLibreExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const entranceMarkerRef = useRef<Marker | null>(null);
  const roadMarkerRef = useRef<Marker | null>(null);
  const walkerMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const roadPointRef = useRef<[number, number] | null>(null);
  const walkRunRef = useRef(0);
  const selectedFeatureRef = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);
  const shouldHighlightBuildingRef = useRef(false);
  const selectedPointRef = useRef<[number, number]>([area.longitude, area.latitude]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchFeature[]>([]);
  const [selectedLabel, setSelectedLabel] = useState(`${area.name} · district center`);
  const [nearestRoad, setNearestRoad] = useState('Finding nearest mapped street…');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [listening, setListening] = useState(false);
  const [walkLoading, setWalkLoading] = useState<'clinic' | 'bus' | null>(null);
  const [walkStatus, setWalkStatus] = useState('');
  const [walkMetrics, setWalkMetrics] = useState<{ distance: number; mins: number; name: string } | null>(null);
  const [walkProgress, setWalkProgress] = useState(0);
  const [walkDestination, setWalkDestination] = useState('');
  const [pinDescription, setPinDescription] = useState('Mapped district focus');
  const [selectionRevision, setSelectionRevision] = useState(0);
  const recognitionRef = useRef<any>(null);
  const routeCoordinatesRef = useRef<Array<[number, number]>>([]);

  const selectLocation = useCallback((lngLat: [number, number], label: string) => {
    walkRunRef.current += 1;
    walkerMarkerRef.current?.remove();
    walkerMarkerRef.current = null;
    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = null;
    roadPointRef.current = null;
    routeCoordinatesRef.current = [];
    setWalkMetrics(null);
    setWalkDestination('');
    setWalkStatus('Place selected · choose a destination to trace a real route');
    shouldHighlightBuildingRef.current = true;
    selectedPointRef.current = lngLat;
    setSelectedLabel(label);
    setSelectionRevision((value) => value + 1);
    setSearchResults([]);
    setSearchError('');
    const map = mapRef.current;
    if (map) {
      (map.getSource('parallel-route') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [] });
      if (map.getLayer('parallel-3d-buildings')) map.setPaintProperty('parallel-3d-buildings', 'fill-extrusion-opacity', 0.55);
      map.flyTo({ center: lngLat, zoom: 17.3, pitch: 66, duration: 1800, essential: true });
      map.once('moveend', () => setSelectionRevision((value) => value + 1));
    }
  }, []);

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const params = new URLSearchParams({
        q: `${query}, Abu Dhabi`, limit: '5', lang: 'en', lat: '24.49', lon: '54.60',
        bbox: '54.12,24.22,54.82,24.78',
      });
      const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
      if (!response.ok) throw new Error('Address search is temporarily unavailable.');
      const payload = await response.json() as { features?: SearchFeature[] };
      const seenResults = new Set<string>();
      const results = (payload.features || []).filter((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const inMapArea = longitude >= ABU_DHABI_BOUNDS[0][0] && longitude <= ABU_DHABI_BOUNDS[1][0]
          && latitude >= ABU_DHABI_BOUNDS[0][1] && latitude <= ABU_DHABI_BOUNDS[1][1];
        const key = `${resultLabel(feature).toLowerCase()}-${longitude.toFixed(4)}-${latitude.toFixed(4)}`;
        if (!inMapArea || seenResults.has(key)) return false;
        seenResults.add(key);
        return true;
      });
      if (!results.length) {
        setSearchError('No address found in the Abu Dhabi city map area. Try a district, street, or landmark.');
        return;
      }
      setSearchResults(results);
      if (results.length === 1) selectLocation(results[0].geometry.coordinates, resultLabel(results[0]) || query);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Could not search that address. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [selectLocation]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MapLibre({
      container: containerRef.current,
      style: STYLE_URL,
      center: [area.longitude, area.latitude],
      zoom: Math.max(area.zoom, 14.5),
      pitch: 60,
      maxPitch: 74,
      bearing: -18,
      maxBounds: ABU_DHABI_BOUNDS,
      minZoom: 12,
      maxZoom: 20,
      attributionControl: false,
      dragRotate: true,
      pitchWithRotate: true,
      touchPitch: true,
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'bottom-right');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left');

    const handleLoad = () => {
      if (!map.getSource('openmaptiles')) {
        setMapError('The map style did not provide the expected OpenStreetMap vector tiles.');
        return;
      }
      const styleLayers = map.getStyle().layers || [];
      const firstLabel = styleLayers.find((layer) => layer.type === 'symbol')?.id;
      const firstVectorOverlay = styleLayers.find((layer: any) => layer['source-layer'] === 'transportation' || layer['source-layer'] === 'building')?.id;
      for (const layer of styleLayers) {
        if (layer.type === 'symbol' && (layer as any)['source-layer'] === 'poi') {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
          continue;
        }
        if (layer.type === 'background' || layer.type === 'fill' || layer.type === 'fill-extrusion') {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
        if (layer.type === 'line' && (layer as any)['source-layer'] === 'transportation') {
          map.setPaintProperty(layer.id, 'line-opacity', 0.18);
        }
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
          map.setPaintProperty(layer.id, 'text-color', '#f4f0e7');
          map.setPaintProperty(layer.id, 'text-halo-color', '#102326');
          map.setPaintProperty(layer.id, 'text-halo-width', 1.25);
        }
      }
      map.addSource('abu-dhabi-satellite', {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      });
      map.addLayer({ id: 'abu-dhabi-satellite-base', type: 'raster', source: 'abu-dhabi-satellite', paint: { 'raster-opacity': 0.96 } }, firstVectorOverlay);
      map.setLight({ anchor: 'viewport', color: '#fff0cb', intensity: 0.78, position: [1.15, 205, 48] });
      const height = ['min', ['max', ['to-number', ['get', 'render_height'], ['to-number', ['get', 'height'], 8]], 3], 120];
      const base = ['max', ['to-number', ['get', 'render_min_height'], ['to-number', ['get', 'min_height'], 0]], 0];
      if (!map.getLayer('parallel-3d-buildings')) {
        map.addLayer({
          id: 'parallel-3d-buildings',
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': [
              'case', ['boolean', ['feature-state', 'selected'], false], '#e1c37d',
              ['match', ['get', 'class'], 'commercial', '#94aba5', 'industrial', '#7e9690', 'residential', '#78948e', '#879e98'],
            ],
            'fill-extrusion-height': height as any,
            'fill-extrusion-base': base as any,
            'fill-extrusion-opacity': 0.55,
            'fill-extrusion-vertical-gradient': true,
          },
        }, firstLabel);
      }
      if (!map.getSource('parallel-route')) map.addSource('parallel-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      if (!map.getLayer('parallel-route-line')) map.addLayer({
        id: 'parallel-route-line', type: 'line', source: 'parallel-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['match', ['get', 'mode'], 'ac_transit', '#77c5d0', '#d9b86d'], 'line-width': 5, 'line-opacity': 0.95, 'line-blur': 0.4 },
      });
      if (!map.getSource('parallel-selection-link')) map.addSource('parallel-selection-link', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      if (!map.getLayer('parallel-selection-line')) map.addLayer({
        id: 'parallel-selection-line', type: 'line', source: 'parallel-selection-link',
        paint: { 'line-color': '#f3d995', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.9 },
      });
      setMapReady(true);
      if (routeCoordinatesRef.current.length) updateRoute(map, routeCoordinatesRef.current);
    };

    const handleError = (event: any) => {
      console.warn('MapLibre map error:', event.error);
      if (event.error?.message) setMapError(event.error.message);
    };
    map.on('load', handleLoad);
    map.on('error', handleError);
    map.on('click', (event: MapMouseEvent) => {
      const building = map.queryRenderedFeatures(event.point, { layers: ['parallel-3d-buildings'] })[0];
      const featureId = building && featureKey(building);
      if (featureId !== undefined && building) {
        if (selectedFeatureRef.current) map.setFeatureState(selectedFeatureRef.current, { selected: false });
        const selection = { source: building.source, sourceLayer: building.sourceLayer || 'building', id: featureId };
        map.setFeatureState(selection, { selected: true });
        selectedFeatureRef.current = selection;
      }
      const label = building?.properties?.name || building?.properties?.name_en || 'Selected building';
      selectLocation([event.lngLat.lng, event.lngLat.lat], String(label));
    });

    return () => {
      entranceMarkerRef.current?.remove();
      roadMarkerRef.current?.remove();
      walkerMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      walkRunRef.current += 1;
      map.remove();
      mapRef.current = null;
    };
  // The map is initialized once and uses area as its initial camera.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRoute = (map: MapLibreMap, coordinates: Array<[number, number]>, mode: 'foot' | 'ac_transit' = 'foot') => {
    const source = map.getSource('parallel-route') as GeoJSONSource | undefined;
    if (!source) return;
    if (coordinates.length < 2) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    source.setData({ type: 'Feature', properties: { mode }, geometry: { type: 'LineString', coordinates } });
  };

  useEffect(() => {
    const action = state?.mapAction;
    const map = mapRef.current;
    if (!action || !map || !mapReady) return;
    walkRunRef.current += 1;
    setSearchResults([]);
    setSearchText('');
    setWalkLoading(null);
    walkerMarkerRef.current?.remove();
    walkerMarkerRef.current = null;
    if (map.getLayer('parallel-3d-buildings')) map.setPaintProperty('parallel-3d-buildings', 'fill-extrusion-opacity', 0.55);
    if (!state?.routeDetails) {
      routeCoordinatesRef.current = [];
      updateRoute(map, []);
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
      setWalkMetrics(null);
      setWalkDestination('');
      setWalkProgress(0);
    }
    shouldHighlightBuildingRef.current = Boolean(state?.investmentMetrics);
    map.flyTo({ center: [action.longitude, action.latitude], zoom: Math.max(action.zoom, 15), pitch: 60, duration: 1500, essential: true });
    const point: [number, number] = [action.longitude, action.latitude];
    selectedPointRef.current = point;
    setSelectedLabel(state?.routeDetails ? `${area.name} · route start` : area.name);
    setSelectionRevision((value) => value + 1);
    if (state?.mapTour === 'orbit') {
      setWalkStatus(`Exploring ${area.name} · 3D district orbit`);
      map.once('moveend', () => {
        if (mapRef.current === map) map.easeTo({ center: point, zoom: Math.max(map.getZoom(), 16.7), pitch: 70, bearing: map.getBearing() + 95, duration: 4300, essential: true });
      });
    }
  }, [state?.mapAction?.latitude, state?.mapAction?.longitude, state?.mapTour, mapReady, area.name, state?.routeDetails]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const coordinates = route?.coordinates.map((point) => [point.longitude, point.latitude] as [number, number]) || [];
    routeCoordinatesRef.current = coordinates;
    updateRoute(map, coordinates, route?.routeType);
    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = null;
    if (coordinates.length >= 2) {
      const destination = state?.routeDestination || 'Mapped destination';
      destinationMarkerRef.current = addDestinationMarker(map, coordinates.at(-1)!, destination);
      setWalkDestination(destination);
      setWalkStatus(`Route ready · ${area.name} to ${destination}`);
      const bounds = coordinates.reduce((current, coordinate) => current.extend(coordinate), new LngLatBounds(coordinates[0], coordinates[0]));
      map.fitBounds(bounds, { padding: window.innerWidth < 768 ? 55 : { top: 140, bottom: 170, left: 440, right: 420 }, maxZoom: 16.5, duration: 1400, pitch: 60 });
    } else {
      setWalkDestination('');
    }
  }, [route, mapReady, state?.routeDestination, area.name]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const point = selectedPointRef.current;
    if (selectedFeatureRef.current) map.setFeatureState(selectedFeatureRef.current, { selected: false });
    selectedFeatureRef.current = null;
    const buildingLayerAvailable = map.getLayer('parallel-3d-buildings');
    const projected = map.project(point);
    const building = shouldHighlightBuildingRef.current && buildingLayerAvailable
      ? (map.queryRenderedFeatures(projected, { layers: ['parallel-3d-buildings'] })[0]
        || map.queryRenderedFeatures([[projected.x - 16, projected.y - 16], [projected.x + 16, projected.y + 16]], { layers: ['parallel-3d-buildings'] })[0])
      : undefined;
    if (building) {
      const id = featureKey(building);
      if (id !== undefined) {
        const selected = { source: building.source, sourceLayer: building.sourceLayer || 'building', id };
        map.setFeatureState(selected, { selected: true });
        selectedFeatureRef.current = selected;
      }
    }

    const nearest = closestPointOnRoad(map, point);
    const roadIsClose = Boolean(nearest && nearest.distance < 90);
    const approach = building && roadIsClose && nearest
      ? closestPointOnBuildingEdge(map, building, nearest.coordinate)
      : undefined;
    const pinPoint = approach || point;
    setPinDescription(approach ? 'Estimated building entrance facing the mapped road' : shouldHighlightBuildingRef.current ? 'Mapped address point' : 'District focus · search an address for an entrance pin');

    const entrance = document.createElement('div');
    entrance.className = 'parallel-map-pin';
    entrance.setAttribute('aria-label', approach ? 'Estimated road-facing entrance' : 'Selected address point');
    entrance.title = approach ? 'Estimated road-facing entrance' : 'Mapped address point';
    entranceMarkerRef.current?.remove();
    entranceMarkerRef.current = new Marker({ element: entrance, anchor: 'bottom' }).setLngLat(pinPoint).addTo(map);

    if (nearest && roadIsClose) {
      roadPointRef.current = nearest.coordinate;
      const road = document.createElement('div');
      road.className = 'parallel-road-dot';
      road.title = 'Nearest mapped road connection';
      roadMarkerRef.current?.remove();
      roadMarkerRef.current = new Marker({ element: road, anchor: 'center' }).setLngLat(nearest.coordinate).addTo(map);
      const source = map.getSource('parallel-selection-link') as GeoJSONSource | undefined;
      source?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [pinPoint, nearest.coordinate] } });
      setNearestRoad(nearest.name ? `Road approach · ${nearest.name}` : 'Road approach · nearest mapped street');
    } else {
      roadPointRef.current = null;
      roadMarkerRef.current?.remove();
      (map.getSource('parallel-selection-link') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [] });
      setNearestRoad('Road connection not mapped at this zoom');
    }
  }, [selectionRevision, mapReady]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-AE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      if (transcript) {
        setSearchText(transcript);
        void runSearch(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.onend = null;
      try { recognition.stop(); } catch { /* Recognition may not have started. */ }
      recognitionRef.current = null;
    };
  }, [runSearch]);

  const walkRoute = async (destinationType: 'clinic' | 'bus') => {
    const run = ++walkRunRef.current;
    setSearchResults([]);
    setSearchText('');
    setSearchError('');
    setWalkLoading(destinationType);
    setWalkStatus(`Finding a nearby mapped ${destinationType === 'clinic' ? 'clinic' : 'bus stop'}…`);
    setWalkMetrics(null);
    setWalkProgress(0);
    try {
      const [fromLng, fromLat] = roadPointRef.current || selectedPointRef.current;
      const target = await findNearbyDestination({ latitude: fromLat, longitude: fromLng }, destinationType === 'clinic' ? 'hospital' : 'bus');
      if (run !== walkRunRef.current) return;
      if (!target) throw new Error(`No verified nearby ${destinationType === 'clinic' ? 'clinic' : 'bus stop'} was found. Search a named place instead.`);
      setWalkDestination(target.name);
      setWalkStatus(`Tracing streets to ${target.name}…`);
      const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${fromLng},${fromLat};${target.longitude},${target.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (run !== walkRunRef.current) return;
      if (!response.ok) throw new Error('Live walking route is unavailable at the moment.');
      const payload = await response.json() as { routes?: Array<{ geometry?: { coordinates?: [number, number][] }; distance?: number; duration?: number }> };
      if (run !== walkRunRef.current) return;
      const result = payload.routes?.[0];
      const coordinates = result?.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) throw new Error('No mapped pedestrian route was found from this point.');
      const map = mapRef.current;
      if (!map) return;
      routeCoordinatesRef.current = coordinates;
      updateRoute(map, coordinates);
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = addDestinationMarker(map, coordinates.at(-1)!, target.name);
      const distance = (result.distance || 0) / 1000;
      const mins = Math.max(1, Math.round((result.duration || (distance * 1000 / 80)) / 60));
      setWalkMetrics({ distance, mins, name: target.name });
      setWalkStatus(`Start: ${selectedLabel} · Destination: ${target.name}`);
      const bounds = coordinates.reduce((bounds, coordinate) => bounds.extend(coordinate), new LngLatBounds(coordinates[0], coordinates[0]));
      await new Promise<void>((resolve) => {
        map.once('moveend', () => resolve());
        map.fitBounds(bounds, { padding: window.innerWidth < 768 ? 56 : { top: 110, bottom: 130, left: 440, right: 390 }, maxZoom: 15.5, duration: 1300, pitch: 60 });
      });
      if (run !== walkRunRef.current) return;
      const sampled = sampleRoute(coordinates, 20);
      const walker = document.createElement('div');
      walker.className = 'parallel-walker-dot';
      walker.title = 'Your position on the walkthrough';
      walkerMarkerRef.current?.remove();
      walkerMarkerRef.current = new Marker({ element: walker, anchor: 'center' }).setLngLat(sampled[0]).addTo(map);
      map.setPaintProperty('parallel-3d-buildings', 'fill-extrusion-opacity', 0.34);
      setWalkStatus('Walking the mapped streets · 3D route preview');
      for (let index = 0; index < sampled.length - 1; index += 1) {
        if (run !== walkRunRef.current) return;
        const current = sampled[index];
        const next = sampled[index + 1];
        const east = MercatorCoordinate.fromLngLat(next).x - MercatorCoordinate.fromLngLat(current).x;
        const north = MercatorCoordinate.fromLngLat(current).y - MercatorCoordinate.fromLngLat(next).y;
        const angle = (Math.atan2(east, north) * 180) / Math.PI;
        const started = performance.now();
        const moveWalker = (now: number) => {
          if (run !== walkRunRef.current || !walkerMarkerRef.current) return;
          const t = Math.min(1, (now - started) / 550);
          walkerMarkerRef.current.setLngLat([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
          if (t < 1) requestAnimationFrame(moveWalker);
        };
        requestAnimationFrame(moveWalker);
        await new Promise<void>((resolve) => {
          map.once('moveend', () => resolve());
          map.easeTo({ center: next, offset: [0, 70], zoom: 17.8, pitch: 70, bearing: angle, duration: 550, easing: (value) => value, essential: true });
        });
        if (run !== walkRunRef.current) return;
        walkerMarkerRef.current?.setLngLat(next);
        setWalkProgress(Math.round(((index + 1) / (sampled.length - 1)) * 100));
      }
      onWalkRecorded?.({ origin: selectedLabel, destination: target.name, distanceKm: distance, durationMins: mins, source: 'Live OpenStreetMap pedestrian route' });
      setWalkStatus('You’ve arrived · drag to inspect the real district in 3D');
    } catch (error) {
      if (run === walkRunRef.current) setWalkStatus(error instanceof Error ? error.message : 'Could not create a walking route.');
    } finally {
      if (run === walkRunRef.current) {
        if (mapRef.current?.getLayer('parallel-3d-buildings')) mapRef.current.setPaintProperty('parallel-3d-buildings', 'fill-extrusion-opacity', 0.55);
        setWalkLoading(null);
      }
    }
  };

  const cancelWalk = () => {
    walkRunRef.current += 1;
    mapRef.current?.stop();
    if (mapRef.current?.getLayer('parallel-3d-buildings')) mapRef.current.setPaintProperty('parallel-3d-buildings', 'fill-extrusion-opacity', 0.55);
    walkerMarkerRef.current?.remove();
    walkerMarkerRef.current = null;
    setWalkLoading(null);
    setWalkStatus('Walkthrough paused · select a route to start again');
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    if (walkLoading) cancelWalk();
    map.flyTo({ center: selectedPointRef.current, zoom: 17.2, pitch: 66, bearing: -18, duration: 1400, essential: true });
  };
  const orbitView = () => {
    const map = mapRef.current;
    if (!map) return;
    if (walkLoading) cancelWalk();
    map.easeTo({ center: selectedPointRef.current, zoom: Math.max(map.getZoom(), 17.3), pitch: 70, bearing: map.getBearing() + 110, duration: 5200, essential: true });
  };
  const routeDestination = state?.routeDestination || walkDestination || 'Selected destination';

  return (
    <>
      <div className="absolute inset-0 z-0 bg-[#102326]"><div ref={containerRef} className="h-full w-full" aria-label="Interactive 3D Abu Dhabi map" /></div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#061317]/25 via-transparent to-[#061317]/10" />
      <aside className="pointer-events-auto absolute right-5 top-[138px] z-20 flex max-h-[calc(100vh-158px)] w-[min(390px,calc(100vw-40px))] flex-col overflow-y-auto rounded-[24px] border border-white/20 bg-[#0a1d22]/95 text-white shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:right-7" aria-label="Explore Abu Dhabi map">
        <header className="border-b border-white/10 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#d8bf84]"><Activity size={13} /> Abu Dhabi · live map</p>
              <h2 className="mt-1.5 text-[17px] font-semibold tracking-[-.02em]">Explore the real city</h2>
              <p className="mt-1 text-[11px] text-white/55">Tilt, turn, and search a place before you arrive.</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button onClick={orbitView} aria-label="Orbit selected place in 3D" title="Orbit this place in 3D" className="flex h-9 items-center gap-1.5 rounded-full border border-[#d7bf86]/35 bg-[#d7bf86]/15 px-3 text-[10px] font-semibold text-[#e8d5a4] transition hover:bg-[#d7bf86]/25"><Rotate3D size={15} /> 3D orbit</button>
              <button onClick={resetView} aria-label="Reset map view" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[.06] text-white/70 transition hover:bg-white/10"><LocateFixed size={15} /></button>
            </div>
          </div>
          <form className="mt-4 flex items-center gap-1.5 rounded-[14px] border border-white/15 bg-black/20 p-1.5 focus-within:border-[#dbc487]/70" onSubmit={(event) => { event.preventDefault(); void runSearch(searchText); }}>
            <Search size={16} className="ml-2 shrink-0 text-white/45" />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search an Abu Dhabi address" className="h-9 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40" aria-label="Search an Abu Dhabi address" />
            <button type="button" onClick={() => {
              if (!recognitionRef.current) { setSearchError('Voice search is not supported in this browser.'); return; }
              try { recognitionRef.current.start(); setListening(true); } catch { setListening(false); }
            }} aria-label={listening ? 'Listening for an address' : 'Search by voice'} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${listening ? 'bg-red-500 text-white' : 'bg-white/10 text-white/75 hover:bg-white/15'}`}><Mic size={15} className={listening ? 'animate-pulse' : ''} /></button>
            <button disabled={searching || !searchText.trim()} type="submit" aria-label="Search" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d7bd82] text-[#142327] transition hover:bg-[#ead49c] disabled:cursor-wait disabled:opacity-50"><ArrowUpRight size={16} /></button>
          </form>
          {searching && <p className="mt-2 px-1 text-[11px] text-white/55">Searching Abu Dhabi…</p>}
          {searchError && <p role="status" className="mt-2 rounded-xl border border-amber-200/15 bg-amber-100/[.07] px-3 py-2 text-[11px] leading-5 text-amber-100/80">{searchError}</p>}
          {searchResults.length > 0 && <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#10262a]">
            {searchResults.map((result, index) => <button key={`${result.geometry.coordinates.join(',')}-${index}`} onClick={() => selectLocation(result.geometry.coordinates, resultLabel(result) || 'Selected Abu Dhabi address')} className="flex w-full items-start gap-2.5 border-b border-white/[.07] px-3 py-2.5 text-left last:border-0 hover:bg-white/[.06]">
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#d9bd7a]" />
              <span className="text-[11px] leading-4 text-white/85">{resultLabel(result) || 'Abu Dhabi result'}<span className="mt-0.5 block text-[9px] text-white/45">{[result.properties.district, result.properties.city, result.properties.country].filter(Boolean).join(' · ')}</span></span>
            </button>)}
          </div>}
        </header>

        <section className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d9bf83]/15 text-[#dcc487]"><MapPin size={16} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-white/45">Selected place</p>
              <p className="mt-1 truncate text-[13px] font-medium text-white/90">{selectedLabel}</p>
              <p className="mt-1 text-[10px] text-[#d2c08e]">{nearestRoad}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[.045] px-3 py-2 text-[10px] leading-4 text-white/60"><span className="h-2 w-2 shrink-0 rounded-full bg-[#e7c980]" />{pinDescription}{!nearestRoad.startsWith('Road connection') && <><span className="mx-1 text-white/30">→</span><span className="h-2 w-2 shrink-0 rounded-full bg-[#79ceb4]" />mapped road</>}</div>
        </section>

        <section className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#d7bf86]">Walk the route</p><p className="mt-1 text-[11px] text-white/55">Trace a real path to a nearby place.</p></div>
            {walkLoading && <button type="button" onClick={cancelWalk} className="text-[10px] font-semibold text-[#d9c487] hover:text-white">Stop tour</button>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={!!walkLoading} onClick={() => void walkRoute('clinic')} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-left text-[11px] font-medium transition hover:border-[#d4bc82]/50 hover:bg-white/[.1] disabled:opacity-50"><span>Find clinic</span><ArrowDown size={13} className="text-[#d9c487]" /></button>
            <button disabled={!!walkLoading} onClick={() => void walkRoute('bus')} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-left text-[11px] font-medium transition hover:border-[#d4bc82]/50 hover:bg-white/[.1] disabled:opacity-50"><span>Find bus stop</span><ArrowDown size={13} className="text-[#d9c487]" /></button>
          </div>
          {walkDestination && <div className="mt-3 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2.5 text-[10px] leading-5 text-white/70"><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#e7c980]" />Start · {selectedLabel}</div><div className="truncate"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#79ceb4]" />Arrive · {walkDestination}</div>{walkLoading && walkProgress > 0 && <div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#1ea7bd]" />Moving now · {walkProgress}% complete</div>}</div>}
          {walkMetrics && <div className="mt-3 flex items-center justify-between rounded-xl border border-[#d8c184]/20 bg-[#d8c184]/[.08] px-3 py-2.5">
            <div><p className="text-[11px] font-semibold text-white">{walkMetrics.name}</p><p className="mt-1 text-[10px] text-white/55">{walkMetrics.distance.toFixed(1)} km · about {walkMetrics.mins} min on foot</p></div>
            <Navigation size={15} className="text-[#dec98f]" />
          </div>}
          {walkStatus && <p role="status" className="mt-2 text-[10px] leading-4 text-white/55">{walkStatus}</p>}
          {walkLoading && walkProgress > 0 && <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" aria-label={`Walkthrough ${walkProgress}% complete`}><div className="h-full rounded-full bg-[#d9bf83] transition-[width] duration-500" style={{ width: `${walkProgress}%` }} /></div>}
        </section>

        {route && <section className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#d7bf86]">Your arrival brief</p>
            <span className="rounded-full border border-white/10 bg-white/[.05] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.1em] text-white/55">{route.isLive ? 'Live route' : 'Route preview'}</span>
          </div>
          <h3 className="mt-1.5 text-[14px] font-semibold text-white">{routeDestination}</h3>
          <p className="mt-1 text-[10px] text-white/50">{area.name} · {route.routeType === 'ac_transit' ? 'Public transport journey' : 'Walking journey'}</p>
          <div className="mt-3 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-white/[.035] py-2.5">
            <div className="px-2.5"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-white/40">Journey</p><p className="mt-1 text-[15px] font-semibold tabular-nums">{route.durationMins}<span className="ml-1 text-[9px] font-medium">min</span></p></div>
            <div className="px-2.5"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-white/40">Distance</p><p className="mt-1 text-[15px] font-semibold tabular-nums">{route.distanceKm.toFixed(1)}<span className="ml-1 text-[9px] font-medium">km</span></p></div>
            <div className="px-2.5"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-white/40">Outdoors</p><p className="mt-1 text-[15px] font-semibold tabular-nums">{route.outdoorWalkMins}<span className="ml-1 text-[9px] font-medium">min</span></p></div>
          </div>
          <p className="mt-3 rounded-xl bg-[#d9bf83]/[.08] px-3 py-2.5 text-[10px] leading-[1.55] text-white/65">
            {apparentTemperature !== undefined && apparentTemperature >= 32
              ? `Feels like ${apparentTemperature.toFixed(1)}°C now. This journey includes ${route.outdoorWalkMins} minutes outside; plan for shade and air-conditioned breaks.`
              : `This journey includes ${route.outdoorWalkMins} minutes outside. Rehearse the route before you choose how to travel.`}
          </p>
          {nearbyPlaces.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{nearbyPlaces.slice(0, 3).map((place) => <span key={`${place.name}-${place.latitude}`} className="rounded-full border border-white/10 bg-white/[.045] px-2.5 py-1 text-[9px] text-white/55">{place.name.replace(/ \(.*\)$/, '')}</span>)}</div>}
          <p className="mt-3 border-t border-white/[.08] pt-2 text-[9px] leading-4 text-white/35">{route.source}. Confirm opening hours and service availability before travelling.</p>
        </section>}

        <footer className="mt-auto border-t border-white/10 px-5 py-3">
          <div className="flex items-center justify-between gap-2 text-[9px] text-white/40"><span>{area.name} · 3D buildings</span><span>{temperature ? `${temperature}°C` : ''}{apparentTemperature !== undefined ? ` · feels ${apparentTemperature.toFixed(1)}°` : ''}</span></div>
          {nearbyPlaces.length > 0 && <p className="mt-2 truncate text-[9px] text-white/35">Nearby: {nearbyPlaces.map((place) => place.name.replace(/ \(.*\)$/, '')).slice(0, 2).join(' · ')}</p>}
        </footer>
      </aside>
      {!mapReady && <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-[#0a1d22]/85 px-4 py-2 text-[11px] text-white/70 shadow-lg">Loading Abu Dhabi 3D map…</div>}
      {mapError && <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 max-w-[80vw] -translate-x-1/2 rounded-xl border border-amber-100/20 bg-[#0a1d22]/90 px-4 py-2 text-[11px] text-amber-50/80">{mapError}</div>}
      {walkLoading && walkProgress > 0 && <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 bg-[#071d22]/92 px-4 py-2.5 text-white shadow-[0_15px_35px_rgba(0,0,0,.4)] backdrop-blur-xl md:flex"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1ea7bd]/20 text-[#8fe2e7]"><Navigation size={14} /></span><span className="whitespace-nowrap text-[11px] font-semibold">Walking to {walkDestination}</span><span className="h-4 w-px bg-white/20" /><span className="text-[11px] font-semibold tabular-nums text-[#e0ca92]">{walkProgress}%</span></div>}
      <style>{`
        .maplibregl-ctrl-group { border-radius: 12px !important; overflow: hidden; background: rgba(8,25,29,.88) !important; box-shadow: 0 8px 28px rgba(0,0,0,.28) !important; }
        .maplibregl-ctrl-group button { background-color: transparent !important; }
        .maplibregl-ctrl-group button span { filter: invert(1) sepia(.2) saturate(.6); }
        .maplibregl-ctrl-attrib { background: rgba(8,25,29,.72) !important; color: rgba(255,255,255,.56) !important; border-radius: 8px 8px 0 0; }
        .maplibregl-ctrl-attrib a { color: #d8c184 !important; }
        .parallel-map-pin { position: relative; width: 24px; height: 32px; filter: drop-shadow(0 5px 12px rgba(0,0,0,.45)); }
        .parallel-map-pin::before { position: absolute; top: 0; left: 0; width: 24px; height: 24px; content: ''; border: 3px solid #fff8df; border-radius: 50%; background: #d7b96d; box-shadow: 0 0 0 6px rgba(215,185,109,.24); }
        .parallel-map-pin::after { position: absolute; bottom: 0; left: 8px; content: ''; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 10px solid #d7b96d; }
        .parallel-road-dot { width: 11px; height: 11px; border: 2px solid #fff; border-radius: 50%; background: #76c9b0; box-shadow: 0 0 0 4px rgba(118,201,176,.2),0 2px 8px rgba(0,0,0,.4); }
        .parallel-walker-dot { width: 18px; height: 18px; border: 3px solid white; border-radius: 50%; background: #1ea7bd; box-shadow: 0 0 0 8px rgba(30,167,189,.25),0 0 28px rgba(30,167,189,.65),0 3px 12px rgba(0,0,0,.6); }
        .parallel-destination-pin { position: relative; width: 18px; height: 18px; }
        .parallel-destination-pin__dot { position: absolute; inset: 0; border: 3px solid #fff; border-radius: 50%; background: #79ceb4; box-shadow: 0 0 0 6px rgba(121,206,180,.24),0 5px 18px rgba(0,0,0,.5); }
        .parallel-destination-pin__label { position: absolute; right: 27px; bottom: -2px; overflow: hidden; max-width: 180px; width: max-content; padding: 5px 9px; border: 1px solid rgba(255,255,255,.32); border-radius: 999px; background: rgba(8,29,34,.94); color: #fff; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; box-shadow: 0 6px 18px rgba(0,0,0,.28); }
        .maplibregl-ctrl-bottom-right { right: 416px; bottom: 18px; }
        @media (max-width: 767px) { .maplibregl-ctrl-bottom-right { right: 16px; bottom: 16px; } }
      `}</style>
    </>
  );
}
