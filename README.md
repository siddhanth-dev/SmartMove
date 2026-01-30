# SmartMove

SmartMove is a smart-city transit layer designed to solve the "Black Box" problem of public transport. By utilizing Passive Detection and Anonymous Handshakes, we bridge the gap between bus arrival, crowd density, and safe last-mile connectivity.
🚀 The Core "Syncs"
1. The Occupancy Layer (Sync 1)

    Problem: You don't know if a bus is full until it passes you.

    Solution: Software-Based Crowdsourcing. * Passive Detection: The app matches user GPS/Velocity to known bus routes.

        The One-Tap Prompt: Users on the bus receive a low-friction notification to report crowd status (🟢, 🟡, 🔴).

        Global Update: Data is aggregated via FastAPI and updated on the map for all waiting commuters.

2. The Private Handshake (Sync 2)

    Problem: Safety concerns for women and vulnerable commuters during the "last mile" (bus stop to home).

    Solution: Anonymous Intent.

        Commuters pre-verify their arrival with a private "ride-needed" token.

        No personal data or exact stop is broadcast.

        Verified drivers/rickshaws receive a "pickup nearby" alert, locking in a safe ride before the user even steps off the bus.

3. Safety-Luminous Routing

    Problem: The shortest path isn't always the safest.

    Solution: An Overlay UI that uses OpenStreetMap tags (lights/open shops) to highlight well-lit walking paths to transit hubs.

🛠️ Tech Stack
Component	Technology
Frontend	React (Vite), Tailwind CSS, Lucide Icons
Backend	Python (FastAPI), Uvicorn
Mapping	Leaflet.js / OpenStreetMap API
State Management	React Hooks (Context API for real-time updates)
Simulation	Python background tasks for GPS bus movement
📸 MVP Features (Priority)

    [x] Live Map: Real-time bus tracking using simulated GPS coordinates.

    [x] Crowd Reporting: Reactive UI for users to report bus occupancy.

    [x] Dynamic Map Icons: Bus markers change color based on real-time crowd data.

    [ ] Handshake Protocol: (In Development) Anonymous token exchange for last-mile drivers.

    [ ] Emergency Priority: Route optimization for emergency vehicles (Ambulance/Fire).
