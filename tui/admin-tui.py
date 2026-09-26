import json
import requests
from textual import on
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal, Vertical, ScrollableContainer
from textual.widgets import (
    Button,
    DataTable,
    Footer,
    Header,
    Input,
    Label,
    Log,
    Static,
    TabbedContent,
    TabPane,
)

BASE_URL = "http://localhost:8000"


class AdminRouletteApp(App):
    TITLE = "🛠️ Roommate Roulette - Admin Panel"
    SUB_TITLE = "System & User Management Console"

    CSS = """
    Screen {
        layout: vertical;
        background: $surface;
    }

    #session-bar {
        height: auto;
        padding: 1;
        background: $panel;
        border-bottom: heavy $accent;
    }

    .bar-input {
        width: 1fr;
        margin-right: 1;
    }

    #alert-banner {
        height: 3;
        background: $primary-muted;
        color: $text;
        border: round $primary;
        padding: 0 1;
        margin: 1;
        content-align: center middle;
        text-style: bold;
    }

    .form-container {
        padding: 1;
        height: auto;
    }

    .form-input {
        margin-bottom: 1;
    }

    .form-row {
        height: auto;
        margin-bottom: 1;
    }

    .table-container {
        height: 1fr;
        padding: 1;
    }

    DataTable {
        height: 100%;
        border: solid $accent;
    }

    #log-console {
        height: 100%;
        background: $surface-darken-1;
        color: $text;
        border: inner $accent;
    }

    .section-title {
        text-style: bold;
        color: $primary;
        margin-bottom: 1;
    }
    """

    BINDINGS = [
        Binding("q", "quit", "Quit", show=True),
        Binding("r", "refresh_all", "Refresh Admin Views", show=True),
    ]

    def __init__(self):
        super().__init__()
        self.admin_token = ""
        self.selected_user_id = ""
        self.selected_household_id = ""

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)

        # Admin Context Bar
        with Horizontal(id="session-bar"):
            yield Input(placeholder="Admin / Bearer JWT Token", id="token_input", password=True, classes="bar-input")
            yield Input(placeholder="Target User UUID7", id="user_id_input", classes="bar-input")
            yield Input(placeholder="Target Household UUID7", id="household_id_input", classes="bar-input")
            yield Button("Set Context", id="btn_set_context", variant="primary")

        yield Static("🛠️ Admin Console Ready. Select target parameters to inspect or mutate.", id="alert-banner")

        with TabbedContent(initial="users"):

            # 1. USER & AUTH METHODS MANAGEMENT
            with TabPane("User & Auth Methods", id="users"):
                with ScrollableContainer(classes="form-container"):
                    yield Label("Inspect User Auth Methods (`/api/v1/auth/methods/{user_id}`)", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Button("Inspect Auth Methods", id="btn_inspect_auth", variant="primary")

                    yield DataTable(id="auth_methods_table")

                    yield Label("Link Google Identity (`/api/v1/auth/link-google`)", classes="section-title")
                    yield Input(placeholder="Credential Token", id="link_cred_token", classes="form-input")
                    yield Input(placeholder="Email", id="link_email", classes="form-input")
                    yield Input(placeholder="Full Name", id="link_fullname", classes="form-input")
                    yield Button("Link Google Auth", id="btn_link_google", variant="success")

                    yield Label("Unlink Google Identity (`/api/v1/auth/unlink-google`)", classes="section-title")
                    yield Button("Unlink Google Auth", id="btn_unlink_google", variant="error")

            # 2. HOUSEHOLD MANAGEMENT
            with TabPane("Households & Queue Setup", id="households"):
                with ScrollableContainer(classes="form-container"):
                    yield Label("Create Household Profile", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Input(placeholder="Household Name", id="hh_name", classes="bar-input")
                        yield Button("Create Household", id="btn_create_hh", variant="success")

                    yield Label("Inspect Household Profile & Circular Queue", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Button("Load Household Profile", id="btn_load_hh", variant="primary")
                    yield DataTable(id="household_members_table")

                    yield Label("Add Member to Circular Queue", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Input(placeholder="User UUID7", id="add_member_uid", classes="bar-input")
                        yield Input(placeholder="Turn Index", id="add_member_idx", classes="bar-input")
                        yield Button("Force Add Member", id="btn_add_member", variant="warning")

            # 3. LIFO ACTIVITY STACK & DIAGNOSTICS
            with TabPane("Raw Stack & System Logs", id="stack"):
                with Vertical(classes="table-container"):
                    yield Label("Inspect Raw Activity Stack Log (`/api/v1/expenses/{household_id}/stack`)", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Button("Fetch Stack Frames", id="btn_fetch_stack", variant="primary")
                        yield Button("Force Pop Top Stack Frame (Undo)", id="btn_force_undo", variant="error")
                    yield Log(id="log-console")

        yield Footer()

    def on_mount(self) -> None:
        auth_tbl = self.query_one("#auth_methods_table", DataTable)
        auth_tbl.add_columns("Field", "Value")

        hh_tbl = self.query_one("#household_members_table", DataTable)
        hh_tbl.add_columns("Member ID", "User ID", "Full Name", "Email", "Turn Index")

    def get_headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.admin_token:
            headers["Authorization"] = f"Bearer {self.admin_token}"
        return headers

    def set_alert(self, msg: str) -> None:
        self.query_one("#alert-banner", Static).update(msg)

    def write_log(self, msg: str) -> None:
        self.query_one("#log-console", Log).write_line(msg)

    @on(Button.Pressed)
    def handle_buttons(self, event: Button.Pressed) -> None:
        btn_id = event.button.id

        if btn_id == "btn_set_context":
            self.admin_token = self.query_one("#token_input", Input).value.strip()
            self.selected_user_id = self.query_one("#user_id_input", Input).value.strip()
            self.selected_household_id = self.query_one("#household_id_input", Input).value.strip()
            self.set_alert(f"Admin Context Set -> User: {self.selected_user_id or 'None'} | Household: {self.selected_household_id or 'None'}")

        elif btn_id == "btn_inspect_auth":
            self.inspect_user_auth()

        elif btn_id == "btn_link_google":
            self.link_google_auth()

        elif btn_id == "btn_unlink_google":
            self.unlink_google_auth()

        elif btn_id == "btn_create_hh":
            self.create_household()

        elif btn_id == "btn_load_hh":
            self.load_household_profile()

        elif btn_id == "btn_add_member":
            self.add_household_member()

        elif btn_id == "btn_fetch_stack":
            self.fetch_activity_stack()

        elif btn_id == "btn_force_undo":
            self.force_undo_stack()

    # API Implementations

    def inspect_user_auth(self) -> None:
        if not self.selected_user_id:
            self.set_alert("⚠️ Target User UUID7 required!")
            return
        try:
            res = requests.get(f"{BASE_URL}/api/v1/auth/methods/{self.selected_user_id}", headers=self.get_headers())[cite: 1]
            if res.status_code == 200:
                data = res.json()
                tbl = self.query_one("#auth_methods_table", DataTable)
                tbl.clear()
                for k, v in data.items():
                    tbl.add_row(str(k), str(v))
                self.set_alert(f"Loaded Auth Methods for user {self.selected_user_id}")
            else:
                self.set_alert(f"Failed to fetch auth methods: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")

    def link_google_auth(self) -> None:
        cred = self.query_one("#link_cred_token", Input).value.strip()
        email = self.query_one("#link_email", Input).value.strip() or None
        name = self.query_one("#link_fullname", Input).value.strip() or None

        payload = {
            "user_id": self.selected_user_id or None,
            "credential_token": cred,
            "email": email,
            "full_name": name
        }
        try:
            res = requests.post(f"{BASE_URL}/api/v1/auth/link-google", json=payload, headers=self.get_headers())[cite: 1]
            if res.status_code == 200:
                self.set_alert("✅ Google Auth identity successfully linked!")
                self.inspect_user_auth()
            else:
                self.set_alert(f"Link Google Auth Failed: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")

    def unlink_google_auth(self) -> None:
        payload = {"user_id": self.selected_user_id or None}
        try:
            res = requests.post(f"{BASE_URL}/api/v1/auth/unlink-google", json=payload, headers=self.get_headers())[cite: 1]
            if res.status_code == 200:
                self.set_alert("✅ Google Auth identity unlinked!")
                self.inspect_user_auth()
            else:
                self.set_alert(f"Unlink Google Auth Failed: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")

    def create_household(self) -> None:
        name = self.query_one("#hh_name", Input).value.strip()
        try:
            res = requests.post(f"{BASE_URL}/api/v1/households/", json={"name": name}, headers=self.get_headers())[cite: 1]
            if res.status_code == 201:
                data = res.json()
                self.selected_household_id = data["id"]
                self.query_one("#household_id_input", Input).value = self.selected_household_id
                self.set_alert(f"✅ Created Household ID: {self.selected_household_id}")
                self.load_household_profile()
            else:
                self.set_alert(f"Household creation failed: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")

    def load_household_profile(self) -> None:
        if not self.selected_household_id:
            self.set_alert("⚠️ Target Household UUID7 required!")
            return
        try:
            res = requests.get(f"{BASE_URL}/api/v1/households/{self.selected_household_id}", headers=self.get_headers())[cite: 1]
            if res.status_code == 200:
                data = res.json()
                tbl = self.query_one("#household_members_table", DataTable)
                tbl.clear()
                for m in data.get("members", []):
                    tbl.add_row(m["id"], m["user_id"], m.get("user_full_name") or "-", m.get("user_email") or "-", str(m["turn_order_index"]))
                self.set_alert(f"Loaded Household: {data.get('name')}")
            else:
                self.set_alert(f"Failed to load household: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")

    def add_household_member(self) -> None:
        uid = self.query_one("#add_member_uid", Input).value.strip()
        idx_str = self.query_one("#add_member_idx", Input).value.strip()
        idx = int(idx_str) if idx_str.isdigit() else None

        payload = {"user_id": uid, "turn_order_index": idx}
        try:
            res = requests.post(f"{BASE_URL}/api/v1/households/{self.selected_household_id}/members", json=payload, headers=self.get_headers())[cite: 1]
            if res.status_code == 201:
                self.set_alert(f"✅ Member {uid} assigned to turn index {idx}!")
                self.load_household_profile()
            else:
                self.set_alert(f"Add Member Failed: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")

    def fetch_activity_stack(self) -> None:
        if not self.selected_household_id:
            self.set_alert("⚠️ Target Household UUID7 required!")
            return
        try:
            res = requests.get(f"{BASE_URL}/api/v1/expenses/{self.selected_household_id}/stack", headers=self.get_headers())[cite: 1]
            if res.status_code == 200:
                self.write_log("--- RAW ACTIVITY STACK SNAPSHOT ---")
                self.write_log(json.dumps(res.json(), indent=2))
                self.set_alert("Fetched LIFO stack frames to log console.")
            else:
                self.set_alert(f"Fetch Stack Failed: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")

    def force_undo_stack(self) -> None:
        if not self.selected_household_id:
            self.set_alert("⚠️ Target Household UUID7 required!")
            return
        try:
            res = requests.post(f"{BASE_URL}/api/v1/expenses/{self.selected_household_id}/undo", headers=self.get_headers())[cite: 1]
            if res.status_code == 200:
                data = res.json()
                self.set_alert(f"↩️ Popped Stack Frame: {data.get('message')}")
                self.write_log(f"Admin Force-Pop: {data}")
            else:
                self.set_alert(f"Force Undo Failed: {res.text}")
        except Exception as e:
            self.write_log(f"Error: {e}")


if __name__ == "__main__":
    app = AdminRouletteApp()
    app.run()