"""
test_setup.py
-------------
Validates every component of the Documentation Updater system.
Run this BEFORE running update_docs.py to confirm everything works.

Usage:
    python test_setup.py              # run all tests
    python test_setup.py --quick      # skip AI and doc-gen tests (faster)

What it checks:
    ✅ .env file loads correctly
    ✅ config.yaml is valid
    ✅ GitHub token works
    ✅ GitHub repo is accessible
    ✅ Can fetch latest commit SHA
    ✅ Can detect changed files
    ✅ Groq AI key is valid and responds
    ✅ generate_docs imports work
    ✅ Parsers can parse a sample file
    ✅ Doc output folder is writable
    ✅ State file read/write works
"""

import sys
import os
import argparse
import tempfile
import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

# ── colour helpers ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):   print(f"  {GREEN}✅ PASS{RESET}  {msg}")
def fail(msg): print(f"  {RED}❌ FAIL{RESET}  {msg}")
def warn(msg): print(f"  {YELLOW}⚠️  WARN{RESET}  {msg}")
def info(msg): print(f"  {CYAN}ℹ️  INFO{RESET}  {msg}")

PASS_COUNT = 0
FAIL_COUNT = 0
WARN_COUNT = 0

def record(passed: bool, label: str, detail: str = ""):
    global PASS_COUNT, FAIL_COUNT
    if passed:
        ok(f"{label}" + (f"  →  {detail}" if detail else ""))
        PASS_COUNT += 1
    else:
        fail(f"{label}" + (f"  →  {detail}" if detail else ""))
        FAIL_COUNT += 1

def section(title: str):
    print(f"\n{BOLD}{CYAN}{'─'*55}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*55}{RESET}")


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 1 — .env file
# ══════════════════════════════════════════════════════════════════════════════

def test_env():
    section("TEST 1 — Environment Variables (.env)")

    env_path = Path(".env")
    record(env_path.exists(), ".env file exists")
    if not env_path.exists():
        fail("Skipping remaining .env tests — file not found")
        return {}, {}

    # Try dotenv load
    try:
        from dotenv import load_dotenv
        load_dotenv()
        ok("python-dotenv is installed and loaded .env")
        PASS_COUNT  # noqa
    except ImportError:
        fail("python-dotenv not installed — run:  pip install python-dotenv")
        # Fall back: parse manually
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

    groq_key    = os.environ.get("GROQ_API_KEY", "")
    github_token = os.environ.get("GITHUB_TOKEN", "")

    record(bool(groq_key and not groq_key.startswith("your_")),
           "GROQ_API_KEY is set",
           groq_key[:12] + "..." if groq_key else "MISSING")

    record(bool(github_token and not github_token.startswith("ghp_YOUR")),
           "GITHUB_TOKEN is set",
           github_token[:15] + "..." if github_token else "MISSING")

    return groq_key, github_token


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 2 — config.yaml
# ══════════════════════════════════════════════════════════════════════════════

def test_config():
    section("TEST 2 — Configuration (config.yaml)")

    cfg_path = Path("config.yaml")
    record(cfg_path.exists(), "config.yaml file exists")
    if not cfg_path.exists():
        fail("Skipping remaining config tests — file not found")
        return {}

    try:
        import yaml
        with open(cfg_path, encoding="utf-8") as f:
            config = yaml.safe_load(f)
        ok("config.yaml is valid YAML")
    except Exception as e:
        fail(f"config.yaml YAML parse error: {e}")
        return {}

    # Check required sections
    for key in ["github", "repositories", "output_dir", "ai_enhancement"]:
        record(key in config, f"Section '{key}' present")

    gh = config.get("github", {})
    repo_url = gh.get("repo_url", "")
    record(
        bool(repo_url) and "YOUR_ORG" not in repo_url,
        "github.repo_url is configured",
        repo_url
    )

    repos = config.get("repositories", [])
    record(len(repos) > 0, f"{len(repos)} repository(ies) configured")
    for r in repos:
        local_ok = "local_path" in r and "name" in r and "url" in r
        record(local_ok, f"Repo '{r.get('name','?')}' has name/url/local_path")

    ai = config.get("ai_enhancement", {})
    record(ai.get("enabled") is True, "ai_enhancement.enabled = true")
    record(ai.get("provider") == "groq", "ai_enhancement.provider = groq",
           ai.get("provider"))
    record(bool(ai.get("base_url")), "ai_enhancement.base_url set",
           ai.get("base_url"))
    record(bool(ai.get("model")), "ai_enhancement.model set", ai.get("model"))

    return config


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 3 — GitHub API connection
# ══════════════════════════════════════════════════════════════════════════════

def _api_get(url: str, token: str):
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "DocUpdater-Test/1.0")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def _parse_owner_repo(url: str):
    url = url.rstrip("/").rstrip(".git")
    parts = url.split("github.com/")
    if len(parts) < 2:
        raise ValueError(f"Bad URL: {url}")
    return tuple(parts[1].split("/")[:2])

def test_github(token: str, config: dict):
    section("TEST 3 — GitHub API Connection")

    if not token:
        fail("No GITHUB_TOKEN — skipping all GitHub tests")
        return None, None

    repo_url = config.get("github", {}).get("repo_url", "")
    branch   = config.get("github", {}).get("branch", "main")

    if not repo_url or "YOUR_ORG" in repo_url:
        fail("repo_url not configured in config.yaml — skipping GitHub tests")
        return None, None

    try:
        owner, repo = _parse_owner_repo(repo_url)
        ok(f"Parsed repo as {owner}/{repo}")
    except Exception as e:
        fail(f"Cannot parse repo URL: {e}")
        return None, None

    # Test 1: Basic auth
    try:
        data = _api_get("https://api.github.com/user", token)
        ok(f"GitHub authentication succeeded  →  logged in as: {data.get('login','?')}")
    except Exception as e:
        fail(f"GitHub authentication failed: {e}")
        return None, None

    # Test 2: Repo access
    try:
        data = _api_get(f"https://api.github.com/repos/{owner}/{repo}", token)
        ok(f"Repo accessible  →  {data.get('full_name')}  "
           f"({'private' if data.get('private') else 'public'})")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            fail(f"Repo not found — check URL or token permissions (404)")
        elif e.code == 403:
            fail(f"Access denied — token lacks 'repo' scope (403)")
        else:
            fail(f"Repo access error: {e.code}")
        return None, None

    # Test 3: Branch + latest SHA
    try:
        data = _api_get(
            f"https://api.github.com/repos/{owner}/{repo}/branches/{branch}", token
        )
        sha = data["commit"]["sha"]
        msg = data["commit"]["commit"]["message"].split("\n")[0][:60]
        ok(f"Branch '{branch}' found  →  latest SHA: {sha[:10]}...  |  \"{msg}\"")
        return sha, branch
    except Exception as e:
        fail(f"Cannot read branch '{branch}': {e}")
        return None, None


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 4 — State file
# ══════════════════════════════════════════════════════════════════════════════

def test_state_file(config: dict):
    section("TEST 4 — State File (.last_sync)")

    state_file = config.get("github", {}).get("state_file", ".last_sync")
    p = Path(state_file)

    if p.exists():
        content = p.read_text(encoding="utf-8").strip()
        ok(f"State file exists  →  last SHA: {content[:10]}...")
        info("This means it is NOT a first run — only changed files will be processed")
        info(f"Run  'python update_docs.py --reset'  to reprocess everything")
    else:
        warn("State file does not exist yet  →  first run will process ALL files")
        info("This is normal if you haven't run update_docs.py yet")

    # Write/read test
    try:
        test_state = Path(".test_state_tmp")
        test_state.write_text("abc123testsha", encoding="utf-8")
        result = test_state.read_text(encoding="utf-8").strip()
        test_state.unlink()
        record(result == "abc123testsha", "State file read/write works")
    except Exception as e:
        fail(f"State file read/write failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 5 — Output directory
# ══════════════════════════════════════════════════════════════════════════════

def test_output_dir(config: dict):
    section("TEST 5 — Output Directory")

    out_dir = Path(config.get("output_dir", "./docs_output"))

    if not out_dir.exists():
        try:
            out_dir.mkdir(parents=True)
            ok(f"Created output dir: {out_dir}")
        except Exception as e:
            fail(f"Cannot create output dir {out_dir}: {e}")
            return

    # Write test
    try:
        test_file = out_dir / ".write_test"
        test_file.write_text("test", encoding="utf-8")
        test_file.unlink()
        ok(f"Output directory is writable  →  {out_dir.resolve()}")
    except Exception as e:
        fail(f"Output directory not writable: {e}")

    existing_docs = list(out_dir.glob("*.md"))
    info(f"{len(existing_docs)} .md doc(s) currently in output folder")


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 6 — Python imports from generate_docs.py
# ══════════════════════════════════════════════════════════════════════════════

def test_imports():
    section("TEST 6 — Python Imports (generate_docs.py)")

    if not Path("generate_docs.py").exists():
        fail("generate_docs.py not found in current directory")
        return None, None, None

    try:
        from generate_docs import (
            ConfigLoader, AIDocumentationEnhancer, MarkdownGenerator,
            PHPParser, JSParser, TypeScriptParser, VueParser,
            MDXParser, GherkinParser, GenericParser,
            RepoManager, deploy_viewer_assets,
        )
        ok("All classes imported from generate_docs.py")
        return (AIDocumentationEnhancer, MarkdownGenerator,
                (PHPParser, JSParser, TypeScriptParser, VueParser,
                 MDXParser, GherkinParser, GenericParser))
    except ImportError as e:
        fail(f"Import error from generate_docs.py: {e}")
        return None, None, None
    except Exception as e:
        fail(f"Unexpected error importing generate_docs.py: {e}")
        return None, None, None


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 7 — Parser smoke test
# ══════════════════════════════════════════════════════════════════════════════

def test_parsers(parser_classes):
    section("TEST 7 — Parser Smoke Tests")

    if parser_classes is None:
        warn("Skipping parser tests — imports failed")
        return

    (PHPParser, JSParser, TypeScriptParser, VueParser,
     MDXParser, GherkinParser, GenericParser) = parser_classes

    samples = {
        "TypeScriptParser": (
            TypeScriptParser(),
            "export function greet(name: string): string {\n  return `Hello ${name}`;\n}"
        ),
        "VueParser": (
            VueParser(),
            "<template><div>Hello</div></template>\n<script setup>\nconst x = 1;\n</script>"
        ),
        "JSParser": (
            JSParser(),
            "function add(a, b) { return a + b; }\nmodule.exports = { add };"
        ),
        "GenericParser": (
            GenericParser(),
            '{"name": "ipn-frontend", "version": "1.0.0"}'
        ),
    }

    for name, (parser, code) in samples.items():
        try:
            result = parser.parse(code)
            record(isinstance(result, dict), f"{name}.parse() returns dict",
                   f"keys: {list(result.keys())[:5]}")
        except Exception as e:
            fail(f"{name}.parse() raised: {e}")


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 8 — Groq AI connection
# ══════════════════════════════════════════════════════════════════════════════

def test_groq(groq_key: str, config: dict):
    section("TEST 8 — Groq AI Connection")

    if not groq_key:
        fail("No GROQ_API_KEY — skipping AI tests")
        return

    ai_cfg = config.get("ai_enhancement", {})
    base_url = ai_cfg.get("base_url", "https://api.groq.com/openai/v1")
    model    = ai_cfg.get("model", "llama3-70b-8192")

    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user",
                       "content": "Reply with exactly: GROQ_OK"}],
        "max_tokens": 20,
        "temperature": 0
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=payload,
        method="POST"
    )
    req.add_header("Authorization", f"Bearer {groq_key}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
        reply = data["choices"][0]["message"]["content"].strip()
        ok(f"Groq API responded  →  model: {model}  |  reply: \"{reply}\"")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 401:
            fail(f"Groq API key invalid (401)  →  check GROQ_API_KEY in .env")
        elif e.code == 429:
            warn(f"Groq rate limit hit (429)  →  key works but you're being throttled")
        else:
            fail(f"Groq API error {e.code}: {body[:200]}")
    except Exception as e:
        fail(f"Groq connection failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 9 — Full dry-run simulation
# ══════════════════════════════════════════════════════════════════════════════

def test_dry_run(token: str, latest_sha: str, config: dict,
                 AIDocumentationEnhancer, MarkdownGenerator):
    section("TEST 9 — Dry-Run Simulation (no files written)")

    if not token or not latest_sha:
        warn("Skipping dry-run — GitHub connection not available")
        return

    if AIDocumentationEnhancer is None:
        warn("Skipping dry-run — generate_docs imports failed")
        return

    repo_url = config.get("github", {}).get("repo_url", "")
    branch   = config.get("github", {}).get("branch", "main")
    state_file = config.get("github", {}).get("state_file", ".last_sync")

    # Read or fake a previous SHA (one commit behind is hard to get,
    # so we simulate "no previous SHA" = first-run scenario)
    last_sha = None
    p = Path(state_file)
    if p.exists():
        last_sha = p.read_text(encoding="utf-8").strip() or None

    try:
        from github_sync import get_changed_files
        new_sha, changed = get_changed_files(repo_url, branch, token, last_sha)

        if not changed:
            ok("GitHub diff ran successfully  →  no changes detected since last run")
            info("To test regeneration: make a commit to the repo, then run again")
            info("Or run:  python update_docs.py --reset  to force-process all files")
        else:
            ok(f"GitHub diff ran successfully  →  {len(changed)} file(s) would be processed")
            print()
            for f in changed[:10]:
                icon = "🗑️ " if "[DELETED]" in f else "📝"
                print(f"    {icon}  {f}")
            if len(changed) > 10:
                info(f"    ... and {len(changed) - 10} more")

    except Exception as e:
        fail(f"Dry-run simulation failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
#  TEST 10 — Quick doc-gen smoke test (1 file, no AI)
# ══════════════════════════════════════════════════════════════════════════════

def test_doc_gen_smoke(config: dict, MarkdownGenerator, AIDocumentationEnhancer):
    section("TEST 10 — Doc Generation Smoke Test (1 synthetic file, AI disabled)")

    if MarkdownGenerator is None:
        warn("Skipping — generate_docs imports failed")
        return

    out_dir = config.get("output_dir", "./docs_output")

    # Create a temp TS file
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        fake_file = tmp_path / "testUtils.ts"
        fake_file.write_text(
            'export function formatCurrency(amount: number, currency: string = "USD"): string {\n'
            '  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);\n'
            '}\n\n'
            'export function truncate(str: string, maxLen: number): string {\n'
            '  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;\n'
            '}\n',
            encoding="utf-8"
        )

        try:
            # Use AI-disabled config for speed
            ai_cfg = {**config.get("ai_enhancement", {}), "enabled": False}
            enhancer  = AIDocumentationEnhancer(ai_cfg)
            generator = MarkdownGenerator(out_dir, enhancer)
            generator.functional_scopes = config.get("functional_scopes", {})
            generator.register_repo_type("test-repo", "frontend")

            from generate_docs import TypeScriptParser
            parser = TypeScriptParser()
            info_data = parser.parse(fake_file.read_text(encoding="utf-8"))

            generator.generate(fake_file, info_data, tmp_path, "test-repo",
                                fake_file.read_text(encoding="utf-8"))

            # Look for output
            out = Path(out_dir)
            gen_files = sorted(out.glob("*testUtils*"), key=lambda f: f.stat().st_mtime,
                                reverse=True)
            if gen_files:
                doc = gen_files[0]
                size = doc.stat().st_size
                ok(f"Doc generated successfully  →  {doc.name}  ({size} bytes)")
                info(f"Full path: {doc.resolve()}")
                # Show first few lines
                lines = doc.read_text(encoding="utf-8").splitlines()[:8]
                print()
                for ln in lines:
                    print(f"    {ln}")
                print("    ...")
            else:
                warn("generator.generate() ran but no output file found — check output_dir")
        except Exception as e:
            fail(f"Doc generation smoke test failed: {e}")
            import traceback
            traceback.print_exc()


# ══════════════════════════════════════════════════════════════════════════════
#  SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

def print_summary():
    print(f"\n{BOLD}{'═'*55}{RESET}")
    print(f"{BOLD}  TEST SUMMARY{RESET}")
    print(f"{BOLD}{'═'*55}{RESET}")
    print(f"  {GREEN}✅ Passed : {PASS_COUNT}{RESET}")
    print(f"  {RED}❌ Failed : {FAIL_COUNT}{RESET}")

    if FAIL_COUNT == 0:
        print(f"\n  {GREEN}{BOLD}🎉 All tests passed! System is ready.{RESET}")
        print(f"  Run:  python update_docs.py --dry-run   to preview changes")
        print(f"  Run:  python update_docs.py --reset     to regenerate all docs")
        print(f"  Run:  python update_docs.py             for normal incremental update")
    else:
        print(f"\n  {RED}{BOLD}⚠️  Fix the failures above before running update_docs.py{RESET}")
    print(f"{BOLD}{'═'*55}{RESET}\n")


# ══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def main():
    ap = argparse.ArgumentParser(description="Validate the Documentation Updater setup.")
    ap.add_argument("--quick", action="store_true",
                    help="Skip AI and doc-gen tests (faster)")
    args = ap.parse_args()

    print(f"\n{BOLD}{'═'*55}{RESET}")
    print(f"{BOLD}  Documentation Updater — Setup Validator{RESET}")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Working dir: {Path.cwd()}")
    print(f"{BOLD}{'═'*55}{RESET}")

    # Make sure we can import yaml (minimum requirement)
    try:
        import yaml
    except ImportError:
        print(f"\n{RED}FATAL: pyyaml not installed. Run:  pip install pyyaml{RESET}\n")
        sys.exit(1)

    # Run tests in order
    groq_key, github_token = test_env()
    config = test_config()

    if not config:
        fail("Cannot continue without valid config.yaml")
        print_summary()
        sys.exit(1)

    latest_sha, branch = test_github(github_token, config)
    test_state_file(config)
    test_output_dir(config)
    Enhancer, Generator, parser_classes = test_imports()
    test_parsers(parser_classes)

    if not args.quick:
        test_groq(groq_key, config)
        test_dry_run(github_token, latest_sha, config, Enhancer, Generator)
        if Enhancer and Generator:
            test_doc_gen_smoke(config, Generator, Enhancer)
    else:
        info("--quick mode: skipping Groq, dry-run, and doc-gen tests")

    print_summary()


if __name__ == "__main__":
    main()