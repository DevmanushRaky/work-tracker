# Work Tracker

A modern Next.js application for tracking employee attendance, daily and monthly performance, and personal profile management.  
Built with Next.js, MongoDB, and a clean, component-driven UI.

---

## 🚀 Getting Started

### 1. **Install dependencies**
```bash
npm install
# or
yarn install
```

### 2. **Set up environment variables**

Create a `.env.local` file in the root with the following variables:

```env
# MongoDB connection string
MONGODB_URI=your_mongodb_connection_string

# MongoDB database name
MONGODB_DB=your_database_name

# JWT secret for signing tokens
JWT_SECRET=your_jwt_secret
```

> **Tip:** Never commit your `.env.local` file to version control. Each developer should set their own values.

### 3. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂️ Project Structure

```
src/
  app/
    page.tsx           # Landing page
    profile/           # Profile management (profile/page.tsx)
    daily/             # Daily logs (daily/page.tsx)
    monthly/           # Monthly reports (monthly/page.tsx)
    api/               # API routes (RESTful endpoints)
      auth/            # Auth endpoints (login, register, reset-password, check-mail)
      profile/         # Profile API (GET, PATCH)
      daily/           # Daily logs API (GET, POST, PATCH, DELETE)
      monthly/         # Monthly summary API (GET, POST)
  components/
    common/            # Shared components (Navbar, etc.)
    ui/                # UI primitives (Button, Card, Dialog, etc.)
  hooks/
    useAuth.tsx        # Authentication context and hook
  models/
    User.ts            # Mongoose User model
  lib/
    dbConnect.ts       # MongoDB connection helper
    jwt.ts             # JWT helpers
```

---

## 🧑‍💻 Main Features

### **Authentication**
- Register, login, and logout with JWT-based authentication.
- Auth modal with password reset and email check.
- Auth state is managed globally via React context (`useAuth`).

### **Profile Management**
- View and edit your profile (name, phone, department, etc.).
- Manage salary history (add, edit, delete).
- Track earned leave and leave allowance.

### **Daily Logs**
- Log daily attendance, in/out time, standup, report, and remarks.
- Edit or delete previous daily logs.
- Filter logs by date, attendance type, and working hours.

### **Monthly Reports**
- View monthly summaries: working days, hours, leaves, holidays, weekends, and earned leave.
- Analyze your performance with progress bars and analysis.
- Browse daily breakdowns for each month.

### **Navigation**
- Responsive Navbar with links to Home, Daily, Monthly, and Profile.
- Navbar updates automatically based on authentication state.

---

## 🛠️ API Endpoints

### **Auth**
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `POST /api/auth/check-mail` — Check if email exists (for password reset)
- `POST /api/auth/reset-password` — Reset password

### **Profile**
- `GET /api/profile` — Get current user's profile (requires JWT)
- `PATCH /api/profile` — Update profile fields or salary history

### **Daily Logs**
- `GET /api/daily` — Get all daily logs (optionally filter by month)
- `POST /api/daily` — Add a new daily log
- `PATCH /api/daily` — Update a daily log
- `DELETE /api/daily` — Delete a daily log

### **Monthly Reports**
- `GET /api/monthly` — Get monthly summary and logs
- `POST /api/monthly` — Save monthly summary

---

## 🧩 Key Components

- **Navbar**: Handles navigation and login/logout.
- **AuthModal**: Handles login, registration, and password reset.
- **ProfilePage**: Edit/view user profile and salary history.
- **DailyPage**: Log and manage daily attendance and work.
- **MonthlyPage**: Analyze monthly performance and attendance.

---

## 🗃️ Data Model

### **User**
```ts
{
  email: string;
  password: string;
  name?: string;
  phone?: string;
  department?: string;
  designation?: string;
  salaryHistory?: { from: Date; salary: number; position?: string }[];
  salaryCreditedDay?: number;
  leaveAllowedPerMonth?: number;
  earnedLeave?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## 📝 Notes for Developers

- All authentication and profile routes require a valid JWT in the `Authorization` header.
- The UI is built with reusable components in `src/components/ui/`.
- MongoDB is used for persistent storage; see `src/lib/dbConnect.ts` for connection logic.
- The app uses React context for global auth state (`src/hooks/useAuth.tsx`).
- All pages are client components (`"use client"`).

---

## 📦 Deployment

Deploy easily on [Vercel](https://vercel.com/) or any platform supporting Next.js and environment variables.

---

## 🤝 Contributing

Pull requests and issues are welcome!  
Please open an issue for bugs or feature requests.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [React Documentation](https://react.dev/)

---

**Enjoy tracking your work!**
