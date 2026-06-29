# Dev Workflow: GitHub Flow, No Staging, Manual Migrations

We use GitHub Flow (feature branches → `main` directly) with no staging environment. `main` is always production. Every PR runs CI (lint, typecheck, frontend tests, backend tests) before it can be merged. Vercel deploys both frontend and backend automatically on merge to `main`.

We deliberately skipped a staging environment. The test suite (615 tests at the time of this decision) provides enough confidence for direct-to-production merges, and the operational cost of a second environment (second backend deployment, second database, migration coordination) outweighs the safety benefit at current team size.

Database migrations are run manually by the developer immediately after merging any schema-changing PR. There is no automated migration step in the deploy pipeline — a bad migration running unattended against production is a worse outcome than the discipline cost of a manual step.

## Considered Options

**Gitflow (feature → develop → main):** Rejected. Adds a release-gating step that only makes sense when multiple features need to be batched before shipping. With a one-person team and continuous deployment, it's pure overhead.

**Staging environment:** Rejected for now. The right trigger to add it is a production incident that staging would have caught — not a preemptive investment at current scale.

**Automated migrations on deploy:** Rejected. The risk of an irreversible migration running automatically against production data outweighs the convenience.
