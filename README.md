# 📅 TransVolt Calendar

A full-stack, high-fidelity **Google Calendar clone** built with modern web technologies. Features a responsive UI with month, week, and day views, event CRUD with drag interactions, recurring events, overlap detection, and JWT authentication.

![TransVolt Calendar](https://img.shields.io/badge/TransVolt-Calendar-4285F4?style=for-the-badge&logo=google-calendar&logoColor=white)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite + TypeScript)     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Auth     │  │ Calendar │  │ Event    │  │ Layout       │   │
│  │ Pages    │  │ Views    │  │ Modal/   │  │ Header/      │   │
│  │ Login/   │  │ Month/   │  │ Popover  │  │ Sidebar/     │   │
│  │ Register │  │ Week/Day │  │          │  │ MiniCalendar │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │               │           │
│  ┌────┴──────────────┴──────────────┴───────────────┴─────┐    │
│  │              Context Layer (Auth + Calendar)            │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │ Axios HTTP Client                  │
└───────────────────────────┼────────────────────────────────────┘
                            │ REST API
┌───────────────────────────┼────────────────────────────────────┐
│                   Backend (Express + TypeScript)                │
│  ┌────────────────────────┴──────────────────────────────┐     │
│  │                    API Routes                          │     │
│  │  /api/auth  (register, login, me)                     │     │
│  │  /api/events (CRUD + overlap + recurrence)            │     │
│  └────┬──────────────┬───────────────────────────────────┘     │
│  ┌────┴────┐  ┌──────┴──────┐  ┌──────────────┐               │
│  │ JWT Auth│  │ Validation  │  │ Utilities    │               │
│  │ Middle- │  │ (express-   │  │ - overlap    │               │
│  │ ware    │  │  validator) │  │ - recurrence │               │
│  └─────────┘  └─────────────┘  └──────────────┘               │
│                           │                                     │
│  ┌────────────────────────┴──────────────────────────────┐     │
│  │              Mongoose ODM (Models)                     │     │
│  │  User: { name, email, password(hashed) }              │     │
│  │  Event: { title, times, color, recurrence, ... }      │     │
│  └────────────────────────┬──────────────────────────────┘     │
└───────────────────────────┼────────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │    MongoDB      │
                   │  (Database)     │
                   └─────────────────┘
```

---

## 🚀 Tech Stack

| Layer      | Technology               | Why                                                                 |
|------------|--------------------------|---------------------------------------------------------------------|
| Frontend   | React 19 + TypeScript    | Component-based UI, type safety, rich ecosystem                    |
| Bundler    | Vite 8                   | Lightning-fast HMR, optimal build times                            |
| Backend    | Express + TypeScript     | Lightweight, flexible, excellent middleware support                 |
| Database   | MongoDB + Mongoose       | Flexible schema for events/recurrence, easy querying               |
| Auth       | JWT (jsonwebtoken)       | Stateless authentication, easy to implement and scale              |
| Password   | bcryptjs                 | Industry-standard password hashing                                 |
| HTTP       | Axios                    | Promise-based HTTP client with interceptors                        |
| Styling    | Vanilla CSS              | Full control, CSS custom properties, no framework bloat            |

---

## 📦 Setup Instructions

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally (or a MongoDB Atlas connection string)
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone <repository-url>
cd transvolt

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Copy the env template
cp backend/.env.example backend/.env

# Edit backend/.env with your values:
# MONGODB_URI=mongodb://localhost:27017/transvolt-calendar
# JWT_SECRET=your-secret-key-here
# PORT=5000
```

### 3. Start Development Servers

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## 📡 API Documentation

### Authentication

| Method | Endpoint           | Body                              | Description            |
|--------|--------------------|-----------------------------------|------------------------|
| POST   | `/api/auth/register` | `{ name, email, password }`       | Register new user      |
| POST   | `/api/auth/login`    | `{ email, password }`             | Login, returns JWT     |
| GET    | `/api/auth/me`       | —                                 | Get current user (auth)|

### Events

All event routes require `Authorization: Bearer <token>` header.

| Method | Endpoint              | Query/Body                        | Description                  |
|--------|-----------------------|-----------------------------------|------------------------------|
| GET    | `/api/events`         | `?start=ISO&end=ISO`              | Get events in date range     |
| POST   | `/api/events`         | `{ title, startTime, endTime, ... }` | Create event              |
| PUT    | `/api/events/:id`     | `{ title, startTime, ... }`       | Update event                 |
| DELETE | `/api/events/:id`     | `{ deleteMode?, recurringEventId? }` | Delete event              |

### Overlap Detection

When creating/updating an event, the API checks for time conflicts. If found, it returns:
```json
{
  "message": "This event overlaps with existing events",
  "overlappingEvents": [...],
  "requiresConfirmation": true
}
```
The frontend shows a warning dialog and allows the user to "Save Anyway" with `forceCreate: true`.

---

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  password: String (required, bcrypt hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Event Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  title: String (required, max 200),
  description: String (max 2000),
  startTime: Date (required, UTC),
  endTime: Date (required, UTC),
  allDay: Boolean (default: false),
  color: String (default: '#4285F4'),
  location: String (max 500),
  
  // Recurrence
  isRecurring: Boolean (default: false),
  recurrenceRule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: Number (default: 1),
    endDate: Date (optional),
    daysOfWeek: [Number] (0-6, optional),
    count: Number (optional)
  },
  recurringEventId: ObjectId (ref: Event),
  isException: Boolean (default: false),
  originalDate: Date,
  excludedDates: [Date],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ userId: 1, startTime: 1, endTime: 1 }` — Efficient range queries
- `{ userId: 1, isRecurring: 1 }` — Fast recurring event lookup

---

## 🧠 Business Logic & Edge Cases

### Timezone Handling
- All timestamps stored in **UTC** in MongoDB
- Frontend converts to/from local timezone using native `Date` and `Intl.DateTimeFormat`
- `datetime-local` inputs naturally work with user's local time

### Recurring Events
- Parent event stores the recurrence rule
- Instances are **computed on-the-fly** during GET queries (not stored individually)
- Editing a single instance creates an **exception event** with `isException: true`
- Deleting a single instance adds the date to `excludedDates` on the parent
- Deleting "all events" removes parent + all exceptions

### Overlap Detection
- Only checked for timed events (not all-day)
- Uses time range intersection: `startA < endB AND endA > startB`
- Returns conflicting events in the response for user review
- Can be overridden with `forceCreate` / `forceUpdate`

### Event Validation
- `endTime > startTime` enforced at model level
- Title required, max 200 characters
- Minimum event duration rendered as 15 minutes visually

### Offline Draft Support
- Event form data auto-saved to `localStorage` during creation
- Restored on next visit if the user navigates away before saving
- Cleared on successful save

---

## 🎨 Animations & Interactions

| Interaction | Implementation |
|---|---|
| **Modal open/close** | CSS `@keyframes scaleIn` with `transform: scale` and `opacity` transitions |
| **Popover appear** | Same scale animation, positioned relative to clicked event |
| **View transitions** | Smooth content swap via React state-driven rendering |
| **Auth page** | Floating decorative circles with CSS `float` animation, gradient background |
| **Dropdown menus** | `slideDown` animation with `translateY` and `opacity` |
| **Buttons/hover** | `transition` on `background`, `box-shadow`, and `transform` |
| **Current time line** | Red indicator line with dot, updated every minute via `setInterval` |
| **Event chips** | Hover opacity change, smooth color transitions |
| **Toggle switch** | CSS `transform: translateX` for thumb animation |
| **Toast notifications** | `slideUp` animation from bottom center |
| **Loading spinner** | CSS `@keyframes spin` with `rotate` transform |
| **Auth card entry** | `scaleIn` with spring-like cubic-bezier timing |

All animations use CSS `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard easing) for natural feel.

---

## ✨ Features

### Core
- [x] Month, Week, Day calendar views
- [x] Create, edit, delete events
- [x] Event click popover with details
- [x] Full event creation/editing modal
- [x] Color-coded events (12 Google Calendar colors)
- [x] All-day event support
- [x] Current time indicator (red line)

### Authentication
- [x] Email/password registration
- [x] JWT-based login sessions
- [x] Persistent sessions via localStorage
- [x] User avatar with sign-out

### Recurring Events
- [x] Daily, weekly, monthly, yearly recurrence
- [x] Edit single instance vs all instances
- [x] Delete single instance vs all instances
- [x] Exception events for individual modifications

### Advanced
- [x] Overlap detection with conflict warnings
- [x] Offline draft support (localStorage)
- [x] Responsive layout
- [x] Mini calendar navigation
- [x] Smooth animations throughout

---

## 🔮 Future Enhancements

1. **Drag-and-drop** — Full @dnd-kit integration for moving events between time slots
2. **OAuth** — Google/GitHub social login
3. **Multiple calendars** — Color-coded calendar groups with toggle visibility
4. **Reminders/Notifications** — Browser notifications before events
5. **Dark mode** — Full dark theme with CSS custom property swap
6. **Search** — Full-text search across events
7. **Sharing** — Share calendar with other users
8. **ICS Import/Export** — Standard calendar file format support
9. **Keyboard shortcuts** — Navigate with arrow keys, create with 'C'
10. **Mobile app** — React Native or PWA with offline-first sync

---

## 📁 Project Structure

```
transvolt/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts              # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT authentication
│   │   ├── models/
│   │   │   ├── User.ts            # User schema
│   │   │   └── Event.ts           # Event schema + recurrence
│   │   ├── routes/
│   │   │   ├── auth.ts            # Auth endpoints
│   │   │   └── events.ts          # Event CRUD endpoints
│   │   ├── utils/
│   │   │   ├── overlap.ts         # Overlap detection
│   │   │   └── recurrence.ts      # Recurring event expansion
│   │   └── index.ts               # Server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.ts           # Configured HTTP client
│   │   │   ├── auth.ts            # Auth API calls
│   │   │   └── events.ts          # Event API calls
│   │   ├── components/
│   │   │   ├── Calendar/
│   │   │   │   ├── MiniCalendar.tsx
│   │   │   │   ├── MonthView.tsx
│   │   │   │   ├── WeekView.tsx
│   │   │   │   └── DayView.tsx
│   │   │   ├── Event/
│   │   │   │   ├── EventModal.tsx
│   │   │   │   └── EventPopover.tsx
│   │   │   └── Layout/
│   │   │       ├── Header.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── CalendarContext.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── styles/
│   │   │   ├── variables.css
│   │   │   ├── global.css
│   │   │   ├── auth.css
│   │   │   ├── components.css
│   │   │   └── calendar.css
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── colors.ts
│   │   │   └── dateUtils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
├── README.md
└── package.json
```

---

## 📄 License

MIT
