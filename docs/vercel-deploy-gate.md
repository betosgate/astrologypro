# Vercel Deploy Gate — "deploy" keyword required

This project is configured so Vercel only builds and deploys commits whose
message contains the literal whole word **`deploy`**. Every other commit
(docs, refactors, work-in-progress, bumped task files) is silently ignored
by Vercel — no build is triggered, no preview is created, no minutes are
spent.

## How it works

Vercel's **Ignored Build Step** runs `scripts/vercel-ignore-build.sh`
before every build. The script inspects `$VERCEL_GIT_COMMIT_MESSAGE` and:

| Exit code | Meaning |
|---|---|
| `0` | **Skip** the build (no deploy) |
| `1` | **Proceed** with the build (deploy) |

## One-time setup in the Vercel dashboard

1. Open the project in the Vercel dashboard.
2. **Settings → Git → Ignored Build Step**.
3. Set the command to:
   ```
   bash scripts/vercel-ignore-build.sh
   ```
4. Save. The next push uses the new gate; existing in-flight builds are
   not affected.

This setting lives in Vercel's UI, not in `vercel.json` — Vercel does not
support `ignoreCommand` via the JSON config file.

## Commit message rules

| Commit message contains | Result |
|---|---|
| the whole word `deploy` (case-insensitive) | ✅ build |
| `[force-deploy]` | ✅ build (overrides everything) |
| env var `FORCE_DEPLOY=1` set on the project | ✅ build (every commit) |
| `[skip ci]`, `[no-deploy]`, or `[skip-deploy]` | ❌ skip (overrides keyword) |
| nothing matching above | ❌ skip |

### Examples

```
✅  deploy: ship V2 affiliate flow
✅  feat(landing): add slot column - deploy
✅  fix(stripe): edge case [force-deploy]
✅  deploy

❌  feat(landing): add slot column          (no keyword)
❌  redeployment of legacy code             (whole-word match — "redeployment" doesn't count)
❌  deploys                                 (whole-word match — "deploys" doesn't count)
❌  deploy [skip ci]                        (skip wins)
```

The whole-word match is intentional. It prevents accidental rebuilds when
the message happens to mention "deployment", "redeploy", "deploys", etc.
in passing.

## Force a one-off deploy without changing your commit message

Three options, in order of preference:

1. **Add `[force-deploy]`** to the commit message of the last commit and
   amend or follow up with a tiny patch:
   ```bash
   git commit --amend -m "$(git log -1 --format=%B) [force-deploy]"
   git push --force-with-lease origin master
   ```
2. **Set `FORCE_DEPLOY=1`** as an environment variable on the Vercel
   project. Every commit deploys until you remove it. Useful during
   active rollout windows.
3. **Trigger via the Vercel dashboard** — `Deployments → ⋯ → Redeploy`
   on any past deployment bypasses the ignore script entirely (Vercel
   policy: manual redeploys always run).

## Skip a deploy that *does* contain the keyword

Add `[skip ci]`, `[no-deploy]`, or `[skip-deploy]` anywhere in the
message. The skip-override is checked first and wins.

## Local testing

The script is safe to run locally with simulated env vars:

```bash
VERCEL_GIT_COMMIT_MESSAGE="deploy: ship feature" bash scripts/vercel-ignore-build.sh
echo "exit=$?"   # → 1 (would build)

VERCEL_GIT_COMMIT_MESSAGE="fix: typo"             bash scripts/vercel-ignore-build.sh
echo "exit=$?"   # → 0 (would skip)
```

A run on every commit is logged by Vercel under the **Skipped Builds**
section in the dashboard, including the script's stdout — that's the
fastest place to confirm the gate is doing what you expect.

## Rollback

Empty the **Ignored Build Step** field in Vercel settings. Vercel reverts
to building every push immediately on the next commit. The script file
can stay in the repo — it has no effect when Vercel isn't calling it.
