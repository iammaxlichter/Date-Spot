# Date-Spot — MVP & Feature Roadmap

Date-Spot is a **map-first dating and relationship app** built around real places, real dates, and meaningful connections. Rather than endless swiping, the app focuses on **discovering great date spots**, **rating real experiences**, and **matching through shared preferences**.

> Unlike “the app designed to be deleted,” Date-Spot is **the app designed to stay** — for daters, couples, and anyone exploring new places.

---

## MVP (v1)

### 1. Interactive Map of Date Spots
- Full-screen map view
- Users can see nearby date spots based on location
- A place includes:
  - `name`
  - `latitude`, `longitude`
  - optional `address`
  - rating aggregates (`atmosphereAverage`, `dateAverage`, `totalRatings`)

### 2. User Ratings
Each user can submit a rating for a spot, including:
- Atmosphere Score (1–10)
- Date Score (1–10)
- Recommend (true/false)
- Notes (optional)

The backend computes global averages so spots can be ranked and visually categorized.

### 3. Smart Map Icons (Spot Categorization)
Spots display different icons depending on their standout qualities:

- Atmosphere icon → atmosphere score is highest  
- Heart icon → date experience score is highest  
- Combined icon → both scores are high  

This helps users instantly understand what a location is ideal for.

---

## Planned Features (Post-MVP)

### 4. Queue-Based Matching System
A swipe-less matchmaking feature:
- Users “join the dating queue”
- Each user defines preference criteria (examples):
  - gender(s)
  - age range
  - height preferences
  - religion/values
  - “who pays on first date”
  - personality or lifestyle tags
- Two users match **only if both meet each other’s criteria**

Once matched:
- They enter an in-app messenger
- They can pick a date spot together and plan the outing

### 5. Partner Mode (For Couples)
Users can optionally link accounts with their partner.

Features include:
- “My Partner Map” → shows only the places both have visited
- Shared date history:
  - where you went  
  - what each person rated it  
  - notes/memories  
- Optionally keep this private between the two partners

Designed for long-term couples who want to track their relationship journey.

### 6. Followers & Social Map Layer
A lightweight social graph:
- Users can follow others
- Map filters for:
  - Spots visited by people you follow  
  - Spots visited by your followers  

Useful for discovering places recommended by friends, creators, or locals.

### 7. User Modes
- **Dating Mode**
  - Queue-based matching  
  - Messaging  
  - Map of date ideas  

- **Partner Mode**
  - Linked couple account  
  - Shared map and history  
  - No participation in dating  

---

## Vision Summary

Date-Spot combines:
- real-world discovery  
- matchmaking  
- relationship tools  

into one cohesive experience.

The long-term goal is to be **the place where relationships begin, grow, and are remembered** — not a disposable dating app.

<br><br><br>

## Tech Stack

This project uses a modern, production-ready architecture for cross-platform mobile development backed by a managed backend-as-a-service.

---

### Mobile App (Frontend)

**Framework**
- **React Native (Expo)**  
  A single TypeScript codebase that runs on both iOS and Android. Expo simplifies local development, device testing, and cloud-based builds.

**Language**
- **TypeScript**  
  Used throughout the app for type safety, maintainability, and predictable data flow.

**Data Fetching and State**
- **Supabase JavaScript Client**  
  Handles authentication, database reads/writes, and session management directly from the mobile app.  
- **TanStack React Query**  
  Manages asynchronous data fetching, caching, background refetching, and server state synchronization.  
- **Zustand**  
  Lightweight state management for UI and ephemeral client-side state.

**Navigation**
- **React Navigation**  
  Manages screen stacks, transitions, and overall navigation flow.

**Forms and Validation**
- **React Hook Form**  
- **Zod**  
  Provides efficient form handling and schema-based validation.

**Styling**
- **NativeWind**  
  Utility-first styling for React Native using Tailwind CSS conventions.

---

### Backend and Data Layer

**Backend Platform**
- **Supabase**  
  A managed backend providing authentication, PostgreSQL database, row-level security, and RESTful access without maintaining a custom server.

**Database**
- **PostgreSQL (Supabase-managed)**  
  Production-grade relational database with row-level security policies enforced at the database level.

**Authentication**
- **Supabase Auth (Email + Password)**  
  Handles user registration, login, session persistence, and secure token management.  
  Email confirmations are disabled to allow immediate signup and login.

**Authorization**
- **Row Level Security (RLS)**  
  Ensures users can only access and modify their own data directly at the database layer.

---

### DevOps and Tooling

**Source Control**
- **Git and GitHub**

**Mobile Build System**
- **Expo EAS Build**  
  Used to compile and distribute iOS and Android builds, including cloud-based iOS builds without requiring a local Mac.

**Quality and Type Safety**
- **TypeScript (strict mode)**  
- **ESLint and Prettier** for code consistency and formatting  
- **Jest** for automated testing

---

### Architecture Summary

The mobile app is built with React Native and Expo, sharing a single TypeScript codebase across platforms.  
Supabase replaces a traditional backend API by providing authentication, PostgreSQL storage, and authorization directly to the client.  
Row-level security policies enforce data isolation per user, eliminating the need for custom backend auth logic.  

The architecture is designed to be scalable, secure, and maintainable while minimizing operational complexity.



