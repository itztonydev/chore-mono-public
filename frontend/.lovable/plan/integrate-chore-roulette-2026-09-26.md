# Integrate Chore Roulette

## Scope

- Replace the dashboard’s current chore list/form with the roulette experience.
- Move the expense tracker and activity log into there own pages .

## Implementation

- Refactor `ChoreRouletteView` to accept the real `Chore` and `HouseholdMember` API types.
- Remove all mock-data, local queue, and local alert dependencies; derive queue order from `turn_order_index`.
- Connect complete/skip actions to `rotateChore` and chore creation to `createChore` through dashboard callbacks.
- Preserve API notices and errors, refresh dashboard data after successful actions, and prevent duplicate submissions while requests run.
- Restyle the roulette with existing Tokyo Night semantic tokens, square corners, exposed grid lines, monospace metadata, and hard offset shadows.
- Make the ring and controls adapt cleanly to mobile and desktop layouts with reduced-motion support.

## Verification

- Confirm the changed files introduce no new type errors.
- Verify the dashboard renders correctly at desktop and mobile widths when an authenticated API session is available.
- Check the latest preview build and runtime diagnostics; unrelated pre-existing errors will be reported separately if still present.