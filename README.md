# QueueIQ v3 — Hospital Queue Intelligence System

> Real-time, doctor-aware wait time prediction for hospital queues.
> Stack: **Flask · PostgreSQL · scikit-learn · React · Vite**

---

## What's New in v3

- ✅ **Smart search** — instant autocomplete with scored ranking (text × 0.6 + distance × 0.3 + rating × 0.1)
- ✅ **Doctor system** — select a doctor, get adjusted predictions based on their popularity and consultation time
- ✅ **Doctor availability** — warnings when selected doctor is unavailable at chosen time
- ✅ **Healthcare theme** — clean white/blue UI, no dark mode, no neon
- ✅ **Realism layer** — doctor popularity index, avg consult time, 10,000+ visit data labels
- ✅ **Enhanced ML** — GradientBoosting with doctor-factor weighting
- ✅ **Loading shimmer** — skeleton screens while predictions load

---

## Project Structure

```
queueiq/
├── scripts/
│   ├── setup.ps1 / setup.sh      Install all dependencies
│   ├── dev.ps1   / dev.sh        Start both servers
│   ├── db.ps1    / db.sh         Database commands
│   └── test.ps1                  Run backend tests
│
├── frontend/
│   └── src/
│       ├── data/        hospitals.js (+ doctors), cities.js, queueHours.js
│       ├── engine/      predict.js   (doctor-aware, offline fallback)
│       ├── hooks/       useSmartSearch.js, useAuth, useGeolocation, ...
│       ├── services/    api.js
│       └── components/
│           ├── search/  SmartSearchBar.jsx   ← NEW
│           ├── doctors/ DoctorSelector.jsx   ← NEW
│           ├── ui/      tokens.js (light theme), Atoms.jsx, Sparkline.jsx
│           ├── layout/  Header, Sidebar, QueueTypeSelector
│           ├── tabs/    LiveTab, SimulatorTab, HistoryTab
│           └── auth/    AuthModal.jsx
│
└── backend/
    └── app/
        ├── models/   user.py, hospital.py (+Doctor model), feedback.py
        ├── routes/   auth, hospitals (+/doctors endpoint), predict (+doctorId), feedback
        ├── ml/       model.py  (doctor-aware GradientBoostingRegressor)
        └── services/ seed.py   (seeds all 6 hospitals + 22 doctors)
```

---

## Quick Start — Windows

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup.ps1

# Edit backend\.env — set DATABASE_URL and JWT_SECRET_KEY
notepad backend\.env

psql -U postgres -c "CREATE DATABASE queueiq_db;"
.\scripts\db.ps1 -Create -Seed
.\scripts\dev.ps1
```
Open http://localhost:5173

---

## Quick Start — Mac / Linux

```bash
bash scripts/setup.sh
nano backend/.env
createdb queueiq_db
bash scripts/db.sh create seed
bash scripts/dev.sh
```

---

## API Reference

| Method | Endpoint                          | Auth     | Description                    |
|--------|-----------------------------------|----------|--------------------------------|
| POST   | `/api/auth/register`              | —        | Create account                 |
| POST   | `/api/auth/login`                 | —        | Get JWT tokens                 |
| GET    | `/api/auth/me`                    | Required | Current user                   |
| GET    | `/api/hospitals/`                 | —        | List + distance sort + doctors |
| GET    | `/api/hospitals/<id>`             | —        | Detail + queues + doctors      |
| GET    | `/api/hospitals/<id>/profile`     | —        | 24h crowd chart (doctor-aware) |
| GET    | `/api/hospitals/<id>/doctors`     | —        | Doctor list for a hospital     |
| POST   | `/api/predict/`                   | Optional | ML prediction (+ doctorId)     |
| POST   | `/api/feedback/`                  | Required | Submit actual wait             |
| GET    | `/api/feedback/mine`              | Required | Feedback history               |
| GET    | `/api/health`                     | —        | Health check                   |

### Predict request body
```json
{
  "hospitalId":  "apollo_greams",
  "queueKey":    "doctor",
  "hour":        10,
  "dayOfWeek":   1,
  "peopleAhead": 5,
  "doctorId":    "dr_sharma_apollo"
}
```

---

## Environment Variables

### `backend/.env`
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/queueiq_db
JWT_SECRET_KEY=your-long-random-secret-32-chars-minimum
SECRET_KEY=another-flask-secret
CORS_ORIGINS=http://localhost:5173
FLASK_ENV=development
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000
```
