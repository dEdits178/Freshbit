# Stage 3 Auth - Quick Start Guide

## 🚀 Quick Setup (5 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Database
```bash
# If using Docker (recommended for local dev)
docker start freshbit-postgres

# If container doesn't exist, create it:
docker run -d --name freshbit-postgres -p 5432:5432 \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=freshbit \
  postgres:15
```

### 3. Create Admin User
```bash
npm run create:admin
```

This creates:
- Email: `admin@freshbit.com`
- Password: `admin123`

### 4. Start Server
```bash
npm run dev
```

Server runs on: `http://localhost:5000`

### 5. Test API

**Import Postman Collection:**
- File: `postman_collection.json`
- Import into Postman
- Ready-to-use requests!

---

## 📝 Testing Flow (Step by Step)

### Step 1: Login as Admin
```
POST http://localhost:5000/api/auth/login

{
  "email": "admin@freshbit.com",
  "password": "admin123"
}
```

**Copy the `token` from response!**

---

### Step 2: Register a Company
```
POST http://localhost:5000/api/auth/register/company

{
  "name": "Tech Corp",
  "email": "company@techcorp.com",
  "password": "password123",
  "domain": "techcorp.com"
}
```

**Copy the `id` from response!**

---

### Step 3: Approve the Company (as Admin)
```
PATCH http://localhost:5000/api/auth/admin/approve/{userId}
Authorization: Bearer {admin_token}
```

Replace:
- `{userId}` with the ID from Step 2
- `{admin_token}` with token from Step 1

---

### Step 4: Login as Company
```
POST http://localhost:5000/api/auth/login

{
  "email": "company@techcorp.com",
  "password": "password123"
}
```

**Success! You now have a company token.**

---

## 🎯 All Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | No | - | Health check |
| POST | `/api/auth/register/company` | No | - | Register company |
| POST | `/api/auth/register/college` | No | - | Register college |
| POST | `/api/auth/login` | No | - | Login user |
| PATCH | `/api/auth/admin/approve/:userId` | Yes | ADMIN | Approve user |

---

## 💡 Pro Tips

1. **Postman Collection Variable:**
   - After login, token is auto-saved to `{{token}}`
   - No need to manually copy/paste

2. **Check Logs:**
   - Server uses Pino logger
   - Check console for formatted logs

3. **Database GUI:**
   - Use Prisma Studio: `npx prisma studio`
   - Opens at `http://localhost:5555`

4. **Common Issues:**
   - Database not running? Check Docker: `docker ps`
   - Port already in use? Change `PORT` in `.env`
   - Token expired? Login again (default: 7 days)

---

## 🔐 Default Credentials

**Admin:**
- Email: `admin@freshbit.com`
- Password: `admin123`

**Test Company (after registration & approval):**
- Email: `company@techcorp.com`
- Password: `password123`

**Test College (after registration & approval):**
- Email: `college@mit.edu`
- Password: `password123`

---

## ✅ Verification Checklist

- [ ] Database is running
- [ ] Server starts without errors
- [ ] Admin user created
- [ ] Can login as admin
- [ ] Can register company
- [ ] Can approve users
- [ ] Can login as approved user
- [ ] Postman collection works

---

## 📚 Full Documentation

See `STAGE3_DOCUMENTATION.md` for:
- Complete API reference
- Architecture details
- Security features
- Error handling
- Database schema

---

**Ready to build! 🚀**
