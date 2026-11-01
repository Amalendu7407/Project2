# SplitMate React + Bootstrap Project

This project has been refreshed as a lightweight React + JavaScript + Bootstrap application.

## Stack
- React 18
- JavaScript
- Bootstrap 5
- Vite for development and builds
- Express for the local API

## Features
- Dashboard cards for total spend, what you owe, and what you are owed
- Expense form to add new records
- Recent expense list with delete actions
- Category-wise spending visualization
- Group balances overview
- Persistent local storage for demo data

## Run locally

```bash
npm install
npm run dev
```

Open the app at:
- http://127.0.0.1:4200/

## Production build

```bash
npm run build
```

## Notes
- Angular files were removed to keep the project lean and aligned with the React + Bootstrap stack.
- The Express backend is still available for the demo auth flow and API compatibility.
- Demo credentials remain in the environment file used by the local API.
