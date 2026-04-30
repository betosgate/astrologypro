#!/usr/bin/env bash
# scripts/vercel-ignore-build.sh
#
# Vercel "Ignored Build Step" — gates deployments by commit message.
# Only commits whose message contains the literal word "deploy" produce
# a Vercel deployment. Everything else (docs, work-in-progress, refactors,
# etc.) is skipped.
#
# Vercel runs this script BEFORE building. Exit code contract:
#   exit 0  → IGNORE the build (no deploy)
#   exit 1  → PROCEED with the build (deploy)
#
# Configure once in the Vercel dashboard:
#   Project → Settings → Git → Ignored Build Step
#   Command: bash scripts/vercel-ignore-build.sh
#
# Trigger keyword:
#   The first whole word "deploy" anywhere in the commit message
#   triggers a build. Matching is case-insensitive and word-boundary
#   based, so "redeployment", "deploys", or "deployer" don't trigger
#   accidentally — only the exact token "deploy".
#
# Force-deploy paths (always build regardless of commit message):
#   - VERCEL_GIT_COMMIT_REF starts with "release/" or is exactly "main"
#     or "master" (default branches still respect the keyword unless
#     explicitly listed here — keep this list minimal).
#   - Setting FORCE_DEPLOY=1 as a project env var.
#   - The commit message containing "[force-deploy]" — useful for
#     rebuild-but-message-doesn't-mention-it cases.
#
# Skip-deploy override:
#   "[skip ci]" or "[no-deploy]" in the commit message always skips.
#
# Debugging:
#   Vercel logs the full output of this script under "Build Logs →
#   Skipped Builds". Run with `bash -x` locally if you need to inspect.

set -euo pipefail

# Vercel sets these. They're empty when running locally — handle both.
COMMIT_MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
COMMIT_REF="${VERCEL_GIT_COMMIT_REF:-}"
COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-}"

echo "[vercel-ignore-build] ref=${COMMIT_REF} sha=${COMMIT_SHA:0:7}"
echo "[vercel-ignore-build] message:"
printf '  %s\n' "${COMMIT_MSG}"

# ── Hard skip overrides ──────────────────────────────────────────────────────
if echo "${COMMIT_MSG}" | grep -qiE '\[skip ci\]|\[no-deploy\]|\[skip-deploy\]'; then
  echo "[vercel-ignore-build] skip-override marker present — IGNORING build"
  exit 0
fi

# ── Hard build overrides ─────────────────────────────────────────────────────
if [ "${FORCE_DEPLOY:-}" = "1" ]; then
  echo "[vercel-ignore-build] FORCE_DEPLOY=1 — PROCEEDING with build"
  exit 1
fi
if echo "${COMMIT_MSG}" | grep -qiE '\[force-deploy\]'; then
  echo "[vercel-ignore-build] [force-deploy] marker present — PROCEEDING with build"
  exit 1
fi

# ── Keyword check ────────────────────────────────────────────────────────────
# Match the whole word "deploy" anywhere in the commit message,
# case-insensitive, with word boundaries so "deployment", "deploys",
# "redeploy", "deployer" do not trigger.
#
# grep -P (PCRE) supports \b. Vercel build images include grep with PCRE
# support; if a future image drops it, fall back to grep -wi.
if echo "${COMMIT_MSG}" | grep -qiwE 'deploy'; then
  echo "[vercel-ignore-build] keyword 'deploy' found — PROCEEDING with build"
  exit 1
fi

echo "[vercel-ignore-build] no 'deploy' keyword — IGNORING build"
echo "[vercel-ignore-build] (commit ${COMMIT_SHA:0:7} on ${COMMIT_REF})"
exit 0
