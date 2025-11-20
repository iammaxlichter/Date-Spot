### Tech Stack

This project uses a modern, industry standard full stack architecture for cross platform mobile development and backend services.

#### Mobile App (Frontend)

**Framework**  
- React Native (Expo)  
  Provides a single TypeScript codebase that runs on both iOS and Android. Expo simplifies development, device testing, and cloud builds.

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
  Provides efficient form handling and schema based validation.

**Styling**  
- NativeWind  
  Utility based styling for React Native following Tailwind CSS style conventions.

---

#### Backend API (Server)

**Framework**  
- NestJS  
  A structured and scalable Node.js framework with built in dependency injection and modular architecture.

**Language**  
- TypeScript  
  Ensures type consistency across frontend, backend, and database layers.

**Database**  
- PostgreSQL (via Supabase)  
  Provides a hosted SQL database with reliability, migrations, and developer tooling.

**ORM**  
- Prisma  
  Used for database access, schema modeling, and type safe queries.

**Authentication (optional)**  
- Supabase Auth or JWT based authentication  
  Provides secure identity, session handling, and OAuth support if required.

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

**Monitoring (optional)**  
- Sentry for error tracking  
- PostHog for analytics and event tracking

---

#### Architecture Summary

This project uses a single TypeScript codebase for both mobile platforms.  
Expo is used for development and cloud based builds.  
React Native handles the UI and user interaction layer.  
React Query and Zustand manage both server and local state.  
The backend is built with NestJS and connects to a PostgreSQL database managed through Supabase.  
Prisma provides schema management and database access.  
The system is designed for scalability, reliability, and maintainability.
