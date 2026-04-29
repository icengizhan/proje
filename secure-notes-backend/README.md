# Secure Notes - Backend

NestJS backend for Secure Notes.

## Prerequisites

* Node.js (v20.18+)
* MySQL
* Redis
* npm/yarn

## Env Setup

Create `.env` file based on `.env.example`.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=secure_notes
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=supersecret
```

## Run

```bash
npm install
npm run start:dev
```

## Test

```bash
npm run test
npm run test:e2e
```

## Deploy

Build image:
```bash
docker build -t secure-notes-backend .
```
Run container:
```bash
docker run -p 3000:3000 secure-notes-backend
```
