# ISY_FE

I SEE YOU frontend built with React, TypeScript, and Vite.

## What is included

- Marketing-style main page for the I SEE YOU service
- Dedicated analyzer studios for `Image`, `Text`, `Video`, and `Multimodal`
- Drag-and-drop upload flow
- Progress rail and analysis state UI
- Real/Fake score presentation
- XAI-oriented overlays, rationale cards, and evidence timelines
- 3D brand logo using `@google/model-viewer`

## Project structure

- `src/App.tsx`: main application flow and studio logic
- `src/App.css`: visual system and responsive layout
- `src/pages/*`: modality-specific studio wrappers
- `src/assets/*`: custom visual assets used by the landing page
- `public/iseeyou-logo.glb`: 3D brand logo asset

## Local development

```bash
npm install
npm run dev
```

Default frontend URL:

```bash
http://127.0.0.1:5173
```

## Build

```bash
npm run build
```

## API connection

This frontend is configured to proxy `/api` requests to:

```bash
http://127.0.0.1:8787
```

If you run the paired local worker server, the studios can call:

- `/api/analyze-media`
- `/api/analyze-text`
- `/api/health`

If the API is unavailable, the UI can fall back to demo analysis output.
