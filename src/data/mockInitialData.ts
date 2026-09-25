/**
 * Realistic Mock Initial Data mirroring backend/app/db/seed.py
 */

import { generateUUIDv7 } from '../dsa/uuid7';

export interface UserData {
  id: string;
  email: string;
  fullName: string;
  avatarColor: string;
  ed25519PublicKey: string;
  googleSubId?: string;
  googleEmail?: string;
  turnOrderIndex: number;
  hasPassword?: boolean;
}

export interface ChoreData {
  id: string;
  householdId: string;
  title: string;
  description: string;
  currentAssigneeId: string;
  turnCount: number;
  createdAt: string;
}

export const INITIAL_HOUSEHOLD_ID = '018e6e5a-73c0-7f2a-8c11-001122334455';

export const INITIAL_ROOMMATES: UserData[] = [
  {
    id: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
    email: 'alice@apartment4b.com',
    fullName: 'Alice Chen',
    avatarColor: 'bg-emerald-500',
    ed25519PublicKey: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    googleSubId: 'google_sub_849201948271',
    googleEmail: 'alice.chen@gmail.com',
    turnOrderIndex: 0,
    hasPassword: true,
  },
  {
    id: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02',
    email: 'bob@apartment4b.com',
    fullName: 'Bob Martinez',
    avatarColor: 'bg-blue-500',
    ed25519PublicKey: 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',
    turnOrderIndex: 1,
    hasPassword: true,
  },
  {
    id: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03',
    email: 'charlie@apartment4b.com',
    fullName: 'Charlie Kim',
    avatarColor: 'bg-purple-500',
    ed25519PublicKey: 'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2',
    turnOrderIndex: 2,
    hasPassword: true,
  },
  {
    id: '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04',
    email: 'diana@apartment4b.com',
    fullName: 'Diana Prince',
    avatarColor: 'bg-rose-500',
    ed25519PublicKey: 'd4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3',
    turnOrderIndex: 3,
    hasPassword: true,
  },
];

export const INITIAL_CHORES: ChoreData[] = [
  {
    id: '018e6e5a-8001-7b3c-9a11-111111111111',
    householdId: INITIAL_HOUSEHOLD_ID,
    title: 'Kitchen Dishes & Sink Sanitization',
    description: 'Empty dishwasher, load communal pans, scrub stainless steel sink basin.',
    currentAssigneeId: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
    turnCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: '018e6e5a-8002-7b3c-9a12-222222222222',
    householdId: INITIAL_HOUSEHOLD_ID,
    title: 'Trash & Recycling Curbside Haul',
    description: 'Wheel green compost and blue recycling bins to curbside on Tuesday evening.',
    currentAssigneeId: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02',
    turnCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: '018e6e5a-8003-7b3c-9a13-333333333333',
    householdId: INITIAL_HOUSEHOLD_ID,
    title: 'Bathroom Deep Clean & Towel Swap',
    description: 'Scrub shower tiles, wipe mirror fog residue, replenish communal cotton towels.',
    currentAssigneeId: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03',
    turnCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: '018e6e5a-8004-7b3c-9a14-444444444444',
    householdId: INITIAL_HOUSEHOLD_ID,
    title: 'Living Room Vacuum & Coffee Table Clean',
    description: 'Vacuum rug fibers, wipe down wooden coffee table, fluff seating cushions.',
    currentAssigneeId: '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04',
    turnCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
  },
];

export const INITIAL_EXPENSES = [
  {
    id: '018e6e5a-9001-7c4d-9a11-123456789001',
    payerId: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01', // Alice
    amount: 120.0,
    description: "Trader Joe's Shared Pantry Staples",
    splits: [
      { userId: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01', splitAmount: 30.0 },
      { userId: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02', splitAmount: 30.0 },
      { userId: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03', splitAmount: 30.0 },
      { userId: '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04', splitAmount: 30.0 },
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    id: '018e6e5a-9002-7c4d-9a12-123456789002',
    payerId: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02', // Bob
    amount: 60.0,
    description: 'Gigabit Fiber Internet Bill',
    splits: [
      { userId: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01', splitAmount: 15.0 },
      { userId: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02', splitAmount: 15.0 },
      { userId: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03', splitAmount: 15.0 },
      { userId: '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04', splitAmount: 15.0 },
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: '018e6e5a-9003-7c4d-9a13-123456789003',
    payerId: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03', // Charlie
    amount: 40.0,
    description: 'Target Cleaning Supplies & Paper Towels',
    splits: [
      { userId: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03', splitAmount: 20.0 },
      { userId: '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04', splitAmount: 20.0 },
    ],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
