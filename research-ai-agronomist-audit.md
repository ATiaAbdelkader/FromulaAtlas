# AI Agronomist audit

## Current architecture

FormulaAtlas currently exposes two chat surfaces backed by `/api/agronomist-chat`: the legacy floating `AgronomistAssistant` and the newer `AgriAgentChat` panel with ten specialist personas from `src/lib/ai-agents.ts`. The route uses `z-ai-web-dev-sdk`, validates bounded history through `src/lib/ai-governance.ts`, applies a selected agent system prompt, and returns a plain text response.

## Current strengths

- Server-side model invocation keeps credentials out of the browser.
- History is capped at 12 messages and 4,000 characters per message.
- A per-client in-memory rate limit and public error masking already exist.
- The agent catalog has agronomy, operations, business, and specialist personas with suggested FormulaAtlas tools.
- The app already persists conversations locally and provides starter prompts.

## Current issues to address

1. The legacy floating assistant uses the route without an `agentId`, so it falls back to a narrow English-only default prompt and duplicates the multi-agent experience.
2. `AgriAgentChat` localizes only some labels into Arabic; French is mostly English fallback, and agent metadata has Arabic fields but no French fields.
3. The backend receives no active language, farm, field, weather, scouting, Simulator, or Digital Twin context. It cannot reliably ground answers in the user’s current workspace.
4. The Agronomist system prompt is too tool-oriented and narrow for an “ask anything” agricultural copilot; it should orchestrate across crop, soil, irrigation, pest, operations, business, climate, livestock, and FormulaAtlas tools.
5. The UI treats every response as plain text with no structured confidence, assumptions, follow-up questions, or actionable FormulaAtlas handoffs.
6. Error messages are not localized and the chat does not expose whether the response is general education, context-grounded, or requires local label/extension verification.

## Upgrade boundary

Keep the existing API route and `z-ai-web-dev-sdk` integration for compatibility. Extend the request with explicit `language` and a small sanitized `workspaceContext`, create a multilingual orchestration prompt around the selected specialist profile, expose localized agent metadata, and pass real tool-registry names so recommendations map to existing app capabilities. Keep the agent advisory-only and preserve rate limits, bounded history, public error masking, and no direct pesticide/legal/financial execution.
