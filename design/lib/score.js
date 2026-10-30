// Composite priority score (0-100) and AI labelling rules, as specified in the handoff.
export function scoreParts(it) {
  const votes = Math.round(Math.min(it.votes, 220) / 220 * 45);
  const impact = Math.round(it.impact / 10 * 32);
  const effort = Math.round((11 - it.effort) / 10 * 16);
  return { votes, impact, effort, total: votes + impact + effort };
}
export const scoreOf = it => scoreParts(it).total;

export function tagsFor(it) {
  const t = [it.cat.toLowerCase()];
  if (it.impact >= 8) t.push('high-impact');
  if (it.effort <= 3) t.push('quick-win');
  if (it.assignee === 'claude') t.push('agent-owned');
  if (it.cat === 'Bug' && it.impact >= 8) t.push('regression-risk');
  return t.slice(0, 3);
}

export const TAG_TONE = {
  'high-impact': 'warn', 'agent-owned': 'agent', 'regression-risk': 'red', 'quick-win': 'green',
};
