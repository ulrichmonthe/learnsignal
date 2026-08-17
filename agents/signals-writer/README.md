# Signals Writer — a scheduled Managed Agent

A weekly [Managed Agent](https://platform.claude.com/docs/en/managed-agents/overview)
that drafts one issue of *The Week's Signal* and files it into the platform's
**Drafts** review queue (`/drafts`). It never publishes — a human approves.

```
web search/fetch ─▶ Signals Writer (weekly, cloud sandbox) ─▶ signal_drafts (Supabase)
                                                                     │
                                                          /drafts review queue ─▶ approve
```

Managed Agents is a **beta** surface. You run the setup steps below with your own
Anthropic credentials — secrets stay with you. The Supabase service key is stored in
a vault and substituted only at egress, so it never enters the agent's sandbox.

## Files here
- `signals-writer.agent.yaml` — the agent (model, tools, system prompt, output contract)
- `environment.yaml` — the sandbox (cloud, network access)
- `deployment.yaml` — the weekly cron + the kickoff message
- `RUBRIC.md` — the six-criterion self-grade the agent applies before filing

## One-time setup

**0. Create the table** (once) — run `migrations/signal_drafts.sql` in the Supabase
SQL editor (same project as the job board, `xsgasmddtqcylwfurrwu`).

**1. Install + auth the CLI**
```sh
brew install anthropics/tap/ant      # or see shared docs for Linux
ant auth login
```

**2. Create the agent and environment** (store the returned IDs)
```sh
AGENT_ID=$(ant beta:agents create < agents/signals-writer/signals-writer.agent.yaml --transform id -r)
ENV_ID=$(ant beta:environments create < agents/signals-writer/environment.yaml --transform id -r)
```

**3. Vault the Supabase service key** — the agent reads it as `SUPABASE_SERVICE_KEY`,
scoped to the Supabase host only.
```sh
VAULT_ID=$(ant beta:vaults create --display-name "Signals Writer" --transform id -r)
ant beta:vaults:credentials create --vault-id "$VAULT_ID" \
  --display-name "Supabase service key" \
  --auth '{
    "type": "environment_variable",
    "secret_name": "SUPABASE_SERVICE_KEY",
    "secret_value": "<YOUR_SUPABASE_SERVICE_ROLE_KEY>",
    "networking": { "type": "limited", "allowed_hosts": ["xsgasmddtqcylwfurrwu.supabase.co"] }
  }'
```
> Do this from your own terminal — never paste the key into chat.

**4. Test it now with a manual run** (doesn't wait for Monday)
```sh
SID=$(ant beta:sessions create --agent "$AGENT_ID" --environment-id "$ENV_ID" \
      --vault-id "$VAULT_ID" --transform id -r)
ant beta:sessions:events send --session-id "$SID" \
  --event '{type: user.message, content: [{type: text, text: "Produce this weeks Signal and file it for review."}]}'
ant beta:sessions:events stream --session-id "$SID"   # watch it work
```
When it finishes, open **`/drafts`** on the platform — the draft should be waiting.

**5. Schedule the weekly run.** Edit `deployment.yaml` to add your `agent` and
`environment_id`, then:
```sh
ant beta:deployments create < agents/signals-writer/deployment.yaml \
  --field agent="$AGENT_ID" --field environment_id="$ENV_ID" --field vault_ids="[\"$VAULT_ID\"]"
```
(If your CLI build predates `beta:deployments`, POST to `/v1/deployments` with the
`managed-agents-2026-04-01` beta header — same body.)

## Iterating
Change the voice or rubric in `signals-writer.agent.yaml`, then publish a new version:
```sh
ant beta:agents update --agent-id "$AGENT_ID" --version <current> < agents/signals-writer/signals-writer.agent.yaml
```
Running sessions keep their pinned version; new runs pick up the change.

## Next step (not built yet)
Right now **approve** flips a draft's status to `approved`. Publishing an approved
draft into the live `/signals` feed is the follow-up — either surface approved rows
on the public Signals page, or have approval open a PR that adds it to `lib/articles.ts`.
