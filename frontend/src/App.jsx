import React, { useState, useEffect, useCallback } from 'react';
import MapContainer from './components/MapContainer';
import { Search, Navigation, X, LocateFixed, MapPin, Car, CheckCircle, Loader2 } from 'lucide-react';
import './App.css';

function App() {
  const [isSearching, setIsSearching] = useState(false);
  const [startPoint, setStartPoint] = useState("9.9816, 76.2999");
  const [destination, setDestination] = useState("");
  const [buses, setBuses] = useState([]);
  const [results, setResults] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.9816, 76.2999]);
  const [suggestions, setSuggestions] = useState([]);

  const [boardedBusId, setBoardedBusId] = useState(null);
  const [autoStatus, setAutoStatus] = useState(null);
  const calculateLiveETA = (bus, polyline) => {
    if (!bus || !polyline) return "--";
    const remainingSteps = polyline.length - bus.step;
    // Let's assume each simulation step is roughly 30 seconds of real-world time
    const minutes = Math.ceil((remainingSteps * 30) / 60);
    return minutes > 0 ? `${minutes} mins` : "Arriving now";
  };
  // 1. Suggestions Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (destination.length > 1 && isSearching) {
        fetch(`http://127.0.0.1:8000/api/suggest?q=${destination}`)
          .then(res => res.json())
          .then(data => setSuggestions(data));
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [destination, isSearching]);

  // 2. Initial Markers (All buses in Kochi)
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/buses')
      .then(res => res.json())
      .then(data => setBuses(data));
  }, []);

  // 3. Handover Trigger
  const handleApproachDestination = useCallback(() => {
    if (!autoStatus && boardedBusId) {
      setAutoStatus('offered');
    }
  }, [autoStatus, boardedBusId]);

  const handleAcceptAuto = () => {
    setAutoStatus('pinging');
    setTimeout(() => setAutoStatus('confirmed'), 3500);
  };

  const handleGetCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setStartPoint(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
      setMapCenter([latitude, longitude]);
    });
  };

  // 4. Centralized Search Logic
  const handleFinalSearch = async (dLat, dLon, dName) => {
    try {
      // 💡 Trim to prevent %20 URL error
      const cleanCoords = startPoint.split(',').map(c => c.trim());
      const sLat = cleanCoords[0];
      const sLon = cleanCoords[1];

      // Step A: Get GTFS Data from Python Backend
      const backendResponse = await fetch('http://127.0.0.1:8000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: `${sLat},${sLon}`,
          dest_lat: dLat,
          dest_lon: dLon,
          dest_name: dName
        })
      });
      const transitData = await backendResponse.json();

      console.log("Backend Stop Data received:", transitData.stops); // DEBUG CHECK

      // Step B: Get Map Geometry (OSRM)
      const journeyUrl = `https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${dLon},${dLat}?overview=full&geometries=geojson`;
      const journeyRes = await fetch(journeyUrl);
      const journeyData = await journeyRes.json();

      let roadCoordinates = [];
      if (journeyData.routes?.[0]) {
        roadCoordinates = journeyData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      } else {
        roadCoordinates = [[parseFloat(sLat), parseFloat(sLon)], [dLat, dLon]];
      }

      // Reset trip states
      setBoardedBusId(null);
      setAutoStatus(null);

      // 🚀 THE CRITICAL FIX: Save stops into the results object
      setResults({
        ...transitData,
        polyline: roadCoordinates,
        stops: transitData.stops // Ensure this key matches your Python return
      });

      setMapCenter([dLat, dLon]);
      setIsSearching(false);
      setSuggestions([]);

    } catch (err) {
      console.error("Routing error:", err);
    }
  };

  return (
    <div className="app-container">

      {/* SEAMLESS HANDOVER BANNER */}
      {autoStatus && (
        <div className={`handover-banner ${autoStatus}`}>
          {autoStatus === 'offered' ? (
            <div className="banner-content">
              <Car size={18} className="emerald" />
              <span>Need an Auto for the last mile?</span>
              <div className="action-group">
                <button className="btn-no" onClick={() => setAutoStatus(null)}>No</button>
                <button className="btn-yes" onClick={handleAcceptAuto}>Yes, Ping</button>
              </div>
            </div>
          ) : (
            <div className="status-content">
              {autoStatus === 'pinging' ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle className="emerald" size={18} />}
              <span>{autoStatus === 'pinging' ? "Finding Kochi Autos..." : "Auto Reserved at Destination!"}</span>
            </div>
          )}
        </div>
      )}

      {/* SEARCH PANEL */}
      <div className={`search-panel ${isSearching ? 'expanded' : ''}`}>
        <div className="search-bar">
          <Search className="icon emerald" />
          <input
            type="text"
            placeholder="Search Kochi stops..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onFocus={() => setIsSearching(true)}
          />
          {isSearching && <X className="icon-btn small" onClick={() => { setIsSearching(false); setSuggestions([]); }} />}
        </div>

        {isSearching && suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((stop, idx) => (
              <div
                key={idx}
                className="suggestion-item"
                onClick={() => {
                  setDestination(stop.stop_name);
                  handleFinalSearch(stop.stop_lat, stop.stop_lon, stop.stop_name);
                }}
              >
                <MapPin size={16} className="emerald" />
                <span>{stop.stop_name}</span>
              </div>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="search-extra">
            <div className="input-group">
              <Navigation className="icon small" />
              <input
                type="text"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="sub-input"
              />
              <LocateFixed className="icon-btn small" onClick={handleGetCurrentLocation} />
            </div>
            <button className="route-btn" onClick={() => setIsSearching(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* 💡 THE BRIDGE: Passing routeStops correctly to MapContainer */}
      <MapContainer
        buses={buses}
        route={results?.polyline}
        routeStops={results?.stops} // 🚀 THIS PROP ADDS THE BLACK DOTS
        center={mapCenter}
        boardedBusId={boardedBusId}
        setBoardedBusId={setBoardedBusId}
        onApproachDestination={handleApproachDestination}
      />

      {/* RESULTS BOTTOM SHEET */}
      {results && (
        <div className="results-sheet">
          <div className="sheet-grabber"></div>
          <div className="sheet-header">
            <div className="header-main">
              <h3 className="dest-title">To {destination}</h3>
              <span className="status-badge pulse-green">Sync Active</span>
            </div>
            <button className="close-sheet" onClick={() => setResults(null)}><X size={20} /></button>
          </div>

          <div className="trip-summary-grid">
            <div className="summary-item">
              <span className="label">Total Time</span>
              <span className="value">{results.duration || '25 mins'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Fare Est.</span>
              <span className="value emerald">₹{results.options[0].price.replace('₹', '')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;