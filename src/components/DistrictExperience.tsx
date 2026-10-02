import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box, Layers3, Rotate3D } from 'lucide-react';
import type { AbuDhabiArea } from '../lib/abuDhabiAreas';
import type { PoiMarker, RouteDetails } from '../lib/openai';

function tileFor(latitude: number, longitude: number, zoom: number) {
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const latitudeRadians = (latitude * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

function DistrictModel({ area, focus }: { area: AbuDhabiArea; focus: [number, number] }) {
  const buildings = useMemo(() => {
    const seed = area.id === 'al-maryah-island' ? 3 : area.id === 'masdar-city' ? 8 : area.id === 'saadiyat-island' ? 5 : 1;
    const count = area.id === 'al-maryah-island' ? 13 : 16;
    return Array.from({ length: count }, (_, index) => {
      const row = Math.floor(index / 4);
      const column = index % 4;
      const jitter = Math.sin(index * 13 + seed) * 0.22;
      const x = (column - 1.5) * 1.65 + jitter;
      const z = (row - 1.5) * 1.62 + Math.cos(index * 9 + seed) * 0.18;
      const height = area.id === 'al-maryah-island'
        ? 1.6 + ((index * 7 + seed) % 6) * 0.66
        : area.id === 'saadiyat-island' ? 0.65 + ((index * 3 + seed) % 4) * 0.22
          : area.id === 'masdar-city' ? 0.75 + ((index * 5 + seed) % 4) * 0.28
            : 0.62 + ((index * 5 + seed) % 4) * 0.27;
      const width = area.id === 'saadiyat-island' ? 0.92 : 0.68 + (index % 3) * 0.08;
      return { x, z, height, width, color: index % 5 === 0 ? '#b89d6f' : index % 3 === 0 ? '#71908d' : '#d1c7b2' };
    });
  }, [area.id]);

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 10, 6]} intensity={2.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#85917b" transparent opacity={0.12} roughness={0.95} />
      </mesh>
      {/* Subtle district blocks lift the real aerial tile into an explorable spatial preview. */}
      {buildings.map((building, index) => (
        <group key={`${area.id}-${index}`} position={[building.x, 0, building.z]}>
          <mesh position={[0, building.height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[building.width, building.height, building.width * 0.82]} />
            <meshPhysicalMaterial color={building.color} roughness={0.52} metalness={0.12} clearcoat={0.12} />
          </mesh>
          <mesh position={[0, building.height + 0.025, 0]}>
            <boxGeometry args={[building.width * 1.04, 0.05, building.width * 0.86]} />
            <meshStandardMaterial color="#e8d8b1" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[focus[0], 0.06, focus[1]]}>
        <cylinderGeometry args={[0.34, 0.34, 0.045, 48]} />
        <meshBasicMaterial color="#d6bd86" transparent opacity={0.82} />
      </mesh>
      <mesh position={[focus[0], 0.38, focus[1]]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color="#fff3cb" emissive="#d6bd86" emissiveIntensity={0.65} />
      </mesh>
      <OrbitControls enablePan={false} minDistance={8} maxDistance={15} minPolarAngle={0.55} maxPolarAngle={1.15} autoRotate autoRotateSpeed={0.25} />
    </>
  );
}

interface DistrictExperienceProps {
  area: AbuDhabiArea;
  focus?: [number, number];
  destination?: string;
  destinationSource?: string;
  onCloseDestination?: () => void;
  route?: RouteDetails;
  nearbyPlaces?: PoiMarker[];
  temperature?: string;
  apparentTemperature?: number;
}

export default function DistrictExperience({ area, focus = [0, 0], destination, destinationSource, onCloseDestination, route, nearbyPlaces = [], temperature, apparentTemperature }: DistrictExperienceProps) {
  return (
    <aside className="pointer-events-auto absolute right-4 top-[136px] z-20 hidden max-h-[calc(100vh-150px)] w-[min(430px,41vw)] flex-col gap-3 overflow-y-auto md:flex" aria-label="3D Abu Dhabi location preview">
      <section className="overflow-hidden rounded-[22px] border border-white/20 bg-[#081a20]/90 shadow-[0_20px_70px_rgba(0,0,0,.38)] backdrop-blur-xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-[#e1c78f]"><Layers3 size={13} /> 3D district preview</p>
            <h2 className="mt-1 text-sm font-semibold text-white">{area.name}</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1.5 text-[10px] text-white/65"><Rotate3D size={12} /> Drag to explore</span>
        </header>
        <div className="relative h-[210px] overflow-hidden bg-[#1a302f]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(145deg, rgba(8, 26, 32, .12), rgba(8, 26, 32, .38)), url("${tileFor(area.latitude, area.longitude, Math.min(area.zoom, 15))}")` }} />
          <Canvas className="!absolute inset-0" dpr={[1, 1.5]} camera={{ position: [8, 8, 9], fov: 37 }} shadows gl={{ alpha: true }} onCreated={({ gl }) => gl.setClearColor('#000000', 0)}>
            <Suspense fallback={null}><DistrictModel area={area} focus={focus} /></Suspense>
          </Canvas>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071821]/85 to-transparent px-4 pb-3 pt-8">
            <p className="text-[11px] font-medium text-white/85">{area.descriptor}</p>
            <p className="mt-1 text-[9px] text-white/50">Aerial imagery with an interactive 3D district model</p>
          </div>
        </div>
      </section>

      {destination && route && <section className="relative rounded-[22px] border border-[#d6bd86]/45 bg-[#f4f0e7]/[.97] p-5 text-[#17292e] shadow-[0_20px_65px_rgba(0,0,0,.34)] backdrop-blur-xl" role="dialog" aria-label={`Location details: ${destination}`}>
        <button onClick={onCloseDestination} aria-label="Close location details" className="absolute right-3 top-3 rounded-full px-2 py-1 text-lg leading-none text-[#526165] hover:bg-black/5">×</button>
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-[#8c7445]"><Box size={13} /> Your arrival brief <span className="rounded-full bg-[#25595a]/10 px-2 py-1 text-[9px] tracking-[.08em] text-[#25595a]">{route.isLive ? 'LIVE ROUTE' : 'ROUTE PREVIEW'}</span></p>
        <h3 className="mt-2 pr-6 text-xl font-semibold leading-tight">{destination}</h3>
        <p className="mt-1 text-xs text-[#657174]">{area.name} · {route.routeType === 'ac_transit' ? 'Public transport journey' : 'Walking journey'}</p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-[#d7d1c5] rounded-2xl border border-[#d9d2c3] bg-white/60 py-3">
          <div className="px-3"><p className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#828982]">Journey</p><p className="mt-1 text-lg font-semibold tabular-nums">{route.durationMins}<span className="ml-1 text-xs font-medium">min</span></p></div>
          <div className="px-3"><p className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#828982]">Distance</p><p className="mt-1 text-lg font-semibold tabular-nums">{route.distanceKm.toFixed(1)}<span className="ml-1 text-xs font-medium">km</span></p></div>
          <div className="px-3"><p className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#828982]">Outdoors</p><p className="mt-1 text-lg font-semibold tabular-nums">{route.outdoorWalkMins}<span className="ml-1 text-xs font-medium">min</span></p></div>
        </div>

        <div className="mt-4 rounded-xl border border-[#d7c79f]/60 bg-[#e9dfc9]/45 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#806a3f]">What this means for your day</p>
          <p className="mt-1.5 text-xs leading-[1.55] text-[#4f5d5e]">
            {apparentTemperature !== undefined && apparentTemperature >= 32
              ? `The current feels-like temperature is ${apparentTemperature.toFixed(1)}°C. This option includes ${route.outdoorWalkMins} minutes outdoors; plan shade and air-conditioned breaks.`
              : `This route includes ${route.outdoorWalkMins} minutes outdoors. Use the 3D view to get a sense of the destination before you set out.`}
          </p>
          {temperature && <p className="mt-2 text-[10px] font-medium text-[#657174]">{temperature}°C {apparentTemperature !== undefined ? `feels like ${apparentTemperature.toFixed(1)}°C` : ''}{' · '}{route.isLive ? 'Live route geometry' : 'Estimated route'}</p>}
        </div>

        {nearbyPlaces.length > 0 && <div className="mt-4">
          <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#687273]">Nearby places to know</p><span className="text-[9px] text-[#89908a]">Map-listed</span></div>
          <div className="space-y-1.5">
            {nearbyPlaces.slice(0, 3).map((place) => <div key={`${place.name}-${place.latitude}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2">
              <div className="min-w-0"><p className="truncate text-xs font-medium text-[#263a3d]">{place.name.replace(/ \(.*\)$/, '')}</p><p className="mt-0.5 text-[9px] capitalize text-[#84908f]">{place.type}</p></div>
              <span className="shrink-0 text-[9px] font-medium text-[#397568]">{place.isReal ? 'Mapped place' : 'Scene example'}</span>
            </div>)}
          </div>
        </div>}

        <p className="mt-3 border-t border-[#d7d1c5] pt-2.5 text-[9px] leading-4 text-[#828982]">Destination: {destinationSource || 'map point'} · Route: {route.source}. Check current opening hours and service availability before travelling.</p>
      </section>}
    </aside>
  );
}
