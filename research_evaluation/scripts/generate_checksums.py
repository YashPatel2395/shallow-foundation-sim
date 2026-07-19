#!/usr/bin/env python3
"""
Generates SHA-256 checksums for every CSV, JSON, Markdown, and log file under
research_evaluation/evidence/, written to research_evaluation/evidence/SHA256SUMS.txt.
Paths in the output are relative to research_evaluation/evidence/.
"""
import hashlib
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EVIDENCE_DIR = os.path.join(ROOT, "evidence")
EXTENSIONS = (".csv", ".json", ".md", ".log", ".txt")


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    lines = []
    for dirpath, _, filenames in os.walk(EVIDENCE_DIR):
        for fname in sorted(filenames):
            if fname == "SHA256SUMS.txt":
                continue
            if not fname.lower().endswith(EXTENSIONS):
                continue
            full = os.path.join(dirpath, fname)
            rel = os.path.relpath(full, EVIDENCE_DIR)
            digest = sha256_of(full)
            lines.append(f"{digest}  {rel}")
    lines.sort(key=lambda l: l.split("  ", 1)[1])
    out_path = os.path.join(EVIDENCE_DIR, "SHA256SUMS.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"wrote {out_path} ({len(lines)} files)")


if __name__ == "__main__":
    main()
