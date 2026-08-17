# The Week's Signal — grading rubric

The agent self-grades every draft against these six criteria before filing. The
reviewer sees the grade in the Drafts queue.

| # | Criterion | Passes when… |
|---|-----------|--------------|
| 1 | **Names one decision** | The draft states, explicitly, the single call it changes (build vs. buy, ship vs. wait, RAG vs. fine-tune, how to eval, how to price, how much autonomy). Not "this is important" — *this changes X*. |
| 2 | **Product, not model** | It explains why the item is a product/decision story, not a model-capability story. |
| 3 | **Real & current source** | Cites a genuine source from the last ~7 days, with a URL the agent actually fetched. No invented stats, quotes, or links. |
| 4 | **Actionable** | "What to do differently" is concrete enough to act on this sprint. |
| 5 | **Voice** | Editorial and direct. No hype, no filler, no frameworks-for-frameworks'-sake. |
| 6 | **Tight** | Body ≤ 600 words. |

**Verdict.** `file` only if **≥ 5 of 6** pass **and** criteria **1** and **4** both pass.
Otherwise revise and re-grade (up to 3 attempts), then file with an honest `short`
verdict so the reviewer can see exactly where it fell down.
