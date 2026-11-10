#!/usr/bin/env python3
"""Validate repository-local links in Markdown files without network access."""
from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", ".venv", "node_modules", "vendor", "dist", "build", "tmp"}


def destination_end(line: str, start: int) -> int | None:
    depth = 1
    angle = False
    escaped = False
    for position in range(start, len(line)):
        character = line[position]
        if escaped:
            escaped = False
            continue
        if character == "\\":
            escaped = True
            continue
        if character == "<" and position == start:
            angle = True
        if character == ">":
            angle = False
        if angle:
            continue
        depth += {"(": 1, ")": -1}.get(character, 0)
        if depth == 0:
            return position
    return None


def without_title(raw: str) -> str:
    if raw.startswith("<"):
        closing = raw.find(">")
        return raw[1:closing] if closing >= 0 else ""
    if raw and raw[-1] in ("'", '"'):
        title_start = raw.rfind(raw[-1], 0, len(raw) - 1)
        if title_start > 0 and raw[title_start - 1].isspace():
            return raw[:title_start].rstrip()
    return raw


def markdown_links(line: str):
    """Read inline destinations in one forward pass, including nested parentheses."""
    position = 0
    while position < len(line):
        marker = line.find("](", position)
        if marker < 0:
            return
        start = marker + 2
        while start < len(line) and line[start].isspace():
            start += 1
        closing = destination_end(line, start)
        if closing is None:
            return
        yield without_title(line[start:closing].strip())
        position = closing + 1


def markdown_files():
    for directory, children, filenames in os.walk(ROOT):
        children[:] = [name for name in children if name not in SKIP_DIRS]
        for filename in filenames:
            if filename.endswith(".md"):
                yield Path(directory) / filename


def check_links() -> list[str]:
    broken: list[str] = []
    md_files = sorted(markdown_files())
    for source in md_files:
        fenced = False
        for lineno, line in enumerate(source.read_text(encoding="utf-8").splitlines(), start=1):
            if line.lstrip().startswith((chr(96) * 3, "~~~")):
                fenced = not fenced
                continue
            if fenced:
                continue
            for raw in markdown_links(line):
                if not raw or raw.startswith(("#", "/", "mailto:", "data:")):
                    continue
                if urlsplit(raw).scheme:
                    continue
                path = unquote(raw.split("#", 1)[0].split("?", 1)[0])
                if not path:
                    continue
                target = (source.parent / path).resolve()
                if not target.is_relative_to(ROOT) or not target.exists():
                    relative = source.relative_to(ROOT)
                    broken.append(f"{relative}:{lineno}: {raw} -> missing {path}")
    return broken


if __name__ == "__main__":
    missing = check_links()
    if missing:
        print(f"Found {len(missing)} broken local Markdown links:")
        for problem in missing:
            print(" -", problem)
        sys.exit(1)
    print("Local Markdown file links are valid.")
