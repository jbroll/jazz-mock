#!/bin/bash
# Install git hooks from scripts/git-hooks to .git/hooks
# Run with: npm run setup:hooks or ./scripts/git-hooks/install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# `prepare` also runs when a consumer installs jazz-mock through file:, where the
# checkout may be a worktree (.git is a file) or read-only (simple-ci CI_DEPS).
if [ ! -d "$PROJECT_ROOT/.git" ] || [ ! -w "$PROJECT_ROOT/.git" ]; then
    echo "Skipping git hooks: $PROJECT_ROOT is not a writable main checkout"
    exit 0
fi

# Ensure .git/hooks exists
mkdir -p "$GIT_HOOKS_DIR"
mkdir -p "$GIT_HOOKS_DIR/logs"

# Install commit-msg hook
if [ -f "$SCRIPT_DIR/commit-msg" ]; then
    cp "$SCRIPT_DIR/commit-msg" "$GIT_HOOKS_DIR/commit-msg"
    chmod +x "$GIT_HOOKS_DIR/commit-msg"
    echo "Installed commit-msg hook"
fi

echo "Git hooks installed successfully"
