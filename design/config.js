// Product switches. Visual tokens live in theme.css, behaviour switches live here.
export const CONFIG = {
  density: 'comfortable',      // 'comfortable' | 'compact' (board card padding)
  showAiScore: true,           // score pill on board cards
  requireHumanSignoff: true,   // production: server-enforced policy, not a UI flag
  apiHost: 'api.nostackai.com',
  latencyMs: 180,              // mock API delay
  stepMs: 780,                 // live session step interval
  triageMs: 1900,
};
