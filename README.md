# TeamSync

A team task management app I built to learn full-stack development. Has user roles (admin/member), JWT auth, and real-time updates with Socket.IO.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB Atlas
- **Auth:** JWT + bcrypt
- **Realtime:** Socket.IO
- **State/Data fetching:** React Query (TanStack Query v5)

## Features

- Signup/Login with JWT auth
- First user to register automatically becomes admin (no seed script needed)
- Admins can create projects, add members, create and assign tasks
- Members can only see and update their own assigned tasks
- Tasks have status: pending → in-progress → completed
- Overdue tasks are detected automatically (no cron job, just a mongoose virtual)
- Dashboard shows different stats based on your role
- Real-time updates — if someone creates/updates a task, everyone sees it instantly

## Getting Started

You'll need Node.js and a MongoDB Atlas account (free tier is fine).

### Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=make_this_something_random
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

Go to `http://localhost:5173`. First account you create will be admin.

## MongoDB Atlas Setup

1. Create a free cluster at mongodb.com/atlas
2. Create a database user
3. Add your IP to the allowlist (or use 0.0.0.0/0 for dev)
4. Get the connection string from Connect → Drivers and paste it in your `.env`

## API Endpoints

### Auth
```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me        (requires token)
GET  /api/auth/users     (admin only)
```

### Projects
```
GET    /api/projects
POST   /api/projects                    (admin)
GET    /api/projects/:id
PUT    /api/projects/:id                (admin)
DELETE /api/projects/:id                (admin)
POST   /api/projects/:id/members        (admin)
DELETE /api/projects/:id/members/:uid   (admin)
```

### Tasks
```
GET    /api/tasks
POST   /api/tasks        (admin)
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id    (admin)
```

### Dashboard
```
GET /api/dashboard/stats
```

## Stuff I learned / got stuck on

**Real-time sync** — I was manually updating the React Query cache on every socket event which got messy fast. Switched to just calling `queryClient.invalidateQueries()` on any socket event and letting React Query refetch. More network requests but way simpler code and no stale data bugs.

**Overdue tasks** — didn't want to store a boolean in the DB that would go stale. Used a Mongoose virtual field that computes `isOverdue` on every read by comparing deadline to current time. Took me a while to figure out why the frontend was getting `isOverdue: undefined` — turns out you have to add `toJSON: { virtuals: true }` to the schema options or mongoose strips them out.

**Members seeing other tasks** — my first version fetched all tasks and filtered in JS. Realized that's wrong because the raw data still goes over the network. Moved the filter into the mongoose query so unauthorized documents never get fetched at all.

**First admin user** — didn't want to write a seed script just to bootstrap the first admin. On signup I count existing users, if it's 0 the new user gets admin role, otherwise member. Simple enough.

## Deployment

I deployed the backend to Railway and frontend to Vercel.

For Railway: push to GitHub, connect repo, add env variables, done. It auto-detects Node.

For Vercel: `npm run build` and deploy the `dist` folder. Set `VITE_API_URL` to your Railway backend URL.
