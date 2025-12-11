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

### Tech Stack

This project uses a modern, industry-standard full stack architecture for cross-platform mobile development and backend services.

---

#### Mobile App (Frontend)

**Framework**  
- React Native (Expo)  
  Single TypeScript codebase that runs on both iOS and Android. Expo simplifies development, device testing, and cloud builds.

**Language**  
- TypeScript  
  Used throughout the project for type safety and maintainability.

**Networking and State**  
- TanStack React Query  
  Manages data fetching, caching, background refetching, and server synchronization.  
- Zustand  
  Used for lightweight global and UI state management.

**Navigation**  
- React Navigation  
  Handles screen transitions, stacks, tabs, and overall navigation structure.

**Forms and Validation**  
- React Hook Form  
- Zod  
  Provides efficient form handling and schema-based validation.

**Styling**  
- NativeWind  
  Utility-based styling for React Native following Tailwind CSS style conventions.

---

#### Backend API (Server)

**Framework**  
- NestJS  
  A structured and scalable Node.js framework with built-in dependency injection and modular architecture.

**Language**  
- TypeScript  
  Ensures type consistency across frontend, backend, and database layers.

**Database**  
- SQLite for local development (via Prisma)  
  Simple file-based SQL database (`dev.db`) used during development. Can be swapped to PostgreSQL or another SQL engine in production.

**ORM**  
- Prisma  
  Used for database access, schema modeling, and type-safe queries.

**Authentication**  
- JWT-based authentication (NestJS + `@nestjs/jwt` + `passport-jwt`)  
  Handles user registration, login, token generation, and route protection.

---

#### DevOps and Tooling

**Source Control**  
- Git and GitHub

**Mobile Build System**  
- Expo EAS Build  
  Used to compile and distribute iOS and Android production builds, including the ability to create iOS builds without owning a physical Mac.

**Quality and Type Safety**  
- TypeScript strict mode  
- ESLint and Prettier for code consistency and formatting  
- Jest for automated testing

---

#### Architecture Summary

This project uses a single TypeScript codebase for both mobile platforms.  
Expo is used for development and cloud-based builds.  
React Native handles the UI and user interaction layer.  
React Query and Zustand manage both server and local state.  

The backend is built with NestJS and Prisma.  
Prisma provides schema management and database access into a SQL database (SQLite in dev, pluggable to PostgreSQL or others later).  
Authentication is handled with JWTs, allowing the mobile app to securely talk to the API.  
The system is designed for scalability, reliability, and maintainability.


