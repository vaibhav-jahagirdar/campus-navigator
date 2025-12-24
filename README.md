# Campus Navigator

A full-stack smart campus navigation system with real-time IoT dashboards.

## Problem
Large campuses rely on static maps and notice boards, which fail to provide reliable navigation and real-time availability information for students, staff, parents, and visitors.

## Solution
Campus Navigator provides:
- Outdoor navigation using map-based routing
- Indoor navigation for buildings and classrooms
- Real-time dashboards for library seating, parking slots, and events
- Admin-controlled access for updates and monitoring

## Tech Stack
- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB
- Real-time: Socket.IO
- IoT Integration: Python scripts + Raspberry Pi (simulated for demo)

## Architecture Overview
- Frontend consumes REST APIs and Socket.IO events
- Backend validates incoming sensor data and broadcasts updates
- WebSocket server handles real-time communication
- MongoDB stores persistent state and configurations

## Key Features
- Outdoor navigation using shortest-path routing
- Indoor navigation with predefined node paths
- Real-time library seat availability
- Real-time parking slot status
- Event dashboard with admin access

## Live Demo
https://campus-navigator-v.vercel.app

## Portfolio
https://vjahagirdar.vercel.app

## Notes
This project was built end-to-end as a learning-focused, production-style system, emphasizing real data flow, system behavior, and debugging over demo-level CRUD examples.
