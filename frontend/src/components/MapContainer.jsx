import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

// --- 🚀 ANTIGRAVITY ICON FACTORY ---
const createAuraIcon = (bus, isBoarded) => {
    const color = bus.occupants > 40 ? '#ef4444' : bus.occupants > 20 ? '#f59e0b' : '#10b981';

    if (isBoarded) {
        return L.divIcon({
            className: 'antigravity-bus-container',
            html: `
                <div style="position: relative; width: 60px; height: 60px; display: flex; justify-content: center; align-items: center;">
                    <div style="position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0) 70%); border-radius: 50%; animation: float 3s ease-in-out infinite;"></div>
                    <div style="position: absolute; width: 70%; height: 70%; background: radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 80%); border-radius: 50%; animation: pulse-glow 2s infinite;"></div>
                    <div style="position: absolute; bottom: -5px; background: #3b82f6; color: white; font-size: 9px; padding: 2px 8px; border-radius: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 30; animation: float 3s ease-in-out infinite;">YOUR BUS</div>
                    <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" style="width: 30px; height: 30px; z-index: 20; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); animation: float 3s ease-in-out infinite;" />
                </div>
                <style>
                    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                    @keyframes pulse-glow { 0% { transform: scale(0.9); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 0.4; } 100% { transform: scale(0.9); opacity: 0.7; } }
                </style>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });
    }

    return L.divIcon({
        className: 'custom-bus-container',
        html: `
            <div style="position: relative; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center;">
                <div style="position: absolute; width: 100%; height: 100%; background: ${color}; opacity: 0.3; border-radius: 50%; border: 2px solid ${color};"></div>
                <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" style="width: 26px; height: 26px; z-index: 10;" />
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
};

// --- Controllers ---
function MapActionController({ boardedBusId, simRef }) {
    const map = useMap();
    useEffect(() => {
        if (boardedBusId && simRef.current) {
            const bus = simRef.current.find(b => b.id === boardedBusId);
            if (bus) {
                const currentPos = bus.path[bus.step];
                map.flyTo(currentPos, 17, { animate: true, duration: 1.5 });
            }
        }
    }, [boardedBusId, map, simRef]);
    return null;
}

function MapCameraController({ route, center }) {
    const map = useMap();
    const lastRouteRef = useRef(null);
    useEffect(() => {
        const routeString = JSON.stringify(route);
        if (route && route.length > 0 && routeString !== lastRouteRef.current) {
            map.fitBounds(L.latLngBounds(route), { padding: [50, 50] });
            lastRouteRef.current = routeString;
        } else if (center && !route) {
            map.flyTo(center, 15);
        }
    }, [route, center, map]);
    return null;
}

const MapComponent = ({ route, routeStops, center, boardedBusId, setBoardedBusId, onApproachDestination }) => {
    const kochiCenter = [9.9816, 76.2999];
    const [liveBuses, setLiveBuses] = useState([]);
    const simRef = useRef([]);
    const autoPingTriggered = useRef(false);

    // 1. Static GTFS Stop Markers (Small Black Circles)
    const stopMarkers = useMemo(() => {
        if (!routeStops || routeStops.length === 0) return null;
        return routeStops.map((stop, idx) => (
            <CircleMarker
                key={`stop-${stop.stop_id}-${idx}`}
                center={[stop.stop_lat, stop.stop_lon]}
                radius={4}
                pathOptions={{
                    fillColor: '#23ca2bff',
                    fillOpacity: 1,
                    color: '#ffffff',
                    weight: 1,
                    pane: 'markerPane'
                }}
            >
                <Popup>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{stop.stop_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>Stop ID: {stop.stop_id}</div>
                </Popup>
            </CircleMarker>
        ));
    }, [routeStops]);

    const routeLine = useMemo(() => {
        if (!route || route.length === 0) return null;
        return <Polyline positions={route} color="#10b981" weight={6} opacity={0.3} lineJoin="round" />;
    }, [route]);

    const activeConnectionLine = useMemo(() => {
        if (!boardedBusId || !route) return null;
        const bus = liveBuses.find(b => b.id === boardedBusId);
        if (!bus) return null;
        return <Polyline positions={bus.path.slice(bus.step)} color="#3b82f6" weight={5} opacity={1} dashArray="10, 15" />;
    }, [boardedBusId, liveBuses, route]);

    useEffect(() => {
        if (!route || route.length === 0 || !center) return;
        let userIdx = 0;
        let minD = Infinity;
        route.forEach((pt, i) => {
            const d = Math.sqrt(Math.pow(pt[0] - center[0], 2) + Math.pow(pt[1] - center[1], 2));
            if (d < minD) { minD = d; userIdx = i; }
        });

        const upstreamBuses = [0.2, 0.5, 0.8].map((percent, i) => ({
            id: `bus-${i}`,
            name: `Bus ${101 + i}`,
            path: route,
            step: Math.floor(userIdx * percent),
            userIdx: userIdx,
            occupants: Math.floor(Math.random() * 40) + 5,
            isWaiting: false,
            waitTimer: 0
        }));
        simRef.current = upstreamBuses;
        setLiveBuses(upstreamBuses);
    }, [route, center]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (simRef.current.length > 0) {
                const updated = simRef.current.map(bus => {
                    if (bus.isWaiting) {
                        const newTimer = bus.waitTimer - 1;
                        return { ...bus, waitTimer: newTimer, isWaiting: newTimer > 0 };
                    }
                    const nextStep = (bus.step + 1) % bus.path.length;
                    if (boardedBusId === bus.id && !autoPingTriggered.current) {
                        if (bus.step / bus.path.length > 0.85) {
                            if (onApproachDestination) onApproachDestination();
                            autoPingTriggered.current = true;
                        }
                    }
                    return { ...bus, step: nextStep };
                });
                simRef.current = updated;
                setLiveBuses(updated);
            }
        }, 1500);
        return () => clearInterval(interval);
    }, [boardedBusId, onApproachDestination]);

    return (
        <div className="map-wrapper" style={{ height: '100vh', width: '100vw' }}>
            <MapContainer center={kochiCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <MapCameraController route={route} center={center} />
                <MapActionController boardedBusId={boardedBusId} simRef={simRef} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {routeLine}
                {stopMarkers}
                {activeConnectionLine}

                {liveBuses.map(bus => {
                    const isBoarded = boardedBusId === bus.id;
                    return (
                        <Marker
                            key={`${bus.id}-${isBoarded}`}
                            position={bus.path[bus.step]}
                            icon={createAuraIcon(bus, isBoarded)}
                            zIndexOffset={isBoarded ? 1000 : 0}
                        >
                            <Popup minWidth={220}>
                                <div style={{ textAlign: 'center', padding: '10px' }}>
                                    <h3 style={{ margin: '0 0 10px', color: '#1e293b' }}>{bus.name}</h3>
                                    <div style={{ marginBottom: '15px' }}>
                                        {isBoarded ? <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>🚀 EN ROUTE</div> : <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Arriving in 4 mins</div>}
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => { L.DomEvent.stopPropagation(e); setBoardedBusId(isBoarded ? null : bus.id); }}
                                        style={{ backgroundColor: isBoarded ? '#ef4444' : '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', width: '100%' }}
                                    >
                                        {isBoarded ? "Leave Bus" : "Board Bus"}
                                    </motion.button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {center && <CircleMarker center={center} radius={8} pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }} />}
            </MapContainer>
        </div>
    );
};

export default MapComponent;