<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Data lives behind the TanStack Start server functions in src/lib/fns.ts; src/lib/store.ts is the client API layer over them. src/server/db.ts picks the backend from MONGODB_URI: MongoDB (users/sessions collections) in production on Vercel, otherwise the file-backed store in .data/paypoint.json. Why: accounts, balances and withdrawals must survive reloads and be validated on the server, and Vercel's read-only filesystem cannot host a file database.
- All visitor-facing copy uses the shared language context with French as the default and English as the alternative. Why: PayPoint serves Francophone Africa while supporting English readers.
- Task artwork is resolved through src/lib/task-images.ts. Why: dashboard cards and task detail pages must use one consistent image and bilingual description per task.
- Withdrawal tracking uses a dedicated /withdrawals/$id route; demo withdrawals flip to paid server-side once their simulation elapses and the store refreshes the cached user. Why: reloads preserve progress and simulated payments cannot be mistaken for real payouts.
