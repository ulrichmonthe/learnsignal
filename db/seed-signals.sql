-- ============================================================
-- The Signal — Signal Content Seed
-- Run this in Supabase SQL Editor AFTER schema.sql has been run.
-- ============================================================

-- ============================================================
-- SIGNAL 01: Could a rules engine solve this?
-- Enrich with real evidence from ETSLabs + WeAreBrain
-- ============================================================

-- Fix source URLs and metadata (seed data used placeholder URLs)
update sources set
  url         = 'https://etslabs.ai/blog/automation-decision-trees-rules-based-vs-ai/',
  title       = 'Automation Decision Trees: Rules-Based vs AI',
  publication = 'ETS Labs',
  author      = 'Jim Iyoob',
  source_type = 'article'
where url = 'https://etslabs.ai/rules-vs-ai';

update sources set
  url         = 'https://wearebrain.com/blog/rule-based-ai-vs-machine-learning-whats-the-difference/',
  title       = 'Rule-Based AI vs Machine Learning: What''s the Difference?',
  publication = 'WeAreBrain',
  author      = 'Mario Grunitz',
  source_type = 'article'
where url = 'https://wearebrain.com/blog/rule-based-ai-vs-ml';

-- Clear placeholder evidence
delete from evidence
where signal_id = (select id from signals where slug = 'rules-engine-check');

-- Insert rich evidence
insert into evidence (signal_id, source_id, evidence_type, content, speaker, confidence, display_order)

-- QUOTES
select s.id, src.id, 'quote',
  'That''s the error I keep seeing. Teams get excited about deploying AI and skip the fundamental analysis of whether AI actually solves their problem better than what they already have.',
  'Jim Iyoob, CRO at Etech Global Services',
  'high', 1
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://etslabs.ai/blog/automation-decision-trees-rules-based-vs-ai/'

union all

select s.id, src.id, 'quote',
  'Don''t choose technology based on trends — choose based on what your business actually needs to accomplish. Start with your desired outcomes, then work backwards to the technology.',
  'Mario Grunitz, Co-Founder, WeAreBrain',
  'high', 2
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://wearebrain.com/blog/rule-based-ai-vs-machine-learning-whats-the-difference/'

union all

-- FAILURE MODES
select s.id, src.id, 'failure_mode',
  'A team spent six months and substantial budget deploying an ML model for call routing. Their existing rules-based system ran at 99.8% accuracy. The ML model achieved 87% — adding latency, consuming more compute, and producing unexplainable failures. The project made routing measurably worse.',
  null,
  'high', 3
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://etslabs.ai/blog/automation-decision-trees-rules-based-vs-ai/'

union all

select s.id, src.id, 'failure_mode',
  'ML systems introduce probabilistic behavior that creates compliance failures: identical customer requests may receive different outcomes depending on model state. When a customer asks why their application was declined, "the model assigned a low probability" doesn''t satisfy regulators — and tools like SHAP values are inferential, not definitive.',
  null,
  'high', 4
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://etslabs.ai/blog/automation-decision-trees-rules-based-vs-ai/'

union all

-- EXAMPLES
select s.id, src.id, 'example',
  'An insurance claims validation project using rules-based AI reduced processing errors by 40% and cut approval time in half. The process was fully deterministic — claims either met criteria or they didn''t — making rules the right fit.',
  null,
  'high', 5
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://wearebrain.com/blog/rule-based-ai-vs-machine-learning-whats-the-difference/'

union all

select s.id, src.id, 'example',
  'Even cutting-edge generative AI models rely on rule-based guardrails for brand compliance, legal disclaimers, and safety. The most advanced AI still needs foundational rules — the choice isn''t binary, it''s about which layer handles which decisions.',
  null,
  'high', 6
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://wearebrain.com/blog/rule-based-ai-vs-machine-learning-whats-the-difference/'

union all

-- STATISTICS
select s.id, src.id, 'statistic',
  'Rules-based systems deploy in 6–8 weeks. AI systems require 12–16 weeks, including data preparation, model training, and validation. For problems where rules work, the speed advantage alone often justifies the choice.',
  null,
  'high', 7
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://etslabs.ai/blog/automation-decision-trees-rules-based-vs-ai/'

union all

select s.id, src.id, 'statistic',
  'Rules-based automation handles 70–80% of contact center volume because most customer interactions are routine and deterministic. Only the remaining 20–30% — the ambiguous, edge-case interactions — benefit from AI.',
  null,
  'high', 8
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://etslabs.ai/blog/automation-decision-trees-rules-based-vs-ai/'

union all

-- TESTS (decision frameworks)
select s.id, src.id, 'test',
  'ETSLabs decision checklist: (1) Is the process deterministic? (2) What accuracy is required? (3) Does the decision require explainability? (4) Is training data available? (5) Is the process stable? — Deterministic processes with binary outcomes belong in rules. Probabilistic processes involving interpretation benefit from AI.',
  null,
  'high', 9
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://etslabs.ai/blog/automation-decision-trees-rules-based-vs-ai/'

union all

select s.id, src.id, 'test',
  'WeAreBrain 3-way framework: Choose rules when rules are clear and unchanging, speed/precision are critical, or compliance requires explainability. Choose ML when patterns are complex or hidden, large datasets exist, or adaptability is needed. Choose hybrid when you need both precision and adaptability — compliance guardrails on ML outputs.',
  null,
  'high', 10
from signals s, sources src
where s.slug = 'rules-engine-check'
  and src.url = 'https://wearebrain.com/blog/rule-based-ai-vs-machine-learning-whats-the-difference/';


-- ============================================================
-- SIGNAL 02: What's the tolerance for wrong answers?
-- Source content TBD — scaffold with options and results,
-- add sources now, evidence to be extracted from URLs.
-- ============================================================

-- Add sources
insert into sources (title, url, source_type, author, publication) values
  (
    'Overreliance on AI',
    'https://learn.microsoft.com/en-us/ai/playbook/technology-guidance/overreliance-on-ai/overreliance-on-ai',
    'article',
    null,
    'Microsoft AI Playbook'
  ),
  (
    'AI Product Failure Modes (video)',
    'https://www.youtube.com/watch?v=SYjo9ohyBFw',
    'talk',
    null,
    null
  )
on conflict do nothing;

-- Insert signal
insert into signals (decision_id, slug, name, core_question, why_it_matters, signal_type, display_order)
select
  d.id,
  'wrong-answer-tolerance',
  'What''s the tolerance for wrong answers?',
  'How much harm does a wrong answer cause, and how easily can a user detect and recover from it?',
  'Error tolerance determines your entire design posture. Low tolerance demands confidence calibration, citations, and human review loops. High tolerance lets you prioritize speed and coverage. Teams that skip this question build either a dangerously overconfident product or an over-engineered one.',
  'checklist',
  2
from decisions d where d.slug = 'problem-selection';

-- Signal options
insert into signal_options (signal_id, label, weight, display_order)
select s.id, opt.label, 1, opt.ord from signals s
cross join (values
  ('A wrong answer in this context could cause serious harm — financial, medical, legal, or reputational', 1),
  ('Users cannot easily detect that an answer is wrong without external verification', 2),
  ('Errors are difficult or impossible to correct after the fact', 3),
  ('The domain is regulated and decisions require a traceable, explainable rationale', 4),
  ('Volume is high enough that even a small error rate produces many real-world failures', 5)
) as opt(label, ord)
where s.slug = 'wrong-answer-tolerance';

-- Signal results
insert into signal_results (signal_id, min_score, max_score, verdict, reasoning)
select s.id, 4, 5,
  'Leans toward very low tolerance — design for correctness first',
  'Four or five conditions point to a high-stakes context. Prioritize: confidence scores or uncertainty displays on all outputs, citations or sources for factual claims, human review for consequential decisions, and a clear "I don''t know" response when the model shouldn''t guess. Speed and coverage are secondary.'
from signals s where s.slug = 'wrong-answer-tolerance'

union all

select s.id, 2, 3,
  'Leans toward moderate tolerance — design for recovery',
  'Some risk factors present but the product can tolerate imperfection if the UX makes errors visible and correctable. Focus on clear error states, easy override mechanisms, and feedback loops that help users flag bad outputs. Avoid hiding uncertainty.'
from signals s where s.slug = 'wrong-answer-tolerance'

union all

select s.id, 0, 1,
  'Leans toward higher tolerance — optimize for coverage',
  'Few high-risk factors. You can prioritize speed, breadth, and volume over precision. Still worth displaying confidence where possible, but the design doesn''t need to be defensive. A wrong answer here is annoying, not harmful.'
from signals s where s.slug = 'wrong-answer-tolerance';

-- Evidence placeholder — to be filled after content extraction from sources
-- insert into evidence (...) once YouTube + Microsoft article are reviewed
