# Vercel Deploy Gate — manual-only deploys

**As of 2026-04-21:** Vercel auto-deploy on `master` is **disabled**. No
git push ever triggers a Vercel build. Deploys only happen when a human
explicitly clicks **Create Deployment** in the dashboard or runs the
Vercel CLI. Source-controlled in `vercel.json`.

```jsonc
// vercel.json
{
  "git": {
    "deploymentEnabled": {
      "master": false
    }
  }
}
```

## Why this design

Vercel's "Ignored Build Step" feature was unreliable in practice — saving
the dashboard setting didn't always take effect, and there was no obvious
signal whether a given commit had been gated or not. Disabling
auto-deploy entirely is the bulletproof equivalent: there's no gate
logic to misfire because no automatic build is attempted in the first
place.

## How to ship

Two equivalent ways. Pick whichever is easier in the moment.

### Option A — Vercel dashboard (no CLI needed)

1. Open the project on Vercel.
2. **Deployments** tab → top-right **Create Deployment** (or open an
   older deployment and click **⋯ → Redeploy**).
3. Pick the commit you want to deploy. The dashboard builds + deploys
   that commit immediately.

Manual redeploys bypass `git.deploymentEnabled` because they're
intentional human action, not webhook-triggered automation.

### Option B — Vercel CLI

```bash
# One-time setup (per machine):
npm i -g vercel
vercel login
vercel link        # links the current dir to the Vercel project

# Every time you want to ship master HEAD to production:
git push origin master   # syncs to GitHub (no deploy fires)
vercel --prod            # builds + deploys the linked project
```

`vercel --prod` from a clean tree is the muscle-memory equivalent of
`git push` for a normally-auto-deploying project.

## Workflow

```
git commit -m "fix: anything"   # message format doesn't matter anymore
git push origin master          # syncs to GitHub, no Vercel build
                                # …repeat for as many commits as you want…

# When ready to ship:
vercel --prod                   # one explicit step, ships master HEAD
```

You can pile up dozens of commits between deploys — the next deploy
ships them all at once.

## Re-enable auto-deploy

If you want to revert to "every push deploys", remove the `git` block
from `vercel.json` (or set `master: true`):

```jsonc
{
  "git": {
    "deploymentEnabled": {
      "master": true
    }
  }
}
```

Push that change. Vercel reads the new config on the next push event.

## Backup gate (Ignored Build Step) — kept as belt-and-braces

`scripts/vercel-ignore-build.sh` and the dashboard's **Ignored Build
Step** setting are still in the repo / dashboard. They're now redundant
because `git.deploymentEnabled.master = false` short-circuits the
webhook before the script would run. They stay around as a safety net:

- If someone accidentally re-enables auto-deploy in `vercel.json` AND
  doesn't intend to ship every push, the script still gates.
- The script's keyword-match logic (whole-word `deploy`,
  `[force-deploy]` override, `[skip ci]` override) is documented at the
  top of the script if you ever need it again.

## Verification — does the gate actually work?

Push a no-keyword commit:

```bash
git commit --allow-empty -m "chore: docs tweak"
git push origin master
```

Open Vercel **Deployments**. The new commit should NOT appear in the
list. If you don't see a new build appear within ~30 seconds, the gate
is working as intended.

## Rollback

Remove the `git` block from `vercel.json`, push (you'll need to ship
manually since the gate still applies until Vercel reads the new
config), then resume normal auto-deploy on the next push.
