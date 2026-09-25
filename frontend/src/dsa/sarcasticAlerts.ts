/**
 * Sarcastic Alert System.
 * Matches Python implementation in backend/dsa_engines/sarcastic_alerts.py
 */

export const PREMATURE_ROTATION_ALERTS = [
  "Leaving the frying pan to 'soak' for the 4th consecutive business day? Bold architectural decision.",
  "Nice try shifting trash duty to your roommate. The circular queue has an O(1) memory and zero empathy.",
  "You spun the chore roulette wheel hoping it'd magically skip your turn. The algorithm has rejected your prayer.",
  "Marking a chore done while the sink remains an active UNESCO bio-hazard site is a federal crime in this apartment.",
  "A 30-second rinse is not a completed chore. Please respect the thermodynamic laws of dish soap.",
  "Attempting a premature chore rotation? The Roommate Council will convene at dawn to discuss your banishment.",
  "Chore evasion detected. The circular queue pointer refuses to budge until actual elbow grease is detected.",
];

export const INVALID_TRANSACTION_ALERTS = [
  "Splitting $0.00? Did you purchase invisible oat milk, or are you just testing the mathematical fabric of reality?",
  "Splitting an expense exclusively with yourself is called 'shopping', not a shared expense vector.",
  "Negative amounts detected. Unless the grocery store paid you to take kale off their hands, please fix this.",
  "Wait, you bought a $40 artisanal scented candle and categorized it as 'Critical Living Infrastructure'?",
  "Logging a receipt with no debtors? Charitable donations to yourself are not tax deductible in this household.",
];

export const EMPTY_UNDO_ALERTS = [
  "Undo what? Your life choices? The activity stack is completely empty.",
  "Stack Underflow Exception: You cannot undo transactions that only occurred in your daydreams.",
  "Attempting to pop from an empty stack is like checking the fridge for the 5th time expecting pizza to appear.",
  "Nothing to undo. The ledger is clean, unlike the bathroom mirror.",
];

export function getPrematureAlert(choreTitle?: string, userName?: string): string {
  const item = PREMATURE_ROTATION_ALERTS[Math.floor(Math.random() * PREMATURE_ROTATION_ALERTS.length)];
  if (userName && choreTitle) {
    return `🚨 [Sarcastic Alert] ${userName}, step away from the button! ${item} ('${choreTitle}')`;
  }
  return `🚨 [Sarcastic Alert] ${item}`;
}

export function getInvalidExpenseAlert(amount: number, reason?: string): string {
  const item = INVALID_TRANSACTION_ALERTS[Math.floor(Math.random() * INVALID_TRANSACTION_ALERTS.length)];
  return `💸 [Ledger Sarcasm] ${item}${reason ? ` (${reason})` : ''}`;
}

export function getEmptyUndoAlert(): string {
  const item = EMPTY_UNDO_ALERTS[Math.floor(Math.random() * EMPTY_UNDO_ALERTS.length)];
  return `⏳ [Stack Sarcasm] ${item}`;
}
