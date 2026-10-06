# Africa Connect Hub

Let's build a hiring website with the job site on it. this should be a site to employe remote workers in Africa countries especially the francophones. Which when the open the side they have servral domain to employe them. One which it to post and promote other products such as dresses tools perfumes rear watches, etc and other is to promote rear crypto coins and others to vote and promote celebraties and other promtions after applying and accepted the get a dashboard to perform all these tasks they also have the ability to do active like videos and earn little commissions the have the possibility to withdraw into the local money eg mtn mobile money and orange money for Cameroonain the account balance only increases after completing the task. To create an account you need just a username and password repeat the password to make sure it matches withdrawals are done every Saturdays at 10 am to 3pm

They don't need to pay anything. Do this all demo we will add database after all testing is working for the front end all features functional

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://paypointx.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/efcc6159-0c50-4812-b475-8b2f9b9a9855).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Backend & database

Accounts, applications, task rewards and withdrawals run on a real backend built with TanStack Start server functions:

- `src/lib/fns.ts` — the RPC surface the browser calls (signup, login, applications, tasks, withdrawals).
- `src/server/api.ts` — the business rules: scrypt-hashed passwords, httpOnly `pp_session` cookies, server-side proof validation, daily task limits, Saturday 10:00–15:00 withdrawal window and simulated payouts.
- `src/server/db.ts` — the database: MongoDB (Atlas) whenever `MONGODB_URI` is set (production on Vercel), otherwise a file-backed store at `.data/paypoint.json` (gitignored) with atomic writes. Both backends share the same automatic time transitions (application reviews auto-approve after 10 minutes, demo withdrawals auto-pay after 8 seconds).
- `src/lib/catalog.ts` — shared types and constants (domains, tasks, payment methods) used by both sides.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
