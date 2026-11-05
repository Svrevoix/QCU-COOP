# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.17.0 create --template minimal --types ts --add prettier tailwindcss="plugins:none" --install npm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Authentication

The login routes use signed, HTTP-only session cookies. Development-only demo credentials are `23-2111` / `password` for a customer, `00-0000` / `password1` for an admin, and `11-1111` / `password2` for a cashier. Demo accounts are disabled in production.

<<<<<<< Updated upstream
Set `SESSION_SECRET` and the account variables in `.env.example` in the deployment environment, or replace `authenticate()` in `src/lib/server/auth.ts` with the application's persistent identity provider. Customer sign-up remains unavailable until a persistent account store is connected.
=======
The profile's `role` determines the destination: `admin` goes to `/staff/admin`, `cashier` goes to `/staff/pos/register`, and student/member/teacher roles go to `/`. Signed-in students and teachers see their member home at `/`; visitors see the public landing page there. The email in `profiles` must match the user's Supabase Auth email. Pending, inactive, suspended, disabled, blocked, rejected, and archived accounts cannot sign in. Students and teachers can apply from the sign-up form; their Auth user and `profiles` row are created with `account_status = 'pending'`. The admin Manage Accounts page shows a pending-signup alert, supports approval/rejection, account creation for all roles, and soft archive/restore. Approvals record `approved_by` and `approved_at`. Student profiles include `school_id`, `course`, and `year_level`; teacher profiles include `employee_no` and `department`. Department is collected for employee accounts, not students. Never expose `SUPABASE_SECRET_KEY` in browser code.
>>>>>>> Stashed changes

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
