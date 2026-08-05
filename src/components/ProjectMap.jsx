import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function greenPinIcon(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="44">
    <path fill="#16a34a" stroke="#ffffff" stroke-width="1.6" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="4.2" fill="#ffffff"/>
    <text x="12" y="11.3" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${label.length > 1 ? 6.2 : 7.4}" font-weight="700" fill="#16a34a">${label}</text>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  });
}

export default function ProjectMap({ projects, highlightedId, onSelect, className = '' }) {
  const containerRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
    }).setView([6.5, 3.35], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    projects.forEach((project, index) => {
      if (!project.coords) return;
      const marker = L.marker(project.coords, { icon: greenPinIcon(String(index + 1)) })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;text-align:center;"><strong>${project.title}</strong><br/><span style="font-size:11px;color:#555;">${project.location}</span></div>`
        );
      marker.on('click', () => onSelect?.(project));
      markersRef.current[project.id] = marker;
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markersRef.current = {};
    };
  }, [projects, onSelect]);

  useEffect(() => {
    const map = mapInstance.current;
    const marker = markersRef.current[highlightedId];
    if (!map || !marker) return;
    marker.openPopup();
    map.flyTo(marker.getLatLng(), 13, { duration: 0.9 });
  }, [highlightedId]);

  return <div ref={containerRef} className={`z-0 h-[420px] w-full ${className}`} />;
}
