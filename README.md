# SplitMate

SplitMate is a simple shared-expense dashboard built with React, JavaScript, and Bootstrap. It includes demo groups and expenses, lets you add and delete expenses, and shows spending totals and group balances.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

Install dependencies and start the development servers:

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4200](http://127.0.0.1:4200).

The development command starts the Vite frontend and the Express API. The frontend demo data is stored in browser `localStorage`.

## Other commands

```bash
npm run build
npm test
npm start
```

- `npm run build` creates the production frontend build.
- `npm test` runs the finance and authentication tests.
- `npm start` starts the Express server in production/static-serving mode.

## Demo API configuration

The local API requires demo credentials in `.env.local`. Copy `.env.example` to `.env.local` and set `SPLITMATE_DEMO_EMAIL` and `SPLITMATE_DEMO_PASSWORD`. The local environment file is ignored by Git and must not be committed.

For production, also configure a unique `SESSION_SECRET` with at least 32 characters and serve the app over HTTPS. The API's active sessions are stored in memory and are cleared when the server restarts.

## Project structure

```text
src/
  App.jsx             React expense dashboard
  data.js             Seed demo groups and expenses
  main.jsx            React application entry point
  index.css           App styles
  utils/finance.js    Expense split and balance calculations
server/               Express authentication API
test/                 Finance and authentication tests
```

## Demo data and limitations

Groups, members, expenses, and settlements are seeded for demonstration. Changes made in the browser are saved in `localStorage`; they are not synchronized between browsers or devices. The app does not process payments. Avoid storing real financial or sensitive information in this demo.
