# SmartMove – Public Transport Simulation & Crowd Reporting (MVP)

SmartMove is a prototype smart-city transit application that explores solutions to the "black box" problem in public transport — where commuters lack real-time visibility into bus arrival, occupancy, and last-mile safety.

This project focuses on simulating real-time transit tracking and crowd reporting, while experimenting with concepts for safer and more predictable commuting.

---

## 🚀 Core Features (MVP)

### 🚌 Live Bus Tracking

* Simulated real-time bus movement using GPS coordinates
* Interactive map built with OpenStreetMap and Leaflet
* Visual representation of routes and moving buses

### 👥 Crowd Reporting System

* Users can report bus occupancy using a simple interface:

  * 🟢 Low
  * 🟡 Medium
  * 🔴 High
* Crowd data updates dynamically on the map
* Demonstrates a crowdsourced approach to transit awareness

### 🎨 Dynamic Map Visualization

* Bus markers change color based on occupancy data
* Real-time UI updates using React state management

---

## 🧪 Experimental Concepts (In Progress)

These features are part of the long-term vision but are not fully implemented in the current MVP:

### 🔐 Anonymous Handshake System

* Concept for secure, privacy-preserving ride matching
* Intended to connect commuters with verified last-mile transport
* Focus on minimizing data exposure while ensuring safety

### 🌃 Safety-Oriented Routing

* Exploration of safer walking routes using OpenStreetMap data
* Emphasis on well-lit and active areas rather than shortest paths

### 🚑 Emergency Routing Priority

* Concept for prioritizing emergency vehicles in transit networks

---

## 🛠️ Tech Stack

| Component        | Technology                 |
| ---------------- | -------------------------- |
| Frontend         | React (Vite), Tailwind CSS |
| Backend          | Python (FastAPI), Uvicorn  |
| Mapping          | Leaflet.js, OpenStreetMap  |
| State Management | React Hooks / Context API  |
| Simulation       | Python background tasks    |

---

## ⚙️ How It Works (MVP)

1. Simulated buses move along predefined routes using backend logic
2. Frontend fetches and displays real-time positions on the map
3. Users submit crowd levels through the UI
4. Data is aggregated and reflected visually across all clients

---

## ⚠️ Project Status

This project is an MVP/prototype.

* Core functionality (bus tracking and crowd reporting) is partially implemented
* Advanced features like anonymous ride matching and safety routing are conceptual and under development
* The system currently uses simulated data rather than real-world integration

---

## 💡 Motivation

Public transport systems often lack transparency. Commuters cannot easily predict:

* whether a bus is overcrowded
* how long it will take to arrive
* how safe their journey will be after getting off

SmartMove explores how lightweight, crowdsourced data and mapping tools can improve this experience.

---

## 🚧 Future Improvements

* Integration with real-time transit APIs
* More accurate GPS tracking and route handling
* Implementation of anonymous handshake protocol
* Safety-based route scoring system
* Mobile app version (Flutter)
* Scalable backend for real-time updates

---

## 📌 Notes

This project was developed as an exploration of smart-city transit systems and is not production-ready.
