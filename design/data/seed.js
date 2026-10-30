const PEOPLE = {
  maya:{name:'Maya Okonkwo',role:'Product owner',initials:'MO',hue:250},
  devin:{name:'Devin Reyes',role:'Engineer',initials:'DR',hue:196},
  sana:{name:'Sana Iqbal',role:'Engineer',initials:'SI',hue:320},
  tom:{name:'Tom Vlček',role:'Engineer',initials:'TV',hue:150},
  claude:{name:'Claude',role:'AI agent',initials:'✦',ai:true},
  system:{name:'nostackai',role:'System',initials:'○',sys:true}
};

const PROJECTS = [
  {id:'studio', name:'API Studio', short:'STU', hue:250},
  {id:'portal', name:'Client Portal', short:'POR', hue:300},
  {id:'sdk', name:'JS SDK', short:'SDK', hue:190},
  {id:'billing', name:'Billing', short:'BIL', hue:100}
];

const GROUPS = [
  {id:'platform', name:'Platform', projects:['studio','sdk']},
  {id:'customer', name:'Customer-facing', projects:['portal','billing']},
  {id:'compliance', name:'Compliance push', projects:['studio','billing']}
];

const DELIVERIES = [
  {id:'DLV-04', name:'Q3 auth hardening', mode:'gated', items:['ITR-118','ITR-160','ITR-231','ITR-209'],
   note:'One combined release gate. Everything ships together or nothing does.'},
  {id:'DLV-05', name:'Webhook durability', mode:'gated', items:['ITR-241','ITR-095'],
   note:'Blocked on the ITR-241 escalation before the gate can run.'},
  {id:'DLV-03', name:'September customer-visible', mode:'rollup', items:['ITR-104','ITR-133','ITR-166','ITR-087','ITR-152'],
   note:'Visibility only. Each project ships on its own cadence.'}
];

const DEPENDS = {
  'ITR-160':[['ITR-231','Retry budget headers on outbound webhooks'],['ITR-241','Webhook retry queue durability']],
  'ITR-231':[['ITR-160','Per-environment variable overrides']],
  'ITR-118':[['ITR-166','Per-project rate limit editor']],
  'ITR-104':[['ITR-087','API keys page shows revoked keys as active']]
};

const ITEM_PROJECT = {
  'ITR-118':'studio','ITR-241':'studio','ITR-104':'portal','ITR-196':'studio','ITR-152':'studio',
  'ITR-133':'portal','ITR-087':'studio','ITR-209':'portal','ITR-171':'sdk','ITR-188':'portal',
  'ITR-160':'studio','ITR-145':'sdk','ITR-063':'studio','ITR-071':'billing','ITR-095':'studio',
  'ITR-231':'sdk','ITR-166':'billing','ITR-212':'portal','ITR-118b':'studio','ITR-224':'studio',
  'ITR-137':'portal','ITR-178':'portal','ITR-205':'billing','ITR-149':'studio'
};

const PERMS = [
  ['Requester','Submit and vote in the portal',[true,false,false,false,false]],
  ['Dev','Own cards, run agents, sign off review items',[true,true,true,false,false]],
  ['Owner','Full project access',[true,true,true,true,true]],
  ['Agent','Read and propose only — never signs off',[true,true,false,false,false]]
];
const PERM_COLS = ['View','Edit items','Sign off','Release','Invite'];

const NOTIFS = [
  ['assigned','Item assigned to me',[true,true,false]],
  ['blocked','Blocked or escalated',[true,true,true]],
  ['review','Review requested',[true,false,false]],
  ['signoff','Sign-off needed from me',[true,true,false]],
  ['release','Release cleared',[false,true,false]],
  ['digest','Weekly retro digest',[false,false,true]]
];
const NOTIF_COLS = ['In app','Slack','Email'];

const BACKLOG = (function(){
  const subjects = ['API keys','webhook endpoints','usage reports','request logs','environment variables',
    'generated endpoints','MCP tools','rate limits','team members','audit events','saved queries','schema versions',
    'deploy history','error traces','billing invoices','portal submissions','review checklists','agent runs',
    'branch policies','test fixtures','custom domains','service accounts','retry policies','cache rules',
    'SDK snippets','type definitions','webhook signatures','usage alerts','cost breakdowns','tax profiles',
    'seat assignments','SSO mappings','API versions','changelog entries','status pages','support tickets',
    'feature flags','experiment groups','data exports','import jobs','scheduled tasks','background workers',
    'secret rotations','IP allowlists','session tokens','device sessions','role templates','project templates',
    'notification rules','dashboard widgets'];
  const patterns = [
    ['Bulk edit for ', 4], ['Search across ', 3], ['CSV export for ', 3],
    ['Keyboard shortcuts for ', 2], ['Audit trail for ', 5], ['Granular permissions on ', 6]
  ];
  const emails = ['lena@northwind.io','ops@fieldkit.dev','r.mbeki@atlaspay.co','dev@sondercloud.com',
    'tsai@brightloop.io','k.dolan@nine9.app','it@brightloop.io','finance@atlaspay.co'];
  const cats = ['Feature','Feature','Bug','Performance','Feature','Docs'];
  let x = 7717; const rnd = () => { x = (x*1103515245+12345) % 2147483648; return x/2147483648; };
  const out = [];
  patterns.forEach((pt,pi) => subjects.slice(0,20).forEach((sub,si) => {
    const n = pi*subjects.length+si;
    out.push({
      id:'PD-'+(1000+n), title:pt[0]+sub, cat:cats[(pi+si)%cats.length],
      votes:1+Math.floor(rnd()*190), lane:'backlog', assignee:null, branch:null,
      pill:'Unassigned', pillKind:'idle',
      impact:1+Math.floor(rnd()*10), effort:Math.max(1,Math.min(10, pt[1]+Math.floor(rnd()*4)-1)),
      bucket:['backlog','next','later'][Math.floor(rnd()*3)],
      submitter:emails[(si*3+pi)%emails.length], days:1+Math.floor(rnd()*180),
      voted:false, signed:{}, project:PROJECTS[(si+pi*2)%4].id, synthetic:true
    });
  }));
  return out;
})();

const CREW = {
  'ITR-118':['maya',[['claude','coding'],['devin','pairing']]],
  'ITR-241':['maya',[['claude','blocked'],['devin','resolving']]],
  'ITR-104':['maya',[['claude','review requested'],['devin','reviewing']]],
  'ITR-196':['tom',[['claude','writing tests']]],
  'ITR-152':['devin',[['tom','coding']]],
  'ITR-133':['tom',[['sana','queued']]],
  'ITR-087':['sana',[['devin','testing'],['claude','watching CI']]],
  'ITR-209':['sana',[['claude','awaiting sign-off']]],
  'ITR-171':['maya',[['sana','queued']]],
  'ITR-188':['tom',[['claude','queued']]],
  'ITR-160':['maya',[['claude','review requested']]],
  'ITR-145':['sana',[['tom','coding'],['claude','pairing']]],
  'ITR-063':['devin',[['claude','shipped']]],
  'ITR-071':['maya',[['devin','shipped']]],
  'ITR-095':['devin',[['sana','shipped'],['claude','tests']]],
  'ITR-231':['devin',[['claude','staged'],['sana','reviewed']]],
  'ITR-166':['maya',[['sana','staged']]]
};

const SPRINT_PAST = [
  {name:'Sprint 23',range:'Aug 11 – Aug 22',shipped:11,planned:13},
  {name:'Sprint 22',range:'Jul 28 – Aug 8',shipped:9,planned:12},
  {name:'Sprint 21',range:'Jul 14 – Jul 25',shipped:12,planned:12},
  {name:'Sprint 20',range:'Jun 30 – Jul 11',shipped:7,planned:11}
];

const SPRINT_ACTIVE = {
  name:'Sprint 24', range:'Aug 25 – Sep 5', days:10, elapsed:5, planned:14,
  goal:'Ship the Safari auth fix, land the MCP endpoint browser behind a flag, and clear the webhook durability escalation.'
};

const TEAM_ROWS = [
  ['maya','Product owner','active','maya@nostackai.com','Owner'],
  ['devin','Dev','active','devin@nostackai.com','Edit'],
  ['sana','Dev','active','sana@nostackai.com','Edit'],
  ['tom','Dev','away','tom@nostackai.com','Edit'],
  ['claude','Agent','read-only','claude-code · operator: Maya','Locked']
];

const INVITES = [
  {email:'r.mbeki@atlaspay.co',role:'Requester',sent:'Invited 2 days ago'},
  {email:'nadia@brightloop.io',role:'Dev',sent:'Invited 6 hours ago'}
];

const CYCLE_BUCKETS = [['<1d',3],['1–2d',7],['2–3d',9],['3–5d',6],['5–8d',3],['8d+',2]];
const BURN = [0,1,1,2,3,3,4,5,6,6,7,8,9,10,11];

const CFD90 = (function(){
  let x = 20260831; const rnd = () => { x = (x*1103515245+12345) % 2147483648; return x/2147483648; };
  const out = []; let backlog = 24, done = 0;
  for (let i=0;i<90;i++){
    const assigned = 2+Math.floor(rnd()*3);
    const prog = 2+Math.floor(rnd()*3);
    const review = 1+Math.floor(rnd()*3);
    const test = 1+Math.floor(rnd()*2);
    const staged = Math.floor(rnd()*3);
    if (rnd() > 0.42) done += 1;
    if (rnd() > 0.72 && backlog > 6) backlog -= 1;
    if (rnd() > 0.93) backlog += 2;
    out.push([backlog, assigned, prog, review, test, staged, done]);
  }
  return out;
})();

const PREFLIGHT = [
  ['ITR-095','Rollback button on the deploy view','clean','UI-only. No shared paths with the rest of the staged set.',
   ['ui/deploy/RollbackButton.tsx','ui/deploy/index.tsx'],
   'Front-end only, behind the existing deploy permission check. I verified the rollback endpoint it calls is already live in production, so this cannot ship a dead button. Safe to release in any order.'],
  ['ITR-166','Per-project rate limit editor','clean','Touches the limits table and its editor. No overlap with the rest of the set.',
   ['api/limits/store.ts','ui/settings/LimitsEditor.tsx'],
   'The migration it carries is additive — a new nullable column — so it can land before or after the others without a data dependency. The only shared file is the settings route index, and the change there is a single import line.'],
  ['ITR-160','Per-environment variable overrides','conflict','Shares config/env.ts and queue/retry.ts with ITR-231 and with the in-flight webhook durability work.',
   ['config/env.ts','mailer/send.ts','queue/retry.ts'],
   'This branch changes how every environment resolves config, so it sits underneath the others. It also touches queue/retry.ts, which ITR-241 is still rebasing onto. If it ships before that rebase lands I have to redo the conflict resolution against a moved baseline, which is where I start guessing.'],
  ['ITR-231','Retry budget headers on outbound webhooks','conflict','Shares queue/retry.ts with ITR-160. Both change the retry envelope, in incompatible ways.',
   ['queue/retry.ts','queue/headers.ts','queue/retry.test.ts'],
   'ITR-160 makes the retry budget configurable per environment; this branch hard-codes it into the outbound header. Released together the header wins and the per-environment setting silently does nothing — no error, just an ignored config value. Landing ITR-160 first and rebasing this one on top resolves it, but that ordering is a product call.']
];

const LANES = [
  {id:'backlog',label:'Backlog',hue:265,chroma:0.004,wip:''},
  {id:'assigned',label:'Assigned',hue:250,chroma:0.05,wip:'4 max'},
  {id:'inprogress',label:'In Progress',hue:62,chroma:0.09,wip:'3 max'},
  {id:'review',label:'Code Review',hue:300,chroma:0.06,wip:''},
  {id:'testing',label:'Integration Testing',hue:200,chroma:0.06,wip:''},
  {id:'staged',label:'Staged',hue:225,chroma:0.028,wip:'held'},
  {id:'done',label:'Done',hue:152,chroma:0.08,wip:''}
];

// id, title, cat, votes, lane, assignee, branch, pill, pillKind, impact, effort, bucket, submitter, days
const RAW = [
  ['ITR-118','OAuth login fails silently on Safari 17','Bug',142,'inprogress','claude','fix/safari-oauth-silent','Claude: coding','ai',9,3,'next','lena@northwind.io',2],
  ['ITR-241','Webhook retry queue drops events after redeploy','Bug',127,'inprogress','claude','fix/webhook-retry-durability','Blocked: merge conflict detected','block',10,6,'next','ops@fieldkit.dev',1],
  ['ITR-104','Bulk CSV export for transaction history','Feature',118,'review','claude','feat/bulk-csv-export','Waiting for review','wait',7,4,'next','r.mbeki@atlaspay.co',5],
  ['ITR-196','MCP endpoint browser inside the studio','Feature',203,'inprogress','claude','feat/mcp-endpoint-browser','Claude: writing tests','ai',9,7,'next','dev@sondercloud.com',3],
  ['ITR-152','Slow query on /v1/usage aggregation','Bug',61,'review','tom','perf/usage-agg-index','Waiting for review','wait',6,3,'next','tsai@brightloop.io',4],
  ['ITR-133','Dark mode across settings pages','Feature',96,'assigned','sana','feat/settings-dark-mode','Ready to start','idle',5,4,'next','k.dolan@nine9.app',6],
  ['ITR-087','API keys page shows revoked keys as active','Bug',74,'testing','devin','fix/revoked-key-state','Integration tests running','wait',8,2,'next','sec@northwind.io',8],
  ['ITR-209','Duplicate emails sent on password reset','Bug',71,'testing','claude','fix/reset-email-dedupe','Claude: awaiting sign-off','ai',7,2,'next','support@atlaspay.co',3],
  ['ITR-171','Inline docs for generated endpoints','Feature',52,'assigned','sana','feat/inline-endpoint-docs','Ready to start','idle',6,5,'later','dev@sondercloud.com',7],
  ['ITR-188','Mobile layout breaks on request inspector','Bug',43,'assigned','claude','fix/inspector-mobile-layout','Claude: queued','ai',4,3,'later','m.oyelaran@fieldkit.dev',9],
  ['ITR-160','Per-environment variable overrides','Feature',47,'staged','claude','feat/env-var-overrides','Staged · held for release','hold',6,5,'next','ops@fieldkit.dev',6],
  ['ITR-145','Websocket disconnects after 60s idle','Bug',66,'inprogress','tom','fix/ws-idle-keepalive','In progress','idle',7,4,'next','tsai@brightloop.io',5],
  ['ITR-063','Rate-limit headers missing from 429 responses','Bug',55,'done','claude','fix/429-ratelimit-headers','Deployed to production','ok',5,1,'next','sec@northwind.io',12],
  ['ITR-071','Audit log export to S3','Feature',39,'done','devin','feat/audit-s3-export','Deployed to production','ok',4,4,'next','compliance@atlaspay.co',14],
  ['ITR-095','Rollback button on the deploy view','Feature',93,'staged','sana','feat/deploy-rollback','Staged · held for release','hold',8,5,'next','ops@fieldkit.dev',10],
  ['ITR-231','Retry budget headers on outbound webhooks','Feature',63,'staged','claude','feat/retry-budget-headers','Staged · held for release','hold',6,3,'next','ops@fieldkit.dev',7],
  ['ITR-166','Per-project rate limit editor','Feature',77,'staged','sana','feat/rate-limit-editor','Staged · held for release','hold',7,4,'next','it@brightloop.io',9],
  ['ITR-212','SSO with Okta','Feature',167,'backlog',null,null,'Unassigned','idle',9,9,'next','it@brightloop.io',4],
  ['ITR-118b','Undo on destructive schema edits','Feature',130,'backlog',null,null,'Unassigned','idle',8,6,'next','dev@sondercloud.com',6],
  ['ITR-224','Search across all API definitions','Feature',112,'backlog',null,null,'Unassigned','idle',7,5,'next','lena@northwind.io',2],
  ['ITR-137','Invite teammates by email domain','Feature',88,'backlog',null,null,'Unassigned','idle',5,3,'backlog','k.dolan@nine9.app',8],
  ['ITR-178','Custom domains for public portals','Feature',84,'backlog',null,null,'Unassigned','idle',6,7,'later','m.oyelaran@fieldkit.dev',11],
  ['ITR-205','Per-request cost attribution','Feature',58,'backlog',null,null,'Unassigned','idle',5,6,'backlog','finance@atlaspay.co',5],
  ['ITR-149','Keyboard shortcuts for the request inspector','Feature',41,'backlog',null,null,'Unassigned','idle',3,2,'backlog','tsai@brightloop.io',9]
];

const DESCS = {
  'ITR-118':'On Safari 17.x the OAuth popup closes and returns to the sign-in screen with no error surfaced. Console shows a blocked third-party cookie write. Reproduces on 3 of 3 test devices; Chrome and Firefox are unaffected.',
  'ITR-241':'After a redeploy, in-flight webhook deliveries in the retry queue are lost because the queue is held in process memory. Customers see gaps in their event stream with no dead-letter record.',
  'ITR-104':'Export the full transaction history as CSV with the column set the user has configured in the table view, including active filters. Needs to stream rather than buffer for large accounts.',
  'ITR-196':'A browsable panel inside the studio that lists every MCP tool exposed by the current project, with schemas, example calls, and a live "try it" runner.',
  'ITR-209':'Password reset sends two identical emails when the request is retried by the client. Root cause is a missing idempotency key on the mailer call.'
};

const ACCEPT = {
  'ITR-118':['Popup completes the OAuth exchange on Safari 17.0–17.6','Failures surface a readable error toast, never a silent return','Regression test added to the cross-browser suite'],
  'ITR-241':['Retry queue survives process restart with no event loss','Undeliverable events land in a dead-letter table after 5 attempts','Backoff strategy documented and configurable per project'],
  'ITR-104':['Export respects active filters and configured columns','Streams to the client without buffering the full result set','Accounts over 500k rows complete inside 60s'],
  'ITR-196':['Every MCP tool in the project is listed with its JSON schema','"Try it" runs against the current environment','Panel loads in under 300ms for projects with 100+ tools'],
  'ITR-209':['Duplicate reset requests within 60s send exactly one email','Idempotency key logged in the audit trail','Unit test covers the retry path']
};

const ACTS = {
  'ITR-241':[
    ['maya','Assigned to Claude with the durability spec attached.','4d ago',null],
    ['claude','Read the queue implementation and the deploy hooks. Proposed moving the retry queue to the Postgres-backed job table so it survives restarts.','4d ago',null],
    ['maya','Approved the approach. Keep the public interface unchanged.','4d ago',null],
    ['claude','Implemented durable queue + dead-letter table. 6 files changed, 214 insertions.','3d ago','queue/retry.ts        +118 -22\nqueue/deadletter.ts   +54  -0\ndb/migrations/0042.sql +18 -0\nqueue/retry.test.ts   +24  -4'],
    ['claude','Test suite: 148 passed, 0 failed. Coverage on queue/ is 91%.','3d ago',null],
    ['claude','Checked origin/main before opening the PR. This branch is 14 commits behind. My changes to queue/retry.ts overlap a backoff refactor Devin merged at 09:12 today — the two strategies are incompatible and I can\'t pick a winner without a product call. Stopping here and flagging for a human.','2h ago','CONFLICT (content): queue/retry.ts\n  <<<<<<< HEAD (origin/main)\n  exponentialBackoff({ base: 2, jitter: true })\n  =======\n  linearBackoff({ step: 5000, cap: 60000 })\n  >>>>>>> fix/webhook-retry-durability'],
    ['system','Card status set to Blocked. Escalation posted to #eng-triage.','2h ago',null]
  ],
  'ITR-118':[
    ['maya','Moved to In Progress and assigned to Claude. Priority bumped after 40 new votes overnight.','2d ago',null],
    ['claude','Reproduced on Safari 17.4. The popup writes the session cookie from a third-party context, which ITP blocks silently.','2d ago',null],
    ['devin','Suggest the redirect flow instead of popup for Safari specifically.','1d ago',null],
    ['claude','Agreed. Implementing UA-gated redirect flow with a shared callback handler so both paths use one code path after the exchange.','1d ago','auth/oauth-popup.ts    +12 -44\nauth/oauth-redirect.ts +96 -0\nauth/callback.ts       +31 -8'],
    ['claude','Test suite: 132 passed, 1 failed — auth/session.test.ts expects popup-only behaviour. Updating the fixture, not the implementation.','5h ago',null],
    ['claude','132 passed, 0 failed. Ready for review once the Safari 17.0 device lands in the matrix.','3h ago',null]
  ]
};

const AUDIT = [
  ['claude','escalated a merge conflict on','ITR-241','fix/webhook-retry-durability','origin/main is 14 commits ahead','2h ago'],
  ['claude','pushed 6 files','ITR-241','fix/webhook-retry-durability','+214 −26','3h ago'],
  ['claude','ran the test suite on','ITR-118','fix/safari-oauth-silent','132 passed · 0 failed','3h ago'],
  ['maya','approved the phase transition for','ITR-087',null,'Code Review → Integration Testing','4h ago'],
  ['claude','pre-checked the review checklist on','ITR-209','fix/reset-email-dedupe','4 of 4 items','5h ago'],
  ['claude','updated a test fixture on','ITR-118','fix/safari-oauth-silent','auth/session.test.ts','5h ago'],
  ['devin','merged a backoff refactor into','ITR-145','main','+88 −140','7h ago'],
  ['sana','signed off "no secrets committed" on','ITR-095',null,'human sign-off','9h ago'],
  ['system','deployed','ITR-095','feat/deploy-rollback','staging · build #2841','9h ago'],
  ['claude','requested review on','ITR-160','feat/env-var-overrides','3 files changed','11h ago'],
  ['tom','opened a pull request for','ITR-152','perf/usage-agg-index','+41 −6','13h ago'],
  ['claude','triaged 7 new portal submissions',null,null,'labels + effort estimates written','16h ago'],
  ['maya','reprioritised the Next column',null,null,'ITR-196 moved above ITR-104','17h ago'],
  ['claude','opened a branch for','ITR-188','fix/inspector-mobile-layout',null,'20h ago'],
  ['system','build failed on','ITR-209','fix/reset-email-dedupe','lint · 2 errors','22h ago'],
  ['claude','fixed 2 lint errors on','ITR-209','fix/reset-email-dedupe','+4 −4','21h ago'],
  ['devin','left 3 review comments on','ITR-104','feat/bulk-csv-export',null,'1d ago'],
  ['claude','answered 3 review comments on','ITR-104','feat/bulk-csv-export','+18 −12','1d ago'],
  ['sana','claimed','ITR-133','feat/settings-dark-mode',null,'1d ago'],
  ['claude','estimated effort for 12 backlog items',null,null,'median 4/10','2d ago'],
  ['maya','assigned','ITR-118','fix/safari-oauth-silent','→ Claude','2d ago'],
  ['system','deployed','ITR-063','fix/429-ratelimit-headers','production · build #2827','2d ago'],
  ['tom','reverted a hotfix on','ITR-145','main','build #2819','3d ago'],
  ['claude','proposed a durable-queue design on','ITR-241',null,'Postgres job table','4d ago']
];

const CHECKS = [
  ['Tests pass','All 132 unit and integration tests green on the latest commit. I re-ran the suite after the fixture update to be sure the change was in the test, not the behaviour.'],
  ['Docs updated','Updated auth/README.md and the Safari note in the troubleshooting guide. I did not touch the public API reference because the interface is unchanged.'],
  ['No secrets committed','Scanned the diff for key patterns and env references. The client ID that appears in oauth-redirect.ts is the public one already present in the bundle.'],
  ['Style guide followed','Matches the existing auth module conventions: named exports, no default export, errors thrown as AuthError. Prettier and eslint both clean.']
];

const PLAN = {
  intro:'Read-only so far: 6 files, the two callers, and the existing feature-flag config. Below is what I would do. I have not written anything.',
  files:[
    ['edit','claims-api/routes/status.py','~40 lines'],
    ['edit','claims-api/services/aggregate.py','~12 lines'],
    ['new','claims-api/tests/test_status.py','3 cases'],
    ['new','infra/migrations/0042_status_index.sql','1 index']
  ],
  steps:[
    'Read the current status handler and both callers in services/aggregate.py.',
    'Add a partial-results branch behind the existing degraded_reads flag, defaulting off.',
    'Write three tests: full result, partial result, upstream timeout.',
    'Add a covering index on claims(status, updated_at) as its own migration.',
    'Run make test and make migrate-check, then open a PR against main.'
  ],
  risks:[
    ['Protected path','infra/migrations/ is guarded by a PreToolUse hook set to ask. I will stop and hand you the write rather than route around it.'],
    ['Response shape changes','Partial results change the body of a 200. The flag stays off until the client team confirms — but the schema is committed either way.'],
    ['Unknown fixture','I could not find an existing way you mock upstream timeouts. I will write one, and it may not match the pattern used elsewhere.']
  ]
};

const SESSION = [
  ['read','Reading claims-api/routes/status.py'],
  ['read','Reading claims-api/services/aggregate.py'],
  ['read','Reading claims-api/config/flags.yaml'],
  ['write','Editing claims-api/routes/status.py — partial-results branch'],
  ['write','Writing claims-api/tests/test_status.py'],
  ['bash','Running make test'],
  ['test','3 tests passing, 0 failing'],
  ['gate','infra/migrations/0042_status_index.sql'],
  ['write','Writing infra/migrations/0042_status_index.sql'],
  ['bash','Running make migrate-check'],
  ['test','Migration check passed'],
  ['git','Opened PR #482 — status endpoint returns partial results']
];

const GIT_PHASES = [
  ['Start work'],
  ['Check branch status','Commit','Open PR'],
  ['Request review','Submit review'],
  ['Checks','Trigger workflow'],
  ['Merge'],
  ['Create linked issue']
];

const GIT_LOG = {
  'Check branch status':['system','Branch is 2 commits behind origin/main. No conflicting paths.'],
  'Commit':['devin','Committed 4 files — partial-results branch and its tests.'],
  'Open PR':['devin','Opened PR #482 against main. Two reviewers requested.'],
  'Request review':['devin','Requested review from Maya and Sana.'],
  'Submit review':['sana','Approved with one comment on the flag default.'],
  'Checks':['system','CI: 4 checks passed, 1 skipped (e2e — no client build).'],
  'Trigger workflow':['system','Triggered deploy-preview. Preview at claims-api-pr482.nostackai.dev.'],
  'Merge':['devin','Merged PR #482 into main. Branch deleted.'],
  'Create linked issue':['maya','Created follow-up #488 — flip degraded_reads on once the client ships.']
};

const CLAUDE_MD_SEED = `# claims-api

Python 3.12 / FastAPI. Postgres 16. Deployed from main on merge.

## Commands
- \`make test\` — pytest, no network. Run this before every PR.
- \`make migrate-check\` — validates migrations against a fresh schema.
- \`make lint\` — ruff + mypy strict. Both must be clean.
- Do NOT run \`make seed\` — it drops the dev database.

## Architecture
- \`routes/\` is thin: parse, call a service, serialise. No business logic.
- \`services/\` owns the logic and is the only layer that touches the repo classes.
- Anything crossing a network boundary goes through \`clients/\` with an explicit timeout.
- Feature flags live in \`config/flags.yaml\`. New behaviour ships behind a flag, default off.

## Things you get wrong here
- Claim status is an enum, not a string. Adding a value needs a migration AND a client release.
- \`updated_at\` is set by a trigger. Never write it from application code.
- Tests use \`freeze_time\`, so \`datetime.now()\` in a service is untestable — inject the clock.
- Partial responses must set \`X-Partial: true\`. The client keys its retry logic off that header.

## Migrations
One migration per change, numbered. Never edit a migration that has run in staging.
Writes under \`infra/migrations/\` are gated — expect to hand the write to a human.`;

const SKILLS_SEED = [
  ['add-endpoint','A new route is requested — scaffolds route, service, schema, and a test file in the house pattern.','4d ago'],
  ['status-enum-change','Anything touching the claim status enum — walks the migration, client release, and backfill order.','2w ago'],
  ['flagged-rollout','Behaviour changes that need a flag — writes the flag entry, the off-path test, and the rollout note.','2w ago'],
  ['perf-triage','A slow endpoint is reported — pulls the query plan, checks indexes, and writes findings before touching code.','1mo ago'],
  ['incident-writeup','A release is rolled back — assembles the timeline from the audit log into a draft postmortem.','1mo ago']
];

const HOOKS_SEED = [
  ['protected-paths','infra/migrations/**, infra/terraform/**','PreToolUse / Write','ask','Team',false],
  ['no-force-push','git push --force*, git push -f*','PreToolUse / Bash','block','Org-managed',true],
  ['no-secret-reads','.env*, **/secrets/**, *.pem','PreToolUse / Read','block','Org-managed',true],
  ['test-before-pr','gh pr create*','PreToolUse / Bash','ask','Team',false],
  ['schema-review','claims-api/schemas/**','PreToolUse / Write','ask','Team',false],
  ['log-all-bash','*','PostToolUse / Bash','allow','Org-managed',true]
];

const PROVIDERS_SEED = {
  anthropic:{name:'Anthropic', mark:'✦', connected:true, key:'sk-ant-api03-xxxxxxxxxxxxxxxx4f2a', routed:false, gateway:'Bedrock', endpoint:'', meta:'claude-sonnet-4-6 · connected 12 Aug'},
  google:{name:'Google', mark:'G', connected:false, key:'', routed:false, gateway:'Vertex', endpoint:'', meta:'gemini-2.5-pro'},
  openai:{name:'OpenAI', mark:'○', connected:false, locked:true, key:'', meta:'requires self-hosted execution'}
};

export {
  PEOPLE, PROJECTS, GROUPS, DELIVERIES, DEPENDS, ITEM_PROJECT, PERMS, PERM_COLS, NOTIFS, NOTIF_COLS,
  BACKLOG, CREW, SPRINT_PAST, SPRINT_ACTIVE, TEAM_ROWS, INVITES, CYCLE_BUCKETS, BURN, CFD90, PREFLIGHT,
  LANES, RAW, DESCS, ACCEPT, ACTS, AUDIT, CHECKS, PLAN, SESSION, GIT_PHASES, GIT_LOG,
  CLAUDE_MD_SEED, SKILLS_SEED, HOOKS_SEED, PROVIDERS_SEED
};
