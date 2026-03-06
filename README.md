# Interactive Slide Editor Assessment

React + TypeScript + Redux Toolkit implementation for the Front-End Assessment.

## Tech Stack

- React 18 + TypeScript
- React Router DOM (protected routes + auth/public guards)
- Redux Toolkit + React Redux
- Tailwind CSS
- Axios for API calls
- html2canvas for slide screenshot capture on save

## Implemented Features

- Login page (`/login`) with validation and error handling (`Invalid credentials`)
- Reset password page (`/reset-password`) with full front-end validation rules and success modal
- Protected routes for dashboard and editor
- Logout flow that clears auth state and redirects to login
- Dashboard (`/`)
  - Slide table (name, type, status, actions)
  - Backend search + pagination hooks
- Slide Editor (`/slides/:id`)
  - Left sidebar: add text/image, media panel, rich text editing panel, element properties
  - Main work area: render elements, drag/drop, resize, z-index
  - Right sidebar: searchable slide list with navigation
  - Right-click context menu: copy/paste/delete
  - Save pipeline: serialize canvas HTML, capture screenshot, dispatch backend save, update Redux, log store state
- API integration through async Redux thunks
- Global loader overlay + global toast notifications

## Environment

Create `.env` from `.env.example` and set backend base URL:

```bash
cp .env.example .env
```

Example value:

```env
VITE_API_URL=https://control.html-builder.net
```

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Local Backend (Node.js)

A Node.js backend that matches the frontend endpoint contract is available in `backend/`.

### Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend default URL:

```text
http://localhost:4000
```

Use this in frontend `.env`:

```env
VITE_API_URL=http://localhost:4000
```

### Implemented backend endpoints

- `POST /api/login`
- `POST /api/logout`
- `GET /api/user-data`
- `GET /api/slides-of-designer?name=&page=&per_page=`
- `GET /api/slides/:id`
- `GET /api/media-of-slide/:slideId`
- `POST /api/save-slide-dummy/:slideId`
- `POST /api/attach-media-to-slide/:slideId`
- `GET /api/health`

## Notes

- API payloads are normalized defensively because backend response shapes can vary.
- `fetchSlideById` includes a fallback strategy if a direct endpoint is unavailable.
- `updateSlideElement` and save operations are routed through the provided `save-slide-dummy` endpoint.
# rawana-test
