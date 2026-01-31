import pandas as pd
import math
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIVE_BUS_STATE: Dict[str, Dict] = {}

try:
    stops_df = pd.read_csv('gtfs/stops.txt')
    shapes_df = pd.read_csv('gtfs/shapes.txt')
    
    # Ensure numerical types for spatial calculations
    stops_df['stop_lat'] = pd.to_numeric(stops_df['stop_lat'])
    stops_df['stop_lon'] = pd.to_numeric(stops_df['stop_lon'])
    shapes_df['shape_pt_lat'] = pd.to_numeric(shapes_df['shape_pt_lat'])
    shapes_df['shape_pt_lon'] = pd.to_numeric(shapes_df['shape_pt_lon'])
    
    STOPS_LIST = stops_df[['stop_id', 'stop_name', 'stop_lat', 'stop_lon']].to_dict('records')
except Exception as e:
    print(f"Error loading GTFS files: {e}")
    STOPS_LIST = []

def init_simulation():
    for stop in STOPS_LIST:
        LIVE_BUS_STATE[str(stop['stop_id'])] = {
            "capacity": 40,
            "occupants": random.randint(5, 45)
        }

init_simulation()

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = math.radians(lat2-lat1), math.radians(lon2-lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))

class CrowdUpdate(BaseModel):
    stop_id: str
    status: str

@app.get("/api/buses")
async def get_buses():
    results = []
    for s in STOPS_LIST[:50]:
        state = LIVE_BUS_STATE.get(str(s['stop_id']), {"occupants": 10, "capacity": 40})
        results.append({
            "id": str(s['stop_id']),
            "number": s['stop_name'],
            "lat": s['stop_lat'],
            "lng": s['stop_lon'],
            "occupants": state['occupants'],
            "capacity": state['capacity']
        })
    return results

@app.post("/api/update-crowd")
async def update_crowd(data: CrowdUpdate):
    sid = str(data.stop_id)
    if sid not in LIVE_BUS_STATE:
        LIVE_BUS_STATE[sid] = {"capacity": 40, "occupants": 10}
    
    val = {"red": 45, "yellow": 25, "green": 5}
    LIVE_BUS_STATE[sid]['occupants'] = val.get(data.status, 10)
    return {"message": "Crowd level updated"}

@app.get("/api/suggest")
async def get_suggestions(q: str):
    if not q or len(q) < 2: return []
    matches = stops_df[stops_df['stop_name'].str.lower().str.contains(q.lower(), na=False)]
    return matches.head(5)[['stop_name', 'stop_lat', 'stop_lon', 'stop_id']].to_dict('records')

@app.post("/api/route")
async def get_route(data: dict):
    try:
        # Trim whitespace to avoid coordinate parsing errors
        s_lat, s_lon = map(float, data['start'].replace(" ", "").split(','))
        d_lat, d_lon = float(data['dest_lat']), float(data['dest_lon'])
        dest_name = data.get('dest_name', 'Destination')

        # 1. Dynamic Shape Selection
        dist_sq = (shapes_df['shape_pt_lat'] - d_lat)**2 + (shapes_df['shape_pt_lon'] - d_lon)**2
        best_shape_id = shapes_df.loc[dist_sq.idxmin(), 'shape_id']
        
        specific_shape = shapes_df[shapes_df['shape_id'] == best_shape_id].sort_values('shape_pt_sequence')
        road_polyline = specific_shape[['shape_pt_lat', 'shape_pt_lon']].values.tolist()

        # 2. 🚀 NEW: Filter stops strictly along this polyline
        # Threshold: 0.1km (100m) - adjust based on GTFS precision
        route_stops = []
        for stop in STOPS_LIST:
            # Only check stops if they are within the bounding box of the route to save CPU
            is_near_route = any(
                abs(stop['stop_lat'] - pt[0]) < 0.002 and abs(stop['stop_lon'] - pt[1]) < 0.002 
                for pt in road_polyline[::5] # Check every 5th point for speed
            )
            if is_near_route:
                route_stops.append(stop)

        distance = haversine(s_lat, s_lon, d_lat, d_lon)
        price = max(15, round(distance * 5))

        return {
            "options": [
                {"type": "Bus", "price": f"₹{price}", "time": f"{round(distance * 3)}m", "info": f"Route serving {dest_name}"},
                {"type": "Auto", "price": f"₹{round(distance * 15)}", "time": "3m", "info": "Last-mile sync enabled"}
            ],
            "polyline": road_polyline,
            "stops": route_stops # 👈 Passed to frontend for rendering
        }
    except Exception as e:
        print(f"Routing error: {e}")
        return {"options": [], "polyline": [], "stops": [], "error": str(e)}