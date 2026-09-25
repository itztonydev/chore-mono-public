# Chore Roulette

Act as a Principal Frontend Engineer. We are building the Next.js + Tailwind CSS frontend for the "Roommate Chore & Expense Roulette" API. 

DESIGN SYSTEM (STRICT):

- Minimalist-Brutalist, pure-black (#000000) Tokyo Night theme. 

- Given old tailwind.config.js for more reference

- No soft shadows, no gradients, strictly `rounded-none`. 

- Hard offset shadows (e.g., 4px 4px 0px #bb9af7), exposed 1px grid lines, raw monospace typography for all data/numbers.

PAGE WORKFLOW & ROUTING:

1. `/` (Login/Auth): Minimalist form. Session state relies strictly on backend HTTP-only cookies (no local storage for tokens). Redirects to /dashboard on success.

2. `/dashboard`: The main hub. Split into two brutalist grid sections: "Task Rotator" (who is on chore duty) and "Expense Tracker" (simplified debt graphs).

3. `/household`: Roster management (add/remove flatmates) and an Activity Log timeline showing recent transactions with "Undo" actions.

4. `account`: your account settings

EXECUTION RULES (DO NOT DEVIATE):

Step 0: Read my openapi.json file and Treat it as the source of truth for all API endpoints, Build the frontend against this existing API. if problem arise write PROBLEM.md in root and put what workaround is used

Step 1: `globals.css` using Tailwind v4 mapping the brutalist pure-black theme

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/63d5aada-ba10-4d44-ab99-acab042e5b86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
