/**
 * Circular Queue implementation in TypeScript.
 * Matches Python implementation in backend/dsa_engines/circular_queue.py
 */

export class ChoreCircularQueueTS {
  private members: string[];
  private currentIndex: number;

  constructor(members: string[] = [], initialIndex: number = 0) {
    this.members = [...members];
    this.currentIndex = this.members.length > 0 ? initialIndex % this.members.length : 0;
  }

  get length(): number {
    return this.members.length;
  }

  get pointer(): number {
    return this.currentIndex;
  }

  get allMembers(): string[] {
    return [...this.members];
  }

  peekCurrent(): string | null {
    if (this.members.length === 0) return null;
    return this.members[this.currentIndex];
  }

  peekNext(steps: number = 1): string | null {
    if (this.members.length === 0) return null;
    const nextIdx = (this.currentIndex + steps) % this.members.length;
    return this.members[nextIdx];
  }

  rotateForward(): { newAssignee: string | null; newIndex: number } {
    if (this.members.length === 0) return { newAssignee: null, newIndex: 0 };
    this.currentIndex = (this.currentIndex + 1) % this.members.length;
    return { newAssignee: this.members[this.currentIndex], newIndex: this.currentIndex };
  }

  rotateBackward(): { prevAssignee: string | null; prevIndex: number } {
    if (this.members.length === 0) return { prevAssignee: null, prevIndex: 0 };
    this.currentIndex = (this.currentIndex - 1 + this.members.length) % this.members.length;
    return { prevAssignee: this.members[this.currentIndex], prevIndex: this.currentIndex };
  }

  setPointer(memberId: string): number {
    const idx = this.members.indexOf(memberId);
    if (idx !== -1) {
      this.currentIndex = idx;
    }
    return this.currentIndex;
  }
}
