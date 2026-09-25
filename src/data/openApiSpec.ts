/**
 * OpenAPI 3.1.0 Specification definition for Roommate Chore & Expense Roulette
 * Replicates FastAPI automatic OpenAPI documentation.
 */

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  description: string;
  schema: {
    type: string;
    example?: string | number | boolean;
  };
}

export interface OpenApiResponse {
  statusCode: string;
  description: string;
  schemaRef?: string;
  example?: any;
}

export interface OpenApiEndpoint {
  id: string;
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  tag: string;
  summary: string;
  description: string;
  security?: boolean;
  parameters?: OpenApiParameter[];
  requestBody?: {
    schemaRef: string;
    example: any;
  };
  responses: OpenApiResponse[];
}

export interface OpenApiSchemaProperty {
  type: string;
  description?: string;
  example?: any;
  items?: { type: string; format?: string };
}

export interface OpenApiSchema {
  title: string;
  type: string;
  required?: string[];
  properties: Record<string, OpenApiSchemaProperty>;
}

export const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Roommate Chore & Expense Roulette API',
    version: '1.0.0',
    description:
      'A production-ready FastAPI backend for roommate chore circular queue rotation, expense ledger hash maps, directed graph min-cash-flow debt simplification, LIFO undo stack, and dynamic sarcastic alerts.',
    contact: {
      name: 'Engineering Team',
      email: 'engineering@roommate-roulette.local',
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Local Development Server (Uvicorn / SQLite Async)',
    },
    {
      url: 'https://api.roommate-roulette.local',
      description: 'Production API Gateway',
    },
  ],
  tags: [
    {
      name: 'Chores & Circular Queue',
      description:
        'Deterministic circular queue ring buffer duty rotations, lookahead assignment prediction, and Sarcastic Alert triggers.',
    },
    {
      name: 'Expenses & Debt Simplification',
      description:
        'Hash Table expense ledger, greedy directed graph debt simplification (Min-Cash-Flow), and LIFO activity undo stack.',
    },
    {
      name: 'Authentication',
      description:
        'Bcrypt password hashing, PyJWT bearer tokens, Google OAuth2 token verification, and Ed25519 public key cryptographic challenge-response authentication.',
    },
    {
      name: 'Households & Memberships',
      description:
        'Household entity management and circular queue turn index registration for roommates.',
    },
    {
      name: 'Health',
      description: 'System liveness and readiness monitoring endpoints.',
    },
  ],
  endpoints: [
    {
      id: 'chores_rotate',
      method: 'post' as const,
      path: '/api/v1/chores/{chore_id}/rotate',
      tag: 'Chores & Circular Queue',
      summary: 'Rotate chore assignee via Circular Queue',
      description:
        'Advances pointer index by (index + 1) % N. If user attempts to skip turn or marks chore incomplete, fires a humorous Sarcastic Alert and logs mutation to persistent ActivityStackLog for reversible undo.',
      parameters: [
        {
          name: 'chore_id',
          in: 'path' as const,
          required: true,
          description: 'RFC 9562 UUIDv7 of target chore',
          schema: { type: 'string', example: '018e6e5a-8001-7b3c-9a11-111111111111' },
        },
      ],
      requestBody: {
        schemaRef: '#/components/schemas/ChoreRotateRequest',
        example: {
          completed: true,
          skip_turn: false,
          notes: 'Scrubbed dishes, wiped counter and sink thoroughly.',
        },
      },
      responses: [
        {
          statusCode: '200',
          description: 'Successful turn rotation',
          schemaRef: '#/components/schemas/ChoreRotateResponse',
          example: {
            chore_id: '018e6e5a-8001-7b3c-9a11-111111111111',
            chore_title: 'Kitchen Dishes & Sink Sanitization',
            previous_assignee_id: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
            previous_assignee_name: 'Alice Chen',
            new_assignee_id: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02',
            new_assignee_name: 'Bob Martinez',
            rotation_successful: true,
            sarcastic_alert: null,
            queue_state: {
              members: [
                '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
                '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02',
                '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03',
                '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04',
              ],
              current_index: 1,
              current_assignee: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02',
              next_assignee: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03',
              total_members: 4,
            },
          },
        },
        {
          statusCode: '404',
          description: 'Chore entity not found in database',
        },
      ],
    },
    {
      id: 'expenses_simplify',
      method: 'get' as const,
      path: '/api/v1/expenses/{household_id}/simplify',
      tag: 'Expenses & Debt Simplification',
      summary: 'Min-Cash-Flow Greedy Directed Graph Debt Simplification',
      description:
        'Executes O(N log N) greedy bipartite graph reduction. Compresses multi-party circular roommate debts into at most N - 1 minimal settlement transactions with strict zero-sum conservation.',
      parameters: [
        {
          name: 'household_id',
          in: 'path' as const,
          required: true,
          description: 'Target Household UUID7 identifier',
          schema: { type: 'string', example: '018e6e5a-73c0-7f2a-8c11-001122334455' },
        },
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Simplified settlement vectors',
          schemaRef: '#/components/schemas/SimplifiedDebtResponse',
          example: {
            household_id: '018e6e5a-73c0-7f2a-8c11-001122334455',
            net_balances: {
              '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01': 75.0,
              '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02': 15.0,
              '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03': -25.0,
              '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04': -65.0,
            },
            simplified_transactions: [
              {
                from_user_id: '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04',
                from_user_name: 'Diana Prince',
                to_user_id: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
                to_user_name: 'Alice Chen',
                amount: 65.0,
              },
              {
                from_user_id: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03',
                from_user_name: 'Charlie Kim',
                to_user_id: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02',
                to_user_name: 'Bob Martinez',
                amount: 15.0,
              },
              {
                from_user_id: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03',
                from_user_name: 'Charlie Kim',
                to_user_id: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
                to_user_name: 'Alice Chen',
                amount: 10.0,
              },
            ],
            original_transactions_count: 10,
            simplified_transactions_count: 3,
            transactions_eliminated: 7,
            efficiency_gain_percent: 70.0,
            algorithm_applied: 'Min-Cash-Flow Greedy Directed Graph Reduction',
          },
        },
      ],
    },
    {
      id: 'expenses_balances',
      method: 'get' as const,
      path: '/api/v1/expenses/{household_id}/balances',
      tag: 'Expenses & Debt Simplification',
      summary: 'Retrieve Net Balance Vector (Hash Tables)',
      description:
        'Calculates net balance for every roommate using in-memory Hash Maps (O(1)). Returns net amount owed to or by each person.',
      parameters: [
        {
          name: 'household_id',
          in: 'path' as const,
          required: true,
          description: 'Household UUID7 identifier',
          schema: { type: 'string', example: '018e6e5a-73c0-7f2a-8c11-001122334455' },
        },
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Net balance vector',
          schemaRef: '#/components/schemas/BalancesResponse',
          example: {
            household_id: '018e6e5a-73c0-7f2a-8c11-001122334455',
            net_balances: {
              '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01': 75.0,
              '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02': 15.0,
              '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03': -25.0,
              '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04': -65.0,
            },
            user_names: {
              '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01': 'Alice Chen',
              '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02': 'Bob Martinez',
              '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03': 'Charlie Kim',
              '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04': 'Diana Prince',
            },
            is_balanced: true,
            total_household_spend: 220.0,
          },
        },
      ],
    },
    {
      id: 'expenses_create',
      method: 'post' as const,
      path: '/api/v1/expenses/',
      tag: 'Expenses & Debt Simplification',
      summary: 'Record shared expense and splits',
      description:
        'Registers expense entity with splits in SQLite. Pushes mutation snapshot onto LIFO ActivityStackLog for reversible rollback.',
      requestBody: {
        schemaRef: '#/components/schemas/ExpenseCreate',
        example: {
          household_id: '018e6e5a-73c0-7f2a-8c11-001122334455',
          payer_id: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
          amount: 80.0,
          description: 'Costco Household Essentials',
          splits: [
            { user_id: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01', split_amount: 20.0 },
            { user_id: '018e6e5a-73c2-7b2c-9a1b-2b3c4d5e6f02', split_amount: 20.0 },
            { user_id: '018e6e5a-73c3-7c3d-9b2c-3c4d5e6f7a03', split_amount: 20.0 },
            { user_id: '018e6e5a-73c4-7d4e-9c3d-4d5e6f7a8b04', split_amount: 20.0 },
          ],
        },
      },
      responses: [
        {
          statusCode: '201',
          description: 'Expense created successfully',
          schemaRef: '#/components/schemas/ExpenseResponse',
        },
      ],
    },
    {
      id: 'expenses_undo',
      method: 'post' as const,
      path: '/api/v1/expenses/{household_id}/undo',
      tag: 'Expenses & Debt Simplification',
      summary: 'Undo most recent action (LIFO Stack Engine)',
      description:
        'Pops the topmost frame from the activity stack log (LIFO) and executes reversing database mutations.',
      parameters: [
        {
          name: 'household_id',
          in: 'path' as const,
          required: true,
          description: 'Target Household UUID7',
          schema: { type: 'string', example: '018e6e5a-73c0-7f2a-8c11-001122334455' },
        },
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Undo result',
          schemaRef: '#/components/schemas/UndoResponse',
          example: {
            success: true,
            undone_action_type: 'CREATE_EXPENSE',
            message: "Reversed creation of expense 'Costco Household Essentials' ($80.00).",
            sarcastic_alert: null,
            remaining_stack_size: 2,
          },
        },
      ],
    },
    {
      id: 'auth_register',
      method: 'post' as const,
      path: '/api/v1/auth/register',
      tag: 'Authentication',
      summary: 'Register new user account',
      description:
        'Registers user with RFC 9562 UUIDv7, Bcrypt salted hash, and optional Ed25519 public key. Issues HS256 JWT bearer token.',
      requestBody: {
        schemaRef: '#/components/schemas/UserRegisterRequest',
        example: {
          email: 'new_roommate@apartment4b.com',
          password: 'supersecretpassword123',
          full_name: 'Elena Rostova',
          ed25519_public_key: 'e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
        },
      },
      responses: [
        {
          statusCode: '201',
          description: 'User registered and JWT issued',
          schemaRef: '#/components/schemas/TokenResponse',
        },
      ],
    },
    {
      id: 'auth_login',
      method: 'post' as const,
      path: '/api/v1/auth/login',
      tag: 'Authentication',
      summary: 'Bcrypt password login',
      description:
        'Validates plaintext password against bcrypt hash and returns JWT bearer token.',
      requestBody: {
        schemaRef: '#/components/schemas/UserLoginRequest',
        example: {
          email: 'alice@apartment4b.com',
          password: 'password123',
        },
      },
      responses: [
        {
          statusCode: '200',
          description: 'Login successful',
          schemaRef: '#/components/schemas/TokenResponse',
        },
      ],
    },
    {
      id: 'auth_link_google',
      method: 'post' as const,
      path: '/api/v1/auth/link-google',
      tag: 'Authentication',
      summary: 'Link Google Auth as alternative login method',
      description:
        'Attaches Google OAuth2 identity to an existing account, guaranteeing zero conflict and preserving existing UUID7 data.',
      requestBody: {
        schemaRef: '#/components/schemas/LinkGoogleAuthRequest',
        example: {
          user_id: '018e6e5a-73c1-7a1b-9f0a-1a2b3c4d5e01',
          credential_token: 'ya29.sample_google_id_token_xyz',
          email: 'alice.chen@gmail.com',
          full_name: 'Alice Chen',
        },
      },
      responses: [
        {
          statusCode: '200',
          description: 'Google linked successfully',
          schemaRef: '#/components/schemas/LinkGoogleAuthResponse',
        },
      ],
    },
  ],
  schemas: {
    UserRegisterRequest: {
      title: 'UserRegisterRequest',
      type: 'object',
      required: ['email', 'password', 'full_name'],
      properties: {
        email: { type: 'string', description: 'Valid RFC 5322 email string' },
        password: { type: 'string', description: 'Plaintext password (min 6 characters)' },
        full_name: { type: 'string', description: 'Display name for roommate' },
        ed25519_public_key: {
          type: 'string',
          description: 'Optional 32-byte Ed25519 hex public key (64 chars)',
        },
      },
    },
    ChoreRotateRequest: {
      title: 'ChoreRotateRequest',
      type: 'object',
      properties: {
        completed: { type: 'boolean', description: 'Whether chore duty was completed' },
        skip_turn: { type: 'boolean', description: 'Whether roommate attempted to pass/skip' },
        notes: { type: 'string', description: 'Optional turn notes or remarks' },
      },
    },
    ChoreRotateResponse: {
      title: 'ChoreRotateResponse',
      type: 'object',
      properties: {
        chore_id: { type: 'string' },
        chore_title: { type: 'string' },
        previous_assignee_id: { type: 'string' },
        previous_assignee_name: { type: 'string' },
        new_assignee_id: { type: 'string' },
        new_assignee_name: { type: 'string' },
        rotation_successful: { type: 'boolean' },
        sarcastic_alert: { type: 'string' },
        queue_state: { type: 'object' },
      },
    },
    SimplifiedDebtResponse: {
      title: 'SimplifiedDebtResponse',
      type: 'object',
      properties: {
        household_id: { type: 'string' },
        net_balances: { type: 'object' },
        simplified_transactions: { type: 'array', items: { type: 'object' } },
        original_transactions_count: { type: 'integer' },
        simplified_transactions_count: { type: 'integer' },
        transactions_eliminated: { type: 'integer' },
        efficiency_gain_percent: { type: 'number' },
        algorithm_applied: { type: 'string' },
      },
    },
  },
};
