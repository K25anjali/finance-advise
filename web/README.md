# Untangle — web

React 19 + TypeScript + Vite, Tailwind CSS v4, Zustand, Motion, Lucide icons.

```bash
npm install
npm run dev      # http://localhost:5173 — proxies /api/* to the FastAPI server on :8000
npm run build    # static build in dist/
```

In production, build with `VITE_API_URL=https://your-api.example.com` so the app calls the deployed API directly.

| Path | What it is |
|---|---|
| `src/lib/api.ts` | Typed fetch client; turns 422/429/network failures into readable errors |
| `src/lib/types.ts` | API contract, mirrored from `server/app/models.py` |
| `src/lib/meta.ts` | Category/urgency colours and icons, example prompts |
| `src/store/useAdvisor.ts` | Zustand store: draft, request lifecycle (with cancel), case history (persisted) |
| `src/components/` | Header, Composer, result states, gauges, history drawer |
