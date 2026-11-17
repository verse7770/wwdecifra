<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (WW DECIFRA)
- Never seed or display invented exam statistics; topic incidence only comes from `topic_incidence` rows with validation `validado` on exams with `data_available` — keeps historical data separate from AI output.
- Questions carry `origin` (oficial/autoral/ia) and `validation`; AI-generated questions are always `origin=ia` and shown as non-official training material.
- All AI calls live in server functions (`src/lib/ai.functions.ts` + `ai.server.ts`) behind `requireSupabaseAuth`; prompts never ship to the browser.
- Catalog tables are public-read/admin-write via `has_role`; per-student tables are `auth.uid() = user_id` — admin access is enforced by RLS, the `/admin` route guard is only UX.
- Signed-in pages live under `src/routes/_authenticated/` and render inside `AppShell` (sidebar desktop, bottom nav mobile).
