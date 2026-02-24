"""
github_sync.py
--------------
Connects to the client GitHub repo via REST API (no extra libraries needed).
Detects which files changed since the last run, writes a changelog log file.

Used by: update_docs.py
"""

import json
import os
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path


# ---------------------------------------------------------------------------
# State file helpers (stores last processed commit SHA)
# ---------------------------------------------------------------------------

def read_last_sha(state_file: str) -> str | None:
    """Return the last processed commit SHA, or None if first run."""
    p = Path(state_file)
    if p.exists():
        content = p.read_text(encoding="utf-8").strip()
        return content if content else None
    return None


def write_last_sha(state_file: str, sha: str):
    """Persist the latest commit SHA to the state file."""
    Path(state_file).write_text(sha, encoding="utf-8")
    print(f"[Sync] State saved → {state_file} (SHA: {sha[:10]}...)")


# ---------------------------------------------------------------------------
# GitHub API helpers
# ---------------------------------------------------------------------------

def _api_get(url: str, token: str) -> dict:
    """Make an authenticated GET request to the GitHub API."""
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "DocUpdater/1.0")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        raise RuntimeError(f"GitHub API error {e.code} for {url}: {body}")


def _parse_owner_repo(repo_url: str):
    """Extract owner and repo name from a GitHub URL."""
    # Handles: https://github.com/owner/repo or https://github.com/owner/repo.git
    url = repo_url.rstrip("/").rstrip(".git")
    parts = url.split("github.com/")
    if len(parts) < 2:
        raise ValueError(f"Cannot parse GitHub URL: {repo_url}")
    owner_repo = parts[1].split("/")
    if len(owner_repo) < 2:
        raise ValueError(f"Cannot parse owner/repo from: {repo_url}")
    return owner_repo[0], owner_repo[1]


def get_latest_sha(repo_url: str, branch: str, token: str) -> str:
    """Return the latest commit SHA on the given branch."""
    owner, repo = _parse_owner_repo(repo_url)
    url = f"https://api.github.com/repos/{owner}/{repo}/branches/{branch}"
    data = _api_get(url, token)
    return data["commit"]["sha"]


def get_changed_files(repo_url: str, branch: str, token: str, last_sha: str | None):
    """
    Returns (new_sha, list_of_changed_file_paths).

    If last_sha is None (first run), returns all files in HEAD.
    If last_sha == new_sha, returns (new_sha, []) — nothing changed.
    """
    owner, repo = _parse_owner_repo(repo_url)
    new_sha = get_latest_sha(repo_url, branch, token)

    if last_sha and last_sha == new_sha:
        print("[Sync] No new commits since last run.")
        return new_sha, []

    if last_sha is None:
        # First run: get all files in the repo tree
        print("[Sync] First run — fetching full file list from HEAD...")
        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{new_sha}?recursive=1"
        data = _api_get(url, token)
        files = [item["path"] for item in data.get("tree", []) if item["type"] == "blob"]
        print(f"[Sync] Found {len(files)} files in repository.")
        return new_sha, files

    # Normal run: compare last_sha..new_sha
    print(f"[Sync] Comparing {last_sha[:10]}...{new_sha[:10]}")
    url = f"https://api.github.com/repos/{owner}/{repo}/compare/{last_sha}...{new_sha}"
    data = _api_get(url, token)
    files_data = data.get("files", [])
    changed = []
    for f in files_data:
        status = f.get("status", "")
        filename = f.get("filename", "")
        if status in ("added", "modified", "renamed", "copied"):
            changed.append(filename)
        elif status == "removed":
            changed.append(f"[DELETED] {filename}")
    print(f"[Sync] {len(changed)} file(s) changed in {data.get('total_commits', '?')} new commit(s).")
    return new_sha, changed


# ---------------------------------------------------------------------------
# Changelog writer
# ---------------------------------------------------------------------------

def write_change_log(changed_files: list, new_sha: str, old_sha: str | None,
                     repo_url: str, branch: str, log_dir: str) -> str:
    """Write a timestamped markdown changelog. Returns the log file path."""
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    log_file = Path(log_dir) / f"{timestamp}.md"

    lines = [
        f"# Change Log — {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        f"**Repository**: `{repo_url}`  ",
        f"**Branch**: `{branch}`  ",
        f"**New SHA**: `{new_sha}`  ",
        f"**Previous SHA**: `{old_sha or 'N/A (first run)'}`  ",
        "",
        f"## Changed Files ({len(changed_files)} total)",
        "",
    ]
    if changed_files:
        for f in changed_files:
            prefix = "🗑️ " if f.startswith("[DELETED]") else "📝 "
            lines.append(f"- {prefix}`{f}`")
    else:
        lines.append("_No files changed since last run._")
    lines.append("")
    lines.append("---")
    lines.append("*Generated by update_docs.py — manual run*")

    log_file.write_text("\n".join(lines), encoding="utf-8")
    print(f"[Sync] Change log written → {log_file}")
    return str(log_file)
