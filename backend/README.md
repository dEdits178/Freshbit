# FreshBit Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Copy the example environment file and update with your credentials:
```bash
cp .env.example .env
```

Then edit `.env` with your actual database URL and secrets.

### 3. Set up Database

**Option A: Cloud Database (Recommended - Works Anywhere)**

Use one of these free cloud PostgreSQL providers:

1. **Supabase** (Recommended): https://supabase.com
   - Sign up for free
   - Create a new project
   - Copy the connection string from Settings > Database
   - Update `DATABASE_URL` in `.env`

2. **Neon**: https://neon.tech
   - Free tier with instant PostgreSQL
   - Serverless and auto-scaling

3. **Railway**: https://railway.app
   - $5 free credit monthly
   - Very simple setup

**Option B: Local Docker (For Development)**
```bash
docker run -d --name freshbit-postgres -p 5432:5432 \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=freshbit \
  postgres:15
```

**Option C: Use your own PostgreSQL**
Update the `DATABASE_URL` in `.env` to point to your database.

### 4. Run Database Migrations
```bash
npx prisma migrate dev
```

This will:
- Apply all migrations to your database
- Generate the Prisma Client

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## Database Commands

- **Format Prisma schema:** `npx prisma format`
- **Validate schema:** `npx prisma validate`
- **Create migration:** `npx prisma migrate dev --name migration_name`
- **Generate Prisma Client:** `npx prisma generate`
- **Seed database:** `npm run db:seed`

## Docker Database Commands

- **Stop database:** `docker stop freshbit-postgres`
- **Start database:** `docker start freshbit-postgres`
- **Remove database:** `docker rm -f freshbit-postgres`
