"""
update_docs.py
--------------
Manual entry-point: detects GitHub changes and updates only affected docs.

Usage:
    python update_docs.py                  # normal incremental update
    python update_docs.py --dry-run        # show changes but don't write docs
    python update_docs.py --reset          # forget last sync, regenerate all
"""

import sys
import os
import argparse
from pathlib import Path

# Add git to PATH on Windows
if os.name == "nt":
    git_path = r"C:\Program Files\Git\cmd"
    if git_path not in os.environ.get("PATH", ""):
        os.environ["PATH"] += os.pathsep + git_path

import yaml

# Import from existing project files
from github_sync import (
    get_changed_files,
    write_change_log,
    read_last_sha,
    write_last_sha,
)

# Import generate_docs internals (reuse parsers & generator)
from generate_docs import (
    ConfigLoader,
    AIDocumentationEnhancer,
    MarkdownGenerator,
    PHPParser, JSParser, TypeScriptParser, VueParser,
    MDXParser, GherkinParser, GenericParser,
    RepoManager,
    deploy_viewer_assets,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_config(path="config.yaml") -> dict:
    try:
        return ConfigLoader.load(path)
    except FileNotFoundError:
        print(f"ERROR: {path} not found. Run from the project root folder.")
        sys.exit(1)


def get_parsers() -> dict:
    return {
        ".php": PHPParser(),
        ".js": JSParser(),
        ".jsx": JSParser(),
        ".ts": TypeScriptParser(),
        ".tsx": TypeScriptParser(),
        ".vue": VueParser(),
        ".md": MDXParser(),
        ".mdx": MDXParser(),
        ".feature": GherkinParser(),
        ".twig": GenericParser(),
        ".json": GenericParser(),
        ".yaml": GenericParser(),
        ".yml": GenericParser(),
        ".xml": GenericParser(),
        ".css": GenericParser(),
        ".html": GenericParser(),
        ".sh": GenericParser(),
        ".bash": GenericParser(),
        "Dockerfile": GenericParser(),
    }


def pull_repo(repo_cfg: dict, token: str | None):
    """Pull the latest code for a repo so local copy matches GitHub."""
    name = repo_cfg.get("name", "repo")
    url = repo_cfg.get("url", "")
    local_path = repo_cfg.get("local_path", f"./repo_src/{name}")
    if url.startswith("file://"):
        return  # local test repo, skip pull
    manager = RepoManager(name, url, local_path, token)
    manager.setup()


def regen_docs_for_files(changed_files: list, config: dict,
                         generator: MarkdownGenerator, parsers: dict,
                         dry_run: bool):
    """
    Re-generate documentation for only the changed files.
    Skips [DELETED] entries.
    """
    repos_cfg = config.get("repositories", [])
    exclude_patterns = config.get("exclude", [])
    output_dir = Path(config["output_dir"])
    regenerated = []
    skipped = []

    for changed_path in changed_files:
        if changed_path.startswith("[DELETED]"):
            actual = changed_path.replace("[DELETED] ", "")
            print(f"  [Delete] Skipping deleted file: {actual}")
            skipped.append(changed_path)
            continue

        # Find which repo this file belongs to
        matched_repo = None
        matched_local = None
        for repo in repos_cfg:
            local_path = Path(repo.get("local_path", ""))
            candidate = local_path / changed_path
            if candidate.exists():
                matched_repo = repo
                matched_local = candidate
                break

        if not matched_local or not matched_local.exists():
            print(f"  [Skip] File not found locally: {changed_path}")
            skipped.append(changed_path)
            continue

        ext = matched_local.suffix
        filename = matched_local.name
        if filename == "Dockerfile" or filename.endswith(".dockerfile"):
            parser = parsers.get("Dockerfile")
        elif ext in parsers:
            parser = parsers.get(ext)
        else:
            print(f"  [Skip] No parser for: {changed_path}")
            skipped.append(changed_path)
            continue

        if any(pat in str(matched_local) for pat in exclude_patterns):
            print(f"  [Skip] Excluded: {changed_path}")
            skipped.append(changed_path)
            continue

        if dry_run:
            print(f"  [Dry-Run] Would regenerate: {changed_path}")
            regenerated.append(changed_path)
            continue

        try:
            content = matched_local.read_text(encoding="utf-8", errors="ignore")
            info = parser.parse(content)
            repo_path = Path(matched_repo["local_path"])
            repo_name = matched_repo.get("name", "main")

            # Delete existing doc so generate() rewrites it (not skips it)
            rel = matched_local.relative_to(repo_path)
            safe_name = str(rel).replace(os.sep, "_").replace(".", "_") + ".md"
            existing_doc = output_dir / safe_name
            if existing_doc.exists():
                existing_doc.unlink()
                print(f"  [Remove] Old doc removed: {safe_name}")

            generator.generate(matched_local, info, repo_path, repo_name, content)
            print(f"  [Updated] {changed_path}")
            regenerated.append(changed_path)
        except Exception as e:
            print(f"  [Error] {changed_path}: {e}")
            skipped.append(changed_path)

    return regenerated, skipped


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Update docs for GitHub-changed files.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would change but don't write any docs.")
    parser.add_argument("--reset", action="store_true",
                        help="Forget the last sync state and process all files.")
    args = parser.parse_args()

    print("=" * 55)
    print("  GitHub Change-Tracker & Documentation Updater")
    if args.dry_run:
        print("  MODE: DRY-RUN (no files will be written)")
    if args.reset:
        print("  MODE: RESET (will process all files from scratch)")
    print("=" * 55)
    print()

    # Load config
    config = load_config("config.yaml")
    gh_cfg = config.get("github", {})

    if not gh_cfg:
        print("ERROR: No 'github' section found in config.yaml.")
        print("       Please add your GitHub repo URL and token.")
        print("       See the 'github' section example in config.yaml.")
        sys.exit(1)

    repo_url = gh_cfg.get("repo_url", "")
    branch = gh_cfg.get("branch", "main")
    token = gh_cfg.get("token", "") or os.environ.get("GITHUB_TOKEN", "")
    state_file = gh_cfg.get("state_file", ".last_sync")
    changelog_dir = gh_cfg.get("changelog_dir", "CHANGELOG_LOG")

    if not repo_url:
        print("ERROR: 'github.repo_url' is empty in config.yaml.")
        sys.exit(1)
    if not token or token == "ghp_YOUR_PERSONAL_ACCESS_TOKEN":
        print("ERROR: 'github.token' is not set in config.yaml.")
        print("       Set it to your GitHub Personal Access Token.")
        sys.exit(1)

    # Handle reset
    if args.reset:
        state_path = Path(state_file)
        if state_path.exists():
            state_path.unlink()
            print(f"[Reset] Cleared state file: {state_file}")
        last_sha = None
    else:
        last_sha = read_last_sha(state_file)

    print(f"[Config] Repo  : {repo_url}")
    print(f"[Config] Branch: {branch}")
    print(f"[Config] State : {last_sha[:10] + '...' if last_sha else 'None (first run)'}")
    print()

    # --- Step 1: Detect changes on GitHub ---
    print("Step 1: Checking GitHub for changes...")
    try:
        new_sha, changed_files = get_changed_files(repo_url, branch, token, last_sha)
    except Exception as e:
        print(f"ERROR: Could not connect to GitHub: {e}")
        sys.exit(1)

    # --- Step 2: Write change log ---
    print("\nStep 2: Writing change log...")
    log_path = write_change_log(changed_files, new_sha, last_sha,
                                repo_url, branch, changelog_dir)

    if not changed_files:
        print("\n✅ No changes detected. Documentation is already up to date.")
        if not args.dry_run:
            write_last_sha(state_file, new_sha)
        return

    print(f"\n  {len(changed_files)} file(s) changed:")
    for f in changed_files[:20]:
        print(f"    • {f}")
    if len(changed_files) > 20:
        print(f"    ... and {len(changed_files) - 20} more (see log)")

    if args.dry_run:
        print("\n[Dry-Run] Skipping doc generation and repo pull.")
        print(f"\n📋 Full change log: {log_path}")
        return

    # --- Step 3: Pull repos to get latest code ---
    print("\nStep 3: Pulling latest code from repos...")
    gh_token = token or os.environ.get("GITHUB_TOKEN")
    for repo in config.get("repositories", []):
        pull_repo(repo, gh_token)

    # --- Step 4: Regenerate docs for changed files only ---
    print("\nStep 4: Regenerating documentation for changed files...")
    ai_cfg = config.get("ai_enhancement", {})
    ai_enhancer = AIDocumentationEnhancer(ai_cfg)
    generator = MarkdownGenerator(config["output_dir"], ai_enhancer)
    generator.functional_scopes = config.get("functional_scopes", {})

    # Register repo types
    for repo in config.get("repositories", []):
        generator.register_repo_type(
            repo.get("name", "main"),
            repo.get("type", "other")
        )

    parsers = get_parsers()
    regenerated, skipped = regen_docs_for_files(
        changed_files, config, generator, parsers, dry_run=False
    )

    # --- Step 5: Rebuild navigation index ---
    print("\nStep 5: Rebuilding navigation index...")
    generator.write_index()
    generator.write_web_index()
    deploy_viewer_assets(config["output_dir"])

    # --- Step 6: Save state ---
    write_last_sha(state_file, new_sha)

    # --- Summary ---
    print()
    print("=" * 55)
    print(f"  ✅ DONE")
    print(f"  📝 Files changed   : {len(changed_files)}")
    print(f"  ✅ Docs updated    : {len(regenerated)}")
    print(f"  ⏭️  Skipped         : {len(skipped)}")
    print(f"  📋 Change log      : {log_path}")
    print("=" * 55)


if __name__ == "__main__":
    main()
