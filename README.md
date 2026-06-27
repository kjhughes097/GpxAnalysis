# GpxAnalysis

A web application for analysing GPX files and surfacing insights from your tracks (routes, activities, elevation, pace, etc.).

This repository currently contains the UI scaffolding only — there is no analysis logic yet.

## Architecture

Two projects at the repo root:

- **`GpxAnalysis/`** — .NET 10 Web SDK app. Hosts API endpoints and serves the built web UI from `wwwroot/`.
- **`GpxAnalysis.Web/`** — Vite 9 + React 19 + TypeScript + MUI v9 frontend. Dev server runs on port 5173 and proxies `/api` requests to the backend on port 5100. Production builds output to `GpxAnalysis/wwwroot/`.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm

## Development

### Backend

```bash
dotnet run --project GpxAnalysis
```

The service listens on `http://localhost:5100`.

### Frontend

```bash
cd GpxAnalysis.Web
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` with hot module reload and proxies `/api/*` to the backend.

## Production Build

```bash
cd GpxAnalysis.Web
npm run build
```

The output is written to `GpxAnalysis/wwwroot/`. Run the backend and it will serve the built UI.

```bash
dotnet run --project GpxAnalysis
```

## Project Layout

```
GpxAnalysis/             .NET backend (host + future API)
  Program.cs
  GpxAnalysis.csproj
  wwwroot/               built frontend lands here

GpxAnalysis.Web/         React + Vite + MUI frontend
  src/
    App.tsx
    main.tsx
    theme/               MUI theme
    layouts/             DashboardLayout
    components/          SideMenu, AppNavbar, MenuContent
    pages/               Dashboard, Activities, Routes, Insights, Settings
  index.html
  package.json
  vite.config.ts
```

## Status

Scaffolding only — no analysis or backend logic implemented yet. The dashboard layout, navigation, and theming are in place and ready for feature development.
