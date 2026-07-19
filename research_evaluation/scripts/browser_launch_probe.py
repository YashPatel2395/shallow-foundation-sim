"""
Diagnostic probe (not part of the evaluation test suite itself).
Attempts to launch a Playwright-managed Chromium instance in headless mode
against the application's entry point via file:// (no local server required,
since the application performs no fetch() calls and uses classic <script>
tags rather than ES module imports).

Purpose: determine, with direct evidence, whether real browser automation
is possible in this execution environment. Output is captured verbatim into
research_evaluation/logs/ as part of the evaluation record.
"""
from playwright.sync_api import sync_playwright
import traceback

URL = "file:///Users/yashpatel/Documents/CIVIL/index.html"

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        page.goto(URL, timeout=15000)
        print("RESULT: SUCCESS - page title =", page.title())
        browser.close()
except Exception:
    print("RESULT: FAILURE - browser could not be launched")
    traceback.print_exc()
