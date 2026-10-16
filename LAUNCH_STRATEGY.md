# Launch Strategy & Project Architecture

This document serves as a comprehensive brief for AI agents (like Claude) to understand the project's brand hierarchy, technical stack, current state, and overall launch strategy.

## 1. Brand Hierarchy & Ecosystem
The platform operates as a multi-brand ecosystem under a unifying golf philosophy, rather than a single monolithic app.

*   **Minimum Viable Golf (MVG)** (`/mvg`): The parent brand and overarching philosophy inspired by Silicon Valley (build, iterate, improve). It acts as the content and educational hub covering the Physical, Mental, and Emotional disciplines of golf.
*   **GolfMusic** (`/golfmusic`): A media property/podcast series exploring the intersection of golfers and musicians. Designed for top-of-funnel audience building through unscripted 15-minute conversational episodes (video/audio).
*   **The Four Under Club (4unders)** (`/` and `/4unders`): A premium, monetized community addressing pace-of-play. Members pay a premium (via Stripe) to guarantee a sub-4-hour round at municipal courses like Rancho Park. Features a waitlist and a multi-step vetting survey.
*   **4Points**: The underlying proprietary game and scoring system powering the events. Features game creation, live scoring, leaderboards, and round data tracking (`/game`, `/scores`, `/leaderboard`, `/rounddata`).

## 2. Technical Architecture
*   **Frontend**: Next.js 15.2 (Pages Router) + React 18.
*   **Styling**: Tailwind CSS v3.4 + shadcn/ui components + Framer Motion for fluid landing page animations.
*   **Backend (BaaS)**: Supabase.
    *   *Auth*: Supabase Auth.
    *   *Database*: PostgreSQL with strict Row Level Security (RLS). Key tables include `profiles`, `scores`, `gamepools`, `gamepool_entries`, `survey_responses`, and `stripe_prices`.
*   **Monetization & Inventory**: Stripe checkout (`/api/stripe/checkout-session`, webhooks) tightly coupled to Supabase `gamepools` for inventory control (preventing overselling of tournament slots).

## 3. Current Implementation Status
*   **Marketing Surfaces**: High-converting landing pages for MVG, GolfMusic, and 4unders are built and active.
*   **Onboarding Funnel**: 4unders includes a multi-step survey funnel capturing player habits (round duration, typical scores, willingness to pay a premium) before funneling to a paid Stripe checkout or a free waitlist.
*   **Inventory Control (In Progress)**: Per `PLAN.md`, an atomic inventory system is currently being implemented using PostgreSQL stored procedures (`increment_current_players`) to safely manage limited tournament spots and log purchases via Stripe webhooks.

## 4. Strategic Launch Plan
To successfully orchestrate the launch across all four brands, follow this phased approach:

### Phase 1: Audience & Community Building (Top Funnel)
*   **Action**: Push **GolfMusic** and **MVG** content. Use GolfMusic's Google Calendar integration to rapidly record and publish 15-minute chats.
*   **Goal**: Drive organic traffic to the platform and establish the brand voice without immediately asking for payment.

### Phase 2: Scarcity & Monetization (Mid Funnel)
*   **Action**: Heavily promote the **Four Under Club** waitlist. Launch the first limited-slot event at Rancho Park.
*   **Goal**: Test price elasticity (willingness to pay 2x greens fees for a guaranteed 4-hour round). Ensure the Stripe + Supabase inventory system perfectly handles the checkout flow and cuts off sales when capacity (e.g., 48 players) is reached.

### Phase 3: Product Execution & Retention (Bottom Funnel)
*   **Action**: Utilize the **4Points** scoring system during the actual Four Under Club events.
*   **Goal**: Transition users from a community/waitlist mindset into active application users. Ensure the `/game` and `/leaderboard` pages are robust, mobile-friendly (for on-course use), and reliably sync to Supabase.

### Next Technical Priorities for Claude:
1.  Verify the completion of the Stripe Webhook to Supabase `gamepool_entries` atomic increment logic (Phase 2/3 of `PLAN.md`).
2.  Ensure RLS policies are strictly enforced on all new transaction tables to prevent client-side manipulation.
3.  Audit the 4Points scoring flow (`/game`) to ensure it is ready for live, concurrent usage during the first 4unders tournament.