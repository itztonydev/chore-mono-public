"""
Database Seed Script: Populates realistic sample data for demo & testing.
"""

import asyncio
from backend.core.uuid7 import uuid7_str
from backend.core.security import get_password_hash
from backend.db.session import AsyncSessionLocal, init_db
from backend.models.user import User
from backend.models.household import Household, HouseholdMember
from backend.models.chore import Chore
from backend.models.expense import Expense, ExpenseSplit
from backend.models.activity import ActivityStackLog


async def seed():
    await init_db()

    async with AsyncSessionLocal() as session:
        # Create Roommates
        u1 = User(
            id=uuid7_str(),
            email="alice@apartment4b.com",
            full_name="Alice Chen",
            hashed_password=get_password_hash("password123"),
            ed25519_public_key="a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
        )
        u2 = User(
            id=uuid7_str(),
            email="bob@apartment4b.com",
            full_name="Bob Martinez",
            hashed_password=get_password_hash("password123"),
            ed25519_public_key="b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1",
        )
        u3 = User(
            id=uuid7_str(),
            email="charlie@apartment4b.com",
            full_name="Charlie Kim",
            hashed_password=get_password_hash("password123"),
            ed25519_public_key="c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
        )
        u4 = User(
            id=uuid7_str(),
            email="diana@apartment4b.com",
            full_name="Diana Prince",
            hashed_password=get_password_hash("password123"),
            ed25519_public_key="d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3",
        )
        session.add_all([u1, u2, u3, u4])
        await session.flush()

        # Create Household
        hh = Household(id=uuid7_str(), name="Apartment 4B - The Chaos Compound")
        session.add(hh)
        await session.flush()

        # Add Members in Turn Order
        m1 = HouseholdMember(id=uuid7_str(), household_id=hh.id, user_id=u1.id, turn_order_index=0)
        m2 = HouseholdMember(id=uuid7_str(), household_id=hh.id, user_id=u2.id, turn_order_index=1)
        m3 = HouseholdMember(id=uuid7_str(), household_id=hh.id, user_id=u3.id, turn_order_index=2)
        m4 = HouseholdMember(id=uuid7_str(), household_id=hh.id, user_id=u4.id, turn_order_index=3)
        session.add_all([m1, m2, m3, m4])
        await session.flush()

        # Add Chores
        c1 = Chore(
            id=uuid7_str(),
            household_id=hh.id,
            title="Kitchen Dishes & Sink Sanitization",
            description="Empty dishwasher, load dishes, scrub sink basin.",
            current_assignee_id=u1.id,
        )
        c2 = Chore(
            id=uuid7_str(),
            household_id=hh.id,
            title="Trash & Recycling Haul",
            description="Take green compost and blue bins to curbside on Tuesday.",
            current_assignee_id=u2.id,
        )
        c3 = Chore(
            id=uuid7_str(),
            household_id=hh.id,
            title="Bathroom Deep Clean",
            description="Scrub shower tiles, mirror, and restock hand towels.",
            current_assignee_id=u3.id,
        )
        c4 = Chore(
            id=uuid7_str(),
            household_id=hh.id,
            title="Living Room Vacuum & Dust",
            description="Vacuum rugs, wipe coffee table, organize communal cushions.",
            current_assignee_id=u4.id,
        )
        session.add_all([c1, c2, c3, c4])
        await session.flush()

        # Add Shared Expenses
        # Expense 1: Alice paid $120 groceries, split equally among all 4 ($30 each)
        e1 = Expense(
            id=uuid7_str(),
            household_id=hh.id,
            payer_id=u1.id,
            amount=120.00,
            description="Trader Joe's Shared Pantry Staples",
        )
        session.add(e1)
        await session.flush()
        s1_1 = ExpenseSplit(id=uuid7_str(), expense_id=e1.id, user_id=u1.id, split_amount=30.00)
        s1_2 = ExpenseSplit(id=uuid7_str(), expense_id=e1.id, user_id=u2.id, split_amount=30.00)
        s1_3 = ExpenseSplit(id=uuid7_str(), expense_id=e1.id, user_id=u3.id, split_amount=30.00)
        s1_4 = ExpenseSplit(id=uuid7_str(), expense_id=e1.id, user_id=u4.id, split_amount=30.00)
        session.add_all([s1_1, s1_2, s1_3, s1_4])

        # Expense 2: Bob paid $60 Fiber Internet, split equally among all 4 ($15 each)
        e2 = Expense(
            id=uuid7_str(),
            household_id=hh.id,
            payer_id=u2.id,
            amount=60.00,
            description="Gigabit Fiber Internet Bill",
        )
        session.add(e2)
        await session.flush()
        s2_1 = ExpenseSplit(id=uuid7_str(), expense_id=e2.id, user_id=u1.id, split_amount=15.00)
        s2_2 = ExpenseSplit(id=uuid7_str(), expense_id=e2.id, user_id=u2.id, split_amount=15.00)
        s2_3 = ExpenseSplit(id=uuid7_str(), expense_id=e2.id, user_id=u3.id, split_amount=15.00)
        s2_4 = ExpenseSplit(id=uuid7_str(), expense_id=e2.id, user_id=u4.id, split_amount=15.00)
        session.add_all([s2_1, s2_2, s2_3, s2_4])

        # Expense 3: Charlie paid $40 Cleaning Supplies, split among Charlie & Diana ($20 each)
        e3 = Expense(
            id=uuid7_str(),
            household_id=hh.id,
            payer_id=u3.id,
            amount=40.00,
            description="Target Cleaning Supplies & Paper Towels",
        )
        session.add(e3)
        await session.flush()
        s3_1 = ExpenseSplit(id=uuid7_str(), expense_id=e3.id, user_id=u3.id, split_amount=20.00)
        s3_2 = ExpenseSplit(id=uuid7_str(), expense_id=e3.id, user_id=u4.id, split_amount=20.00)
        session.add_all([s3_1, s3_2])

        # Add Activity Stack Logs
        log1 = ActivityStackLog(
            id=uuid7_str(),
            household_id=hh.id,
            action_type="CREATE_EXPENSE",
            payload={"expense_id": e1.id, "payer_id": u1.id, "amount": 120.0, "description": e1.description},
        )
        log2 = ActivityStackLog(
            id=uuid7_str(),
            household_id=hh.id,
            action_type="CREATE_EXPENSE",
            payload={"expense_id": e2.id, "payer_id": u2.id, "amount": 60.0, "description": e2.description},
        )
        log3 = ActivityStackLog(
            id=uuid7_str(),
            household_id=hh.id,
            action_type="CREATE_EXPENSE",
            payload={"expense_id": e3.id, "payer_id": u3.id, "amount": 40.0, "description": e3.description},
        )
        session.add_all([log1, log2, log3])

        await session.commit()
        print("Database seeded successfully with sample household, members, chores, and expenses!")


if __name__ == "__main__":
    asyncio.run(seed())
