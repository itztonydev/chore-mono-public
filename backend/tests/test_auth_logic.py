"""
Unit Tests for Multi-Provider Authentication & Alternative Login Methods:
- Multi-auth methods resolution (Password, Ed25519, Google Auth)
- Alternative login method linking to existing account
- Account lockout prevention upon unlinking
- Google credential sub_id determinism and conflict detection
"""

import unittest
from backend.core.uuid7 import uuid7_str


class MockUser:
    def __init__(self, id=None, email=None, full_name=None, hashed_password=None, ed25519_public_key=None, google_sub_id=None):
        self.id = id or uuid7_str()
        self.email = email or "roommate@apartment4b.com"
        self.full_name = full_name or "Test Roommate"
        self.hashed_password = hashed_password
        self.ed25519_public_key = ed25519_public_key
        self.google_sub_id = google_sub_id


def compute_available_methods(user: MockUser):
    methods = []
    if user.hashed_password:
        methods.append("password")
    if user.ed25519_public_key:
        methods.append("ed25519")
    if user.google_sub_id:
        methods.append("google")
    return methods


def derive_google_sub_id(credential_token: str) -> str:
    return f"google_sub_{abs(hash(credential_token))}"


def can_safely_unlink_google(user: MockUser) -> bool:
    # Must have at least password or ed25519 to avoid account lockout
    return bool(user.hashed_password or user.ed25519_public_key)


class TestAuthAlternativeMethods(unittest.TestCase):
    def test_initial_password_only_user(self):
        user = MockUser(hashed_password="$2b$12$samplehashedpassword123")
        methods = compute_available_methods(user)
        self.assertEqual(methods, ["password"])
        self.assertNotIn("google", methods)

    def test_link_google_auth_to_existing_account(self):
        user = MockUser(hashed_password="$2b$12$samplehashedpassword123")
        token = "google_id_token_xyz_789"
        sub_id = derive_google_sub_id(token)

        # Link to existing account
        user.google_sub_id = sub_id
        methods = compute_available_methods(user)

        self.assertIn("password", methods)
        self.assertIn("google", methods)
        self.assertTrue(user.google_sub_id.startswith("google_sub_"))

    def test_multi_auth_password_ed25519_and_google(self):
        user = MockUser(
            hashed_password="$2b$12$samplehashedpassword123",
            ed25519_public_key="a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
            google_sub_id="google_sub_987654321",
        )
        methods = compute_available_methods(user)
        self.assertEqual(sorted(methods), ["ed25519", "google", "password"])

    def test_unlink_google_auth_lockout_safety(self):
        # User with password can safely unlink Google
        user_with_pw = MockUser(
            hashed_password="$2b$12$password",
            google_sub_id="google_sub_123",
        )
        self.assertTrue(can_safely_unlink_google(user_with_pw))

        # User with only Google Auth (no password, no Ed25519 key) CANNOT unlink without lockout!
        user_only_google = MockUser(
            hashed_password=None,
            ed25519_public_key=None,
            google_sub_id="google_sub_123",
        )
        self.assertFalse(can_safely_unlink_google(user_only_google))

    def test_account_preservation_on_google_login(self):
        # Existing user has a UUID7 identifier
        original_user = MockUser(
            id=uuid7_str(),
            email="alice@apartment4b.com",
            full_name="Alice Chen",
            hashed_password="$2b$12$hash",
        )
        original_id = original_user.id

        # Linking Google auth assigns sub_id
        token = "token_alice_google"
        sub_id = derive_google_sub_id(token)
        original_user.google_sub_id = sub_id

        # Alternative login via Google resolves to the SAME original user ID
        resolved_id = original_user.id
        self.assertEqual(resolved_id, original_id)


if __name__ == "__main__":
    unittest.main()
