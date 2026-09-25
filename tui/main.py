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


class RoommateRouletteApp(App):
    TITLE = "🎲 Roommate Chore & Expense Roulette"
    SUB_TITLE = "DSA-Powered Household Management"

    CSS = """
    Screen {
        layout: vertical;
        background: $surface;
    }

    #session-bar {
        height: auto;
        padding: 1;
        background: $panel;
        border-bottom: heavy $primary;
    }

    .bar-input {
        width: 1fr;
        margin-right: 1;
    }

    #alert-banner {
        height: 3;
        background: $warning-muted;
        color: $warning-lighten-2;
        border: round $warning;
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
        border: inner $primary;
    }

    .section-title {
        text-style: bold;
        color: $accent;
        margin-bottom: 1;
    }
    """
    BINDINGS = [
        Binding("q", "quit", "Quit", show=True),
        Binding("r", "refresh_all", "Refresh Data", show=True),
        Binding("u", "undo_action", "Undo (LIFO Stack)", show=True),
    ]

    def __init__(self):
        super().__init__()
        self.auth_token = ""
        self.user_id = ""
        self.household_id = ""

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)

        # Active Session Control Panel
        with Horizontal(id="session-bar"):
            yield Input(placeholder="JWT Bearer Token", id="token_input", password=True, classes="bar-input")
            yield Input(placeholder="Active Household UUID7", id="household_id_input", classes="bar-input")
            yield Button("Set Session Context", id="btn_set_session", variant="primary")
            yield Button("Undo Last Action", id="btn_undo_top", variant="error")

        # Dynamic Sarcastic Alert System Display
        yield Static("🎲 Welcome! Authenticate or enter your Household ID to begin.", id="alert-banner")

        # Main Navigation Workspace
        with TabbedContent(initial="auth"):

            # 1. AUTHENTICATION TAB
            with TabPane("Auth", id="auth"):
                with ScrollableContainer(classes="form-container"):
                    yield Label("User Registration & Login (Bcrypt / JWT / Ed25519)", classes="section-title")
                    yield Input(placeholder="Email", id="auth_email", classes="form-input")
                    yield Input(placeholder="Password", id="auth_password", password=True, classes="form-input")
                    yield Input(placeholder="Full Name (for Registration)", id="auth_name", classes="form-input")
                    yield Input(placeholder="Ed25519 Hex Public Key (Optional)", id="auth_pubkey", classes="form-input")
                    with Horizontal(classes="form-row"):
                        yield Button("Register User", id="btn_register", variant="success")
                        yield Button("Login User", id="btn_login", variant="primary")

            # 2. HOUSEHOLDS TAB
            with TabPane("Households", id="households"):
                with ScrollableContainer(classes="form-container"):
                    yield Label("Create Household", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Input(placeholder="Household Name (e.g., Baker St Apartment)", id="hh_create_name", classes="bar-input")
                        yield Button("Create Household", id="btn_create_hh", variant="success")

                    yield Label("Add Member (Circular Queue Turn Index Assignment)", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Input(placeholder="Member User UUID7", id="hh_member_uid", classes="bar-input")
                        yield Input(placeholder="Turn Order Index (Optional)", id="hh_member_index", classes="bar-input")
                        yield Button("Add Member", id="btn_add_member", variant="primary")

                    yield Label("Current Household Profile & Members", classes="section-title")
                    yield DataTable(id="members_table")

            # 3. CHORES TAB (CIRCULAR QUEUE)
            
            with TabPane("Chores Queue", id="chores"):
                with Vertical(classes="table-container"):
                    yield Label("Circular Queue Ring Buffer Duty Rotation", classes="section-title")
                    with Horizontal(classes="form-row"):
                        yield Input(placeholder="Chore Title", id="chore_title", classes="bar-input")
                        yield Input(placeholder="Initial Assignee UUID7 (Optional)", id="chore_assignee", classes="bar-input")
                        yield Button("Create Chore", id="btn_create_chore", variant="success")
                        yield Button("Mark Done & Rotate", id="btn_rotate_chore", variant="primary")
                        yield Button("Pass Turn (Uncompleted)", id="btn_pass_turn", variant="warning")
                    yield DataTable(id="chores_table")

            # 4. EXPENSES & LEDGER TAB
            with TabPane("Expenses & Ledger", id="expenses"):
                with ScrollableContainer(classes="form-container"):
                    yield Label("Record Shared Expense", classes="section-title")
                    yield Input(placeholder="Payer User UUID7", id="exp_payer_id", classes="form-input")
                    yield Input(placeholder="Description", id="exp_desc", classes="form-input")
                    yield Input(placeholder="Total Amount ($)", id="exp_amount", classes="form-input")
                    yield Input(
                        placeholder='Splits JSON: [{"user_id": "...", "split_amount": 25.0}]',
                        id="exp_splits_json",
                        classes="form-input",
                    )
                    yield Button("Submit Shared Expense", id="btn_submit_expense", variant="success")

                    yield Label("Expense Ledger History", classes="section-title")
                    yield DataTable(id="expense_history_table")

            # 5. DEBT SIMPLIFICATION TAB (MIN-CASH-FLOW)
            with TabPane("Debt Simplification", id="settlement"):
                with Vertical(classes="table-container"):
                    yield Label("Net Balance Matrix (O(1) Hash Table Lookup)", classes="section-title")
                    yield DataTable(id="net_balances_table")
                    yield Label("Simplified Settlement Vectors (Min-Cash-Flow Greedy Directed Graph)", classes="section-title")
                    yield DataTable(id="simplified_debts_table")

            # 6. SYSTEM LOGS & LIFO STACK TAB
            with TabPane("System Stack & Logs", id="logs"):
                with Vertical(classes="table-container"):
                    yield Label("API Mutation Stack Logs (LIFO Rollback Engine)", classes="section-title")
                    yield Log(id="log-console")

        yield Footer()

    def on_mount(self) -> None:
        # Configure DataTables
        members_tbl = self.query_one("#members_table", DataTable)
        members_tbl.add_columns("Member ID", "User ID", "Full Name", "Email", "Turn Index")

        chores_tbl = self.query_one("#chores_table", DataTable)
        chores_tbl.add_columns("Chore ID", "Title", "Current Assignee", "Created At")
        chores_tbl.cursor_type = "row"

        exp_history_tbl = self.query_one("#expense_history_table", DataTable)
        exp_history_tbl.add_columns("Expense ID", "Payer Name", "Description", "Amount ($)", "Created At")

        bal_tbl = self.query_one("#net_balances_table", DataTable)
        bal_tbl.add_columns("User ID", "Display Name", "Net Balance ($)")

        simp_tbl = self.query_one("#simplified_debts_table", DataTable)
        simp_tbl.add_columns("Debtor (From)", "Creditor (To)", "Settlement Amount ($)")

    def get_headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    def set_alert(self, message: str) -> None:
        self.query_one("#alert-banner", Static).update(message)

    def write_log(self, message: str) -> None:
        self.query_one("#log-console", Log).write_line(message)

    # UI Event Handlers
    @on(Button.Pressed)
    def handle_button_clicks(self, event: Button.Pressed) -> None:
        btn_id = event.button.id

        if btn_id == "btn_set_session":
            self.auth_token = self.query_one("#token_input", Input).value.strip()
            self.household_id = self.query_one("#household_id_input", Input).value.strip()
            self.set_alert(f"Session Updated! Active Household: {self.household_id or 'None'}")
            self.action_refresh_all()

        elif btn_id == "btn_register":
            self.register_user()

        elif btn_id == "btn_login":
            self.login_user()

        elif btn_id == "btn_create_hh":
            self.create_household()

        elif btn_id == "btn_add_member":
            self.add_household_member()

        elif btn_id == "btn_create_chore":
            self.create_chore()

        elif btn_id == "btn_rotate_chore":
            self.rotate_selected_chore()

        elif btn_id == "btn_submit_expense":
            self.create_expense()

        elif btn_id == "btn_undo_top":
            self.action_undo_action()
        
        elif btn_id == "btn_rotate_chore":
            self.rotate_selected_chore(completed=True)
        elif btn_id == "btn_pass_turn":
            self.rotate_selected_chore(completed=False)


    def rotate_selected_chore(self, completed: bool = True) -> None:
        table = self.query_one("#chores_table", DataTable)
        if not table.row_count or table.cursor_row is None:
            self.set_alert("⚠️ Select a chore row first!")
            return

        row_key, _ = table.coordinate_to_cell_key(table.cursor_coordinate)
        chore_id = table.get_row(row_key)[0]

        payload = {
            "completed": completed,
            "skip_turn": False,
            "notes": "Turn passed" if not completed else "Completed"
        }

        try:
            res = requests.post(
                f"{BASE_URL}/api/v1/chores/{chore_id}/rotate",
                json=payload,
                headers=self.get_headers(),
            )
            if res.status_code == 200:
                data = res.json()
                alert = data.get("sarcastic_alert") or f"Turn shifted! Next up: {data.get('new_assignee_name')}"
                self.set_alert(f"🔄 {alert}")
                self.fetch_chores()
            else:
                self.set_alert(f"Chore Rotation Failed: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    def action_refresh_all(self) -> None:
        if not self.household_id:
            self.set_alert("⚠️ Active Household UUID7 required to sync data.")
            return

        self.fetch_household_details()
        self.fetch_chores()
        self.fetch_expense_history()
        self.fetch_balances()
        self.fetch_simplified_debts()

    # API Endpoint Integrations

    def register_user(self) -> None:
        email = self.query_one("#auth_email", Input).value.strip()
        password = self.query_one("#auth_password", Input).value.strip()
        full_name = self.query_one("#auth_name", Input).value.strip()
        pubkey = self.query_one("#auth_pubkey", Input).value.strip() or None

        payload = {"email": email, "password": password, "full_name": full_name, "ed25519_public_key": pubkey}
        try:
            res = requests.post(f"{BASE_URL}/api/v1/auth/register", json=payload, headers=self.get_headers())
            if res.status_code == 201:
                data = res.json()
                self.auth_token = data["access_token"]
                self.user_id = data["user_id"]
                self.query_one("#token_input", Input).value = self.auth_token
                self.set_alert(f"✅ User Registered! Assigned UUID7: {self.user_id}")
                self.write_log(f"Registered User {email} with ID {self.user_id}")
            else:
                self.set_alert(f"Registration Failed: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    def login_user(self) -> None:
        email = self.query_one("#auth_email", Input).value.strip()
        password = self.query_one("#auth_password", Input).value.strip()

        payload = {"email": email, "password": password}
        try:
            res = requests.post(f"{BASE_URL}/api/v1/auth/login", json=payload, headers=self.get_headers())
            if res.status_code == 200:
                data = res.json()
                self.auth_token = data["access_token"]
                self.user_id = data["user_id"]
                self.query_one("#token_input", Input).value = self.auth_token
                self.set_alert(f"✅ Authenticated successfully as User ID: {self.user_id}")
                self.write_log(f"User {email} logged in.")
            else:
                self.set_alert(f"Login Failed: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    def create_household(self) -> None:
        name = self.query_one("#hh_create_name", Input).value.strip()
        if not name:
            return
        try:
            res = requests.post(f"{BASE_URL}/api/v1/households/", json={"name": name}, headers=self.get_headers())
            if res.status_code == 201:
                data = res.json()
                self.household_id = data["id"]
                self.query_one("#household_id_input", Input).value = self.household_id
                self.set_alert(f"✅ Household Created! Household ID: {self.household_id}")
                self.action_refresh_all()
            else:
                self.set_alert(f"Create Household Error: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    def fetch_household_details(self) -> None:
        try:
            res = requests.get(f"{BASE_URL}/api/v1/households/{self.household_id}", headers=self.get_headers())
            if res.status_code == 200:
                data = res.json()
                table = self.query_one("#members_table", DataTable)
                table.clear()
                for m in data.get("members", []):
                    table.add_row(m["id"], m["user_id"], m.get("user_full_name") or "-", m.get("user_email") or "-", str(m["turn_order_index"]))
                self.write_log("Fetched household members profile.")
        except Exception as e:
            self.write_log(f"Error loading household profile: {e}")

    def add_household_member(self) -> None:
        uid = self.query_one("#hh_member_uid", Input).value.strip()
        idx_str = self.query_one("#hh_member_index", Input).value.strip()
        idx = int(idx_str) if idx_str.isdigit() else None

        payload = {"user_id": uid, "turn_order_index": idx}
        try:
            res = requests.post(f"{BASE_URL}/api/v1/households/{self.household_id}/members", json=payload, headers=self.get_headers())
            if res.status_code == 201:
                self.set_alert("✅ Member added to household circular queue!")
                self.fetch_household_details()
            else:
                self.set_alert(f"Add Member Failed: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    def fetch_chores(self) -> None:
        try:
            res = requests.get(f"{BASE_URL}/api/v1/chores/{self.household_id}", headers=self.get_headers())
            if res.status_code == 200:
                table = self.query_one("#chores_table", DataTable)
                table.clear()
                for c in res.json():
                    assignee = c.get("current_assignee_name") or c.get("current_assignee_id") or "Unassigned"
                    table.add_row(c["id"], c["title"], assignee, c["created_at"])
                self.write_log("Updated circular queue chore roster.")
        except Exception as e:
            self.write_log(f"Error fetching chores: {e}")

    def create_chore(self) -> None:
        title = self.query_one("#chore_title", Input).value.strip()
        assignee = self.query_one("#chore_assignee", Input).value.strip() or None

        payload = {"household_id": self.household_id, "title": title, "initial_assignee_id": assignee}
        try:
            res = requests.post(f"{BASE_URL}/api/v1/chores/", json=payload, headers=self.get_headers())
            if res.status_code == 201:
                self.set_alert(f"✅ Chore '{title}' added to Ring Buffer!")
                self.fetch_chores()
            else:
                self.set_alert(f"Create Chore Failed: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    def rotate_selected_chore(self) -> None:
        table = self.query_one("#chores_table", DataTable)
        if not table.row_count or table.cursor_row is None:
            self.set_alert("⚠️ Select a chore row to rotate!")
            return

        row_key, _ = table.coordinate_to_cell_key(table.cursor_coordinate)
        chore_id = table.get_row(row_key)[0]

        try:
            res = requests.post(
                f"{BASE_URL}/api/v1/chores/{chore_id}/rotate",
                json={"completed": True, "skip_turn": False},
                headers=self.get_headers(),
            )
            if res.status_code == 200:
                data = res.json()
                alert = data.get("sarcastic_alert") or f"Turn rotated! Next up: {data.get('new_assignee_name')}"
                self.set_alert(f"🔄 {alert}")
                self.fetch_chores()
            else:
                self.set_alert(f"Chore Rotation Failed: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    def create_expense(self) -> None:
        try:
            payer_id = self.query_one("#exp_payer_id", Input).value.strip()
            desc = self.query_one("#exp_desc", Input).value.strip()
            amount = float(self.query_one("#exp_amount", Input).value.strip())
            splits = json.loads(self.query_one("#exp_splits_json", Input).value.strip())

            payload = {
                "household_id": self.household_id,
                "payer_id": payer_id,
                "amount": amount,
                "description": desc,
                "splits": splits,
            }

            res = requests.post(f"{BASE_URL}/api/v1/expenses/", json=payload, headers=self.get_headers())
            if res.status_code == 201:
                self.set_alert("✅ Expense split recorded in ledger hash table!")
                self.action_refresh_all()
            else:
                self.set_alert(f"Expense Creation Failed: {res.text}")
        except Exception as e:
            self.set_alert(f"Invalid Expense JSON / Inputs: {e}")

    def fetch_expense_history(self) -> None:
        try:
            res = requests.get(f"{BASE_URL}/api/v1/expenses/{self.household_id}/history", headers=self.get_headers())
            if res.status_code == 200:
                table = self.query_one("#expense_history_table", DataTable)
                table.clear()
                for exp in res.json():
                    table.add_row(
                        exp["id"],
                        exp.get("payer_name") or exp["payer_id"],
                        exp["description"],
                        f"${exp['amount']:.2f}",
                        exp["created_at"],
                    )
                self.write_log("Loaded expense ledger history.")
        except Exception as e:
            self.write_log(f"Error loading expenses: {e}")

    def fetch_balances(self) -> None:
        try:
            res = requests.get(f"{BASE_URL}/api/v1/expenses/{self.household_id}/balances", headers=self.get_headers())
            if res.status_code == 200:
                data = res.json()
                table = self.query_one("#net_balances_table", DataTable)
                table.clear()
                names = data.get("user_names", {})
                for uid, bal in data.get("net_balances", {}).items():
                    table.add_row(uid, names.get(uid, "Unknown"), f"{bal:+.2f}")
                self.write_log("Fetched net balance hash table.")
        except Exception as e:
            self.write_log(f"Error fetching balances: {e}")

    def fetch_simplified_debts(self) -> None:
        try:
            res = requests.get(f"{BASE_URL}/api/v1/expenses/{self.household_id}/simplify", headers=self.get_headers())
            if res.status_code == 200:
                data = res.json()
                table = self.query_one("#simplified_debts_table", DataTable)
                table.clear()
                for tx in data.get("simplified_transactions", []):
                    from_user = tx.get("from_user_name") or tx["from_user_id"]
                    to_user = tx.get("to_user_name") or tx["to_user_id"]
                    table.add_row(from_user, to_user, f"${tx['amount']:.2f}")
                self.write_log("Calculated Min-Cash-Flow graph debt simplification.")
        except Exception as e:
            self.write_log(f"Error simplifying debts: {e}")

    def action_undo_action(self) -> None:
        if not self.household_id:
            self.set_alert("⚠️ Select a Household ID before invoking Undo.")
            return

        try:
            res = requests.post(f"{BASE_URL}/api/v1/expenses/{self.household_id}/undo", headers=self.get_headers())
            if res.status_code == 200:
                data = res.json()
                alert = data.get("sarcastic_alert") or data.get("message")
                self.set_alert(f"↩️ LIFO Stack Pop: {alert}")
                self.write_log(f"Popped undo stack. Remaining frames: {data.get('remaining_stack_size')}")
                self.action_refresh_all()
            else:
                self.set_alert(f"Undo Engine Failed: {res.text}")
        except Exception as e:
            self.write_log(f"API Error: {e}")

    

if __name__ == "__main__":
    app = RoommateRouletteApp()
    app.run()