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

Set `SESSION_SECRET` and the account variables in `.env.example` in the deployment environment, or replace `authenticate()` in `src/lib/server/auth.ts` with the application's persistent identity provider. Customer sign-up remains unavailable until a persistent account store is connected.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
