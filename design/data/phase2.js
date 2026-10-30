// Seed for Releases and Deliveries: CI per environment and cross-project findings.
export const CI = { int: ['pass', 'run', 'queued'], stage: ['pass', 'pass', 'queued'], prod: ['pass', 'pass', 'pass'] };
export const CROSS = {
  'ITR-160': ['conflict', 'Shares config/env.ts with ITR-231 in JS SDK — a cross-project overlap, not just a branch conflict.', ['studio: config/env.ts', 'sdk: src/retry-envelope.ts'],
    'API Studio makes the retry budget resolvable per environment; the SDK reads that budget from a shape it pins at build time. Ship Studio first and every published SDK below 4.2 silently falls back to the old default — the API stops honouring what the client thinks it sent. These two have to move in the same release or the SDK needs a version guard first. That is a compatibility decision, so I am escalating rather than picking.'],
  'ITR-231': ['conflict', 'Pins the retry envelope that ITR-160 makes configurable. Same surface, opposite direction.', ['sdk: src/retry-envelope.ts', 'sdk: src/headers.ts'],
    'This branch hard-codes the retry budget into the outbound header. Combined with ITR-160 the header wins and the per-environment setting silently does nothing. Landing ITR-160 first and rebasing this on top resolves it, but that ordering changes what the SDK promises, so a human decides.'],
  'ITR-209': ['clean', 'Depends on the mailer wrapper from ITR-160, which is inside this delivery. Safe as long as the gate ships them together.', ['portal: auth/reset.ts', 'portal: mailer/send.test.ts'],
    'The dependency is satisfied inside this change-set, which is exactly what a gated delivery is for. If ITR-160 is pulled out of the delivery, this becomes a conflict. I would re-run then.'],
  'ITR-118': ['clean', 'Self-contained inside API Studio. No paths shared with the other three.', ['studio: auth/oauth-redirect.ts', 'studio: auth/callback.ts'],
    'Only shared import is the auth session type, which nothing else in the delivery touches. Blast radius is the Studio sign-in page.'],
  'ITR-241': ['conflict', 'Still under an open escalation. The gate cannot be evaluated until the rebase lands.', ['studio: queue/retry.ts'],
    'I stopped on this card two hours ago because origin/main moved underneath it. Until a human resolves which backoff strategy wins, any assessment I give of the combined change-set would be against a baseline that is about to change.'],
  'ITR-095': ['clean', 'UI-only inside API Studio.', ['studio: ui/deploy/RollbackButton.tsx'],
    'Front-end only behind an existing permission check. Independent of the queue work it ships beside.'],
};
