-- ============================================================
-- Eval Lab — New Tables + 20-Ticket Dataset
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

create table eval_tickets (
  slot_number   integer primary key,
  ticket_text   text not null,
  agent_category  text not null,
  agent_sentiment text not null,
  agent_urgency   text,
  agent_reasoning text not null,
  agent_escalate  boolean not null,
  expected_label  text check (expected_label in ('PASS','NEEDS_EDITS','FAIL','EITHER')) not null,
  pattern_tag     text not null,
  notes           text
);

create table vibe_check_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade not null,
  started_at   timestamp with time zone default now(),
  completed_at timestamp with time zone,
  last_ticket  integer default 1
);

create table ticket_labels (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references vibe_check_sessions(id) on delete cascade not null,
  slot_number integer references eval_tickets(slot_number) not null,
  label       text check (label in ('PASS','NEEDS_EDITS','FAIL')) not null,
  note        text,
  labelled_at timestamp with time zone default now(),
  unique (session_id, slot_number)
);

create index idx_ticket_labels_session on ticket_labels(session_id, slot_number);
create index idx_vibe_sessions_user on vibe_check_sessions(user_id, started_at desc);

alter table eval_tickets enable row level security;
create policy "eval_tickets readable by all" on eval_tickets for select using (true);

alter table vibe_check_sessions enable row level security;
create policy "vibe_sessions own rows" on vibe_check_sessions for all using (auth.uid() = user_id);

alter table ticket_labels enable row level security;
create policy "ticket_labels own sessions" on ticket_labels for all
  using (exists (
    select 1 from vibe_check_sessions
    where vibe_check_sessions.id = session_id
      and vibe_check_sessions.user_id = auth.uid()
  ));

-- ============================================================
-- 20-TICKET DATASET
-- ============================================================

insert into eval_tickets (slot_number, ticket_text, agent_category, agent_sentiment, agent_urgency, agent_reasoning, agent_escalate, expected_label, pattern_tag, notes) values

(1,
 'Hi — I was double-charged for my October invoice. Both charges are $49 and I only have one subscription. Can someone refund the duplicate? Order IDs are #44128 and #44131. Thanks.',
 'Billing', 'Neutral', null,
 'Customer reports duplicate billing on October invoice, $49 each, providing two order IDs (#44128, #44131). Requesting refund of the duplicate charge.',
 false, 'PASS', 'control', 'Warmup. Clean billing issue, all details present.'),

(2,
 'Would love to see an option to export reports as CSV instead of just PDF. Our team pipes data into Looker and PDF is a pain to parse. Not urgent, just a wish-list item.',
 'Feature Request', 'Positive', null,
 'Customer requesting CSV export functionality in addition to existing PDF export. Use case is Looker integration. Stated as non-urgent.',
 false, 'PASS', 'control', 'Warmup. Clean feature request.'),

(3,
 'login broken pls fix',
 'Technical', 'Neutral', null,
 'User reports authentication failure on web login, error code AUTH-4847. Browser appears to be Chrome on macOS. Likely related to recent session token rotation.',
 false, 'FAIL', 'short-input-hallucination',
 'Agent fabricated error code, browser, OS, and root cause from 4 words.'),

(4,
 'Hey — I''m seeing a 504 timeout when I try to run the bulk update endpoint with more than ~5,000 rows. Smaller batches work fine. Tested on staging and prod, same behaviour. Happy to share request IDs if useful.',
 'Technical', 'Neutral', null,
 'Customer reports 504 timeout on bulk update endpoint at >5000 row batches. Reproducible on staging and prod. Smaller batches succeed.',
 false, 'PASS', 'control', 'Clean technical issue. All details preserved.'),

(5,
 'oh great, ANOTHER charge i didn''t authorize. third time this month. cancel my account or i''m calling my bank.',
 'Billing', 'Neutral', null,
 'Customer disputing a charge they did not authorize. Mentions previous similar incidents. Requesting account cancellation as alternative resolution.',
 false, 'FAIL', 'sarcasm-as-neutral',
 'Caps, sarcasm, cancellation threat. Should be Angry, High urgency, escalate:true.'),

(6,
 'When I try to invite a new teammate, the invite link arrives in their inbox but clicking it shows ''workspace not found''. Tried with three different colleagues. They all get the same error. We''re on the Pro plan if that matters.',
 'Billing', 'Neutral', null,
 'Customer on Pro plan asking about teammate invitations. Mentions a workspace error.',
 false, 'FAIL', 'distractor',
 'Mis-categorised as Billing — clearly Technical. Agent latched onto "Pro plan".'),

(7,
 'broken',
 'Technical', 'Frustrated', null,
 'User reporting widespread platform outage affecting core functionality. Multiple features inaccessible. Urgent escalation required to engineering on-call.',
 true, 'FAIL', 'short-input-hallucination',
 'One word. Agent invented an outage, affected features, and on-call escalation.'),

(8,
 'Two things — first, the dashboard graph for last week is empty even though we definitely had events. Refreshing doesn''t help. Second, can you add a way to filter by custom date range? Right now it''s only preset ranges and we need to pull Q3 data.',
 'Technical', 'Neutral', null,
 'Customer reports empty dashboard graph for last week despite confirmed event data. Refresh does not resolve. Likely data pipeline issue.',
 false, 'NEEDS_EDITS', 'multi-issue-drop',
 'Agent caught technical issue but missed the feature request entirely.'),

(9,
 'fascinating that the ''undo'' button works for everything except the one action I actually need to undo. is this a feature?',
 'Feature Request', 'Neutral', null,
 'Customer asking about scope of the undo functionality. Suggesting expansion to additional actions.',
 false, 'FAIL', 'sarcasm-as-neutral',
 '"Fascinating", "is this a feature?" is sarcastic frustration, not a polite suggestion.'),

(10,
 'is this normal?',
 'Other', 'Neutral', null,
 'Customer asking a contextless question. Unable to determine specific issue without additional information.',
 false, 'EITHER', 'calibration',
 'Genuinely ambiguous. Either PASS or FAIL defensible. Not counted in reveal.'),

(11,
 'ITS NOT WORKING PLS HELP',
 'Technical', 'Frustrated', null,
 'User experiencing critical issue with the platform''s reporting module. Frustration evident from message format. Recommend immediate response from technical support team.',
 true, 'FAIL', 'short-input-hallucination',
 'Agent invented "reporting module" from all-caps frustration. Nothing in input justifies it.'),

(12,
 'Hi, this is Marcus from Acme Co (enterprise plan, account #ENT-3392). We''re seeing higher-than-usual latency on our scheduled exports — last three runs took 18, 22, and 19 minutes respectively, where our baseline is ~4 minutes. No errors, just slow. Can someone investigate?',
 'Technical', 'Neutral', null,
 'Enterprise customer (Acme Co, ENT-3392) reports scheduled export latency 4-5x higher than baseline. Three consecutive runs at 18-22 minutes vs ~4 minute baseline. No error states. Investigation required.',
 true, 'PASS', 'control', 'Clean enterprise ticket. All details preserved, correct escalation.'),

(13,
 'Hi team — wonderful to hear from you again. I''m so delighted that I get to spend another afternoon explaining why my dashboard hasn''t worked since Tuesday. Truly, this is the highlight of my week. Could you possibly find someone who has access to the codebase this time?',
 'Technical', 'Neutral', null,
 'Customer following up on previously reported dashboard issue. Polite tone. Requesting status update from technical team.',
 false, 'FAIL', 'sarcasm-as-neutral',
 'The hardest sarcasm case. Every word polite, intent is slow rage. Half of PMs miss this.'),

(14,
 'Hey — two things. First, my October invoice has a $40 charge labelled ''Premium Insights'' but I never enabled Premium Insights, I don''t even see it in my settings. Need a refund. Second, while you''re here, is there a way to set up scheduled exports? My team uses Looker and we''d love to pipe data over weekly instead of doing manual pulls. Thanks.',
 'Billing', 'Neutral', null,
 'Customer disputing a $40 Premium Insights charge from October billing cycle. Requesting refund and confirmation that the feature is not enabled.',
 false, 'NEEDS_EDITS', 'multi-issue-drop',
 'Agent caught billing dispute, missed the feature request for scheduled exports.'),

(15,
 'Quick note — the API documentation page for the /webhooks endpoint says the retry interval is 30 seconds, but I''m seeing retries every 60 seconds in our logs. Which one is right? Want to make sure I''m sizing our queue capacity correctly.',
 'Technical', 'Neutral', null,
 'Customer reports a discrepancy between documented webhook retry interval (30s) and observed behaviour (60s). Requesting clarification for capacity planning.',
 false, 'EITHER', 'distractor',
 'Categorisation is correct. Distractor — failure is latency, not categorisation.'),

(16,
 'Cool. Cool cool cool. Yeah no this is fine. The same bug I reported in February is back. No worries. I''ll just keep paying for this. 🙂',
 'Technical', 'Positive', null,
 'Customer reports recurrence of a previously reported issue from February. Tone is calm and accepting. Includes positive emoji.',
 false, 'FAIL', 'sarcasm-as-neutral',
 '"Cool cool cool", passive-aggressive 🙂, "I''ll just keep paying for this" = rage signals.'),

(17,
 '??',
 'Other', 'Frustrated', null,
 'Customer is confused about recent product changes following the v4.2 release. Likely seeking clarification on new pricing structure or feature deprecation.',
 false, 'FAIL', 'short-input-hallucination',
 'Two question marks. Agent invented v4.2 release, pricing changes, feature deprecation.'),

(18,
 'I have been waiting for 4 days for a response on ticket #88231. I sent another ticket yesterday and got no response. We are evaluating moving off your platform. This is unacceptable for a paid enterprise account.',
 'Other', 'Angry', null,
 'Enterprise customer reports 4-day response delay on existing ticket #88231 and no response to follow-up. Explicit churn threat. Immediate escalation to account management required.',
 true, 'PASS', 'control', 'Clear angry tone, correctly escalated. Control case.'),

(19,
 'honestly fantastic experience trying to import a CSV today. only crashed four times. only lost an hour of work. truly best in class.',
 'Technical', 'Angry', null,
 'Customer reports repeated crashes (4 occurrences) during CSV import functionality, resulting in approximately 1 hour of lost work. Tone is heavily sarcastic, indicating significant frustration. Escalation recommended.',
 true, 'PASS', 'subverted-pattern',
 'THE TRAP. Agent correctly read sarcasm as Angry. PM must not pattern-match sarcasm → FAIL.'),

(20,
 'Following up on the thing from last week — has there been any movement on that, or should I assume not?',
 'Other', 'Neutral', null,
 'Customer is following up on a previous inquiry without specifying the topic. Insufficient context to categorise specifically.',
 false, 'EITHER', 'calibration',
 'Final anchor. Agent behaviour reasonable. Tests PM calibration on ambiguous inputs.');
