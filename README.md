# Parallel

Parallel is a newcomer relocation rehearsal for Abu Dhabi. It connects a candidate profile, neighborhood choice, commute and heat scenario, landlord practice, and a session recap.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add a fresh server-side OpenAI key to `OPENAI_API_KEY` in `.env.local`. Keep the name without a `VITE_` prefix.
4. Start the app with `npm run dev`.

Without a configured key, the app stays usable with clearly labeled illustrative demo responses. The API key is read by the Vite server proxy and is not sent to the browser.

## Demo flow

1. Set a candidate profile and the frictions they want to rehearse.
2. Choose a residential or business future.
3. Explore the map, ask about a commute, and practice a lease or setup conversation.
4. Compare the saved session with the illustrative baseline and view the generated recap.

The profile, commute, and coaching results stay in the browser session so the comparison and recap reflect what happened during the rehearsal.

When `OPENAI_API_KEY` is configured, the app sends the user's recent prompts, selected neighborhood, selected rehearsal priorities, and apparent-temperature reading to OpenAI through the server proxy. The candidate name and role are not included in those requests. Without a key, AI features use the labeled demo responses.

## Data and prototype limits

- Weather comes from Open-Meteo and refreshes every ten minutes. If that request fails, the interface uses a labeled illustrative estimate.
- Walking routes use an OpenStreetMap-backed OSRM foot service. When routing is unavailable, the interface labels its cached geometry.
- The new residential and business neighborhood cards use interactive, procedural 3D concept models. They are not surveyed Abu Dhabi buildings or photorealistic tours.
- The Bus 102 leg, transit timing, property interior, amenities, and alternative-neighborhood baseline are illustrative MVP scenarios. Verify actual service, property details, and local requirements before relying on them.
- The AI coach is for practice and preparation. It is not legal, medical, tax, or investment advice.

The Vite preview server also hosts the local `/api/ai` proxy. A static-only deployment needs a server-side `/api/ai` endpoint configured with its own secret; do not add provider keys to client-side `VITE_` variables.
