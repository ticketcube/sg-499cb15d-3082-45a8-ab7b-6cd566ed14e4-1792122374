# Inventory Control Implementation Plan

This document outlines the plan to implement inventory control for game pools, ensuring that games cannot be oversold.

## Phase 1: Database Setup

**Goal:** Prepare the database to track game entries and handle atomic updates to player counts.

1.  **Create `gamepool_entries` Table:**
    *   A new table will be created to log every user's entry into a game pool. This is crucial for tracking who has joined which game and for historical data.
    *   **Schema:**
        ```sql
        create table gamepool_entries (
          id uuid primary key default uuid_generate_v4(),
          gamepool_id uuid references gamepools(id) on delete cascade,
          user_id uuid references auth.users(id) on delete cascade,
          quantity int not null default 1,
          stripe_checkout_id text,
          created_at timestamptz default now()
        );
        ```

2.  **Create Stored Procedure for Atomic Updates:**
    *   A PostgreSQL function (`increment_current_players`) will be created to update the `current_players` count in the `gamepools` table.
    *   This prevents race conditions where two users might purchase the last slot simultaneously. The database transaction ensures the update only happens if slots are available.
    *   **Function:**
        ```sql
        create or replace function increment_current_players(pool_id uuid, qty int)
        returns void as $$
        begin
          update gamepools
          set current_players = current_players + qty
          where id = pool_id
          and current_players + qty &lt;= max_players;
        end;
        $$ language plpgsql;
        ```

## Phase 1.5: Database Security

**Goal:** Secure the `gamepools`, `gamepool_entries`, and `stripe_prices` tables to prevent unauthorized client-side access. All sensitive operations will be moved to server-side API routes using the `service_role` key.

1.  **Enable Row Level Security (RLS):**
    *   RLS will be enabled for `gamepools`, `gamepool_entries`, and `stripe_prices` tables.

2.  **RLS Policies for `gamepools`:**
    *   A restrictive policy will be created to **block all** `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations from the client-side SDK. This ensures the table can only be modified by the backend service role.

3.  **RLS Policies for `gamepool_entries`:**
    *   **SELECT:** A policy will allow users to view **only their own** entries (`user_id = auth.uid()`).
    *   **INSERT, UPDATE, DELETE:** Restrictive policies will be created to **block all** write operations from the client. New entries will only be created via the secure Stripe webhook.

4.  **RLS Policies for `stripe_prices`:**
    *   A restrictive policy will be created to **block all** client access. This ensures pricing data can only be accessed through secure server-side API routes using the service role key.
    *   This prevents unauthorized access to sensitive pricing information and product details.

## Phase 2: Backend API Modifications

**Goal:** Update the server-side logic to enforce inventory limits before payment and to update inventory after successful payment.

1.  **Update Checkout Session API (`/api/stripe/checkout-session.ts`):**
    *   **Pre-Checkout Check:** Before creating a Stripe Checkout session, the API will query the `gamepools` table.
    *   **Validation:** It will verify if `current_players + requested_quantity &lt;= max_players`.
    *   **Error Handling:** If the game is full, the API will return an error message (e.g., "Sorry, this game is sold out!") and will not proceed to Stripe.
    *   **Metadata:** If slots are available, `gamepool_id`, `user_id`, and `quantity` will be embedded in the Stripe session's metadata.

2.  **Update Stripe Webhook Handler (`/api/stripe/webhook.ts`):**
    *   **Event:** The logic will trigger on the `checkout.session.completed` event from Stripe.
    *   **Actions:**
        1.  Parse the `gamepool_id`, `user_id`, and `quantity` from the session metadata.
        2.  Create a new record in the `gamepool_entries` table to log the purchase.
        3.  Call the `increment_current_players` database function via RPC to atomically update the player count for the specific `gamepool`.

## Phase 3: Frontend UI Implementation

**Goal:** Display real-time inventory information to the user and control their ability to join games.

1.  **Fetch and Display Game Pool Data (`pages/index.tsx`):**
    *   The page will fetch all active game pools from the `gamepools` table.
    *   For each game pool, it will display:
        *   The number of remaining slots (`max_players - current_players`).
        *   A "SOLD OUT" message if no slots are left.

2.  **Conditional "Join Game" Button:**
    *   The "Join Game" button will be disabled or hidden if `current_players &gt;= max_players`.
    *   The `onClick` handler will be updated to pass the `gamepool_id` and `quantity` to the checkout session API.

3.  **(Optional) Real-time Updates:**
    *   Implement Supabase Realtime subscriptions to listen for changes on the `gamepools` table.
    *   This will allow the UI to update the remaining slot count instantly for all users viewing the page, without requiring a manual refresh.
