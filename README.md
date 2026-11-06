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

Customer and staff login use Supabase Auth. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-only `SUPABASE_SECRET_KEY` in `.env` (copy them from the Supabase project's API settings), then restart the development server. The login form accepts a student or employee number. The server looks up that number in `profiles` (`login_id`, `school_id`, or `employee_no`), signs in with the profile email and password, and stores the Supabase session in HTTP-only cookies. The secret key is used only by server code to perform the profile lookup.

The profile's `role` determines the destination: `admin` goes to `/staff/admin`, `cashier` goes to `/staff/pos`, and student/member/teacher roles go to `/`. Signed-in students and teachers see their member home at `/`; visitors see the public landing page there. The email in `profiles` must match the user's Supabase Auth email. Pending, inactive, suspended, disabled, blocked, rejected, and archived accounts cannot sign in. Students and teachers can apply from the sign-up form; their Auth user and `profiles` row are created with `account_status = 'pending'`. The admin Manage Accounts page shows a pending-signup alert, supports approval/rejection, account creation for all roles, and soft archive/restore. Approvals record `approved_by` and `approved_at`. Student profiles include `school_id`, `department`, `course`, and `year_level`; teacher profiles include `employee_no` and `department`. Never expose `SUPABASE_SECRET_KEY` in browser code.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Teacher cooperative membership

Teacher profiles use `role = 'teacher'` (or `faculty`) and link to their cooperative membership records through `memberships.teacher_id = profiles.id`. Admins can manage the membership number, dates, and active status at `/staff/admin/teachers`. Only teachers with an active membership whose start and end dates include today receive the 20% online cart discount. The server checks membership records using the `SUPABASE_SECRET_KEY`.
