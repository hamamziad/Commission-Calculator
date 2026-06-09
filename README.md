# Commission & Bonus Calculator — Reach

A real-time web application that calculates commission and bonus payouts for the Reach NDR (New Debt Relief) track. All formulas are replicated exactly from the "KPI Tracker and Bonus Calculator" Excel spreadsheet.

## Features

- Real-time calculations as values are entered
- Per-KPI tier breakdown with progress bars
- Dark/light mode toggle
- Mobile responsive dashboard layout
- LORG goal tracking (Paid SIFs & Accepted SIFs vs. targets)
- Formula transparency — every calculation shown with its spreadsheet cell reference

## Tech Stack

- [TanStack Start](https://tanstack.com/start) (React + SSR)
- TypeScript
- Tailwind CSS v4
- Netlify (deployment)

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to Netlify by connecting this repository. The `netlify.toml` is pre-configured.

Or deploy via Netlify CLI:

```bash
npm install -g netlify-cli
netlify deploy --build
```

## Spreadsheet Reference

The source Excel file is at `public/KPI Tracker and Bonus Calculator.xlsx`. All commission logic lives in `src/lib/commission.ts` with inline comments mapping each function to its corresponding Excel formula and cell reference.
