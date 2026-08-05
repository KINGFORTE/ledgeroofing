import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

    projects.forEach((project) => {
      if (!project.coords) return;
      const marker = L.marker(project.coords)
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
