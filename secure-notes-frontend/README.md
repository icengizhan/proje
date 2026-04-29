# Secure Notes - Frontend

React frontend for Secure Notes.

## Prerequisites

* Node.js (v20.18+)
* npm/yarn

## Env Setup

Create `.env` file based on `.env.example`.

```env
VITE_API_URL=http://localhost:3000
```

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm run test
```

## Deploy

Build image:
```bash
docker build -t secure-notes-frontend .
```
Run container:
```bash
docker run -p 80:80 secure-notes-frontend
```
