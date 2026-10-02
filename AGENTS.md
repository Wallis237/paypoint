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
- Demo data lives in localStorage via src/lib/store.ts; swap its functions for a backend later. Why: user wants frontend-only testing first.
- All visitor-facing copy uses the shared language context with French as the default and English as the alternative. Why: PayPoint serves Francophone Africa while supporting English readers.
