# 📝 SelfTrack — Personal Productivity & Progress Dashboard

> A full-featured, Firebase-backed React productivity app for tracking tasks, coding stats, certifications, and daily focus sessions — all in one beautifully designed dashboard.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Email/password Sign Up & Login powered by Firebase Auth |
| 📋 **Task Manager** | Create, edit, delete, archive, and drag-and-drop reorder tasks |
| 📅 **Calendar View** | Visual calendar showing tasks by due date |
| 📊 **Analytics** | Charts & graphs for task completion, streaks, and productivity trends |
| 🍅 **Pomodoro Timer** | Built-in focus timer with work/break sessions |
| 🏆 **Certificates** | Upload and manage professional certificates (via Cloudinary) |
| 💻 **Coding Platforms** | Live stats from LeetCode, GitHub, Codeforces, HackerRank, and GeeksForGeeks |
| 👤 **Profile** | Editable user profile with photo upload, resume, skills and links |
| ⚙️ **Settings** | Theme, notifications, and app preferences |
| 🤖 **AI Chatbot** | Integrated AI assistant powered by Groq API |
| 📈 **Streak Tracking** | Daily task streak counter to build consistent habits |

---

## 🛠️ Tech Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| **React** | 19.x | UI framework |
| **React Router DOM** | 7.x | Client-side routing |
| **Framer Motion** | 12.x | Animations and transitions |
| **Chart.js + react-chartjs-2** | 4.x / 5.x | Analytics charts |
| **React Icons** | 5.x | Icon library |
| **React Calendar** | 6.x | Calendar component |
| **React Circular Progressbar** | 2.x | Circular progress UI |
| **React Toastify** | 11.x | Toast notifications |
| **@hello-pangea/dnd** | 18.x | Drag-and-drop task reordering |
| **date-fns** | 4.x | Date utilities |
| **TailwindCSS** | 4.x | Utility-first CSS via Vite plugin |

### Backend / Services

| Service | Purpose |
|---|---|
| **Firebase Auth** | User authentication |
| **Cloud Firestore** | Real-time database for tasks, profile, certificates |
| **Firebase Storage** | File storage |
| **Cloudinary** | PDF resume and certificate image uploads |
| **Groq API** | AI Chatbot (LLaMA-based) |
| **alfa-leetcode-api** | Public CORS-friendly API for LeetCode stats |

### Build Tools

| Tool | Purpose |
|---|---|
| **Vite 8** | Lightning-fast dev server and bundler |
| **ESLint** | Code linting with React-specific rules |

---

## 📁 Project Structure

```
notes_self_track-main/
├── public/                          # Static assets served as-is
├── src/
│   ├── main.jsx                     # React entry point
│   ├── App.jsx                      # Root component — routing and providers
│   ├── index.css                    # Global styles and design tokens
│   │
│   ├── pages/                       # Route-level page components (lazy-loaded)
│   │   ├── Login.jsx                # Public: login form
│   │   ├── Signup.jsx               # Public: registration form
│   │   ├── Dashboard.jsx            # Home: stats, today's tasks, quotes
│   │   ├── Tasks.jsx                # Full task list with filters and DnD
│   │   ├── Calendar.jsx             # Calendar view of tasks by due date
│   │   ├── Analytics.jsx            # Charts and productivity analytics
│   │   ├── Pomodoro.jsx             # Pomodoro focus timer page
│   │   ├── Profile.jsx              # User profile editor
│   │   ├── Certificates.jsx         # Certificate upload and gallery
│   │   ├── Platforms.jsx            # Coding platform stats aggregator
│   │   └── Settings.jsx             # App settings and preferences
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   ├── ProtectedLayout.jsx      # Auth guard wrapper for protected routes
│   │   ├── TaskCard.jsx             # Individual task card (edit/delete/complete)
│   │   ├── TaskForm.jsx             # Add/edit task modal form
│   │   ├── Statistics.jsx           # Stats summary grid (total, done, pending)
│   │   ├── ProgressBar.jsx          # Daily progress bar + streak display
│   │   ├── Charts.jsx               # Chart.js chart components
│   │   ├── CodingStats.jsx          # LeetCode/GitHub/competitive coding stats
│   │   ├── Calendar.jsx             # Calendar UI component
│   │   ├── Pomodoro.jsx             # Pomodoro timer component
│   │   ├── SearchBar.jsx            # Global task search input
│   │   └── ChatBot.jsx              # Floating AI chatbot widget
│   │
│   ├── context/                     # React Context providers
│   │   ├── AuthContext.jsx          # Auth state, profile, login/logout helpers
│   │   └── TaskContext.jsx          # Task CRUD, streak logic, Firestore sync
│   │
│   ├── firebase/
│   │   └── firebaseConfig.js        # Firebase app initialization
│   │
│   ├── hooks/
│   │   └── useLocalStorage.js       # Custom hook: persisted localStorage state
│   │
│   └── utils/
│       └── helpers.js               # Utility functions: greeting, quotes, stats
│
├── .env                             # Environment variables (see setup below)
├── .gitignore                       # Git ignore rules
├── firebase.json                    # Firebase hosting config
├── firestore.rules                  # Firestore security rules
├── storage.rules                    # Firebase Storage security rules
├── eslint.config.js                 # ESLint configuration
├── vite.config.js                   # Vite build config with code splitting
├── index.html                       # HTML entry point
└── package.json                     # Dependencies and scripts
```

---

## 🗺️ Application Routes

| Route | Access | Component | Description |
|---|---|---|---|
| `/login` | Public | `Login.jsx` | User login |
| `/signup` | Public | `Signup.jsx` | New account registration |
| `/dashboard` | Protected | `Dashboard.jsx` | Main home screen |
| `/tasks` | Protected | `Tasks.jsx` | All tasks management |
| `/calendar` | Protected | `Calendar.jsx` | Calendar view |
| `/analytics` | Protected | `Analytics.jsx` | Charts and insights |
| `/pomodoro` | Protected | `Pomodoro.jsx` | Focus timer |
| `/profile` | Protected | `Profile.jsx` | Edit user profile |
| `/certificates` | Protected | `Certificates.jsx` | Manage certificates |
| `/platforms` | Protected | `Platforms.jsx` | Coding platform stats |
| `/settings` | Protected | `Settings.jsx` | App preferences |
| `/*` | — | Redirect | Redirects to `/dashboard` |

---

## 🔐 Firestore Security Model

All user data is private and scoped to the authenticated user's UID:

```
/users/{userId}                  →  User profile document
/users/{userId}/tasks/           →  Task sub-collection
/users/{userId}/certificates/    →  Certificate sub-collection
```

Only the authenticated user matching `{userId}` can read or write their own data. Everything else is denied by default.

---

## ⚙️ Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- A [Firebase](https://firebase.google.com/) project with **Authentication** and **Firestore** enabled
- A [Cloudinary](https://cloudinary.com/) account (free tier works)
- A [Groq](https://groq.com/) API key (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/notes_self_track.git
cd notes_self_track
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Groq AI (Chatbot)
VITE_GROQ_API_KEY=your_groq_api_key

# Cloudinary (Certificate / Resume Uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

> **Warning:** Never commit your `.env` file. It is already listed in `.gitignore`.

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Available Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Start Vite dev server with HMR |
| Build | `npm run build` | Production build with code splitting |
| Preview | `npm run preview` | Preview production build locally |
| Lint | `npm run lint` | Run ESLint checks |

---

## 🏗️ Build & Optimization

Vite is configured with **manual chunk splitting** to keep bundle sizes optimal:

| Chunk | Contents |
|---|---|
| `vendor-react` | React, ReactDOM, React Router |
| `vendor-firebase` | Firebase core and SDKs |
| `vendor-firestore` | Firestore module (largest Firebase piece) |
| `vendor-ui` | Framer Motion, React Icons |
| `vendor-charts` | Chart.js, react-chartjs-2 |
| `vendor-misc` | Calendar, Toastify, Progressbar, DnD, date-fns |

All **page-level components are lazy-loaded** via `React.lazy()` for fast initial load times.

---

## 🧪 Linting

ESLint is configured with:
- `@eslint/js` recommended rules
- `eslint-plugin-react-hooks` for hooks best practices
- `eslint-plugin-react-refresh` for Vite HMR compatibility

Run:
```bash
npm run lint
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Built with React, Firebase, and Vite
