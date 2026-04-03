"""Shared AST node builders for TMLR serializer tests.

Each helper returns a dict matching the MDAST node schema that
``export/tmlr/build.py`` expects from ``myst build --site`` output.
"""

from __future__ import annotations

import pytest


# ---------------------------------------------------------------------------
# Leaf nodes
# ---------------------------------------------------------------------------

def text(value: str) -> dict:
    return {"type": "text", "value": value}


def inline_math(value: str) -> dict:
    return {"type": "inlineMath", "value": value}


def block_math(value: str) -> dict:
    return {"type": "math", "value": value}


def inline_code(value: str) -> dict:
    return {"type": "inlineCode", "value": value}


def code(value: str, lang: str = "") -> dict:
    return {"type": "code", "value": value, "lang": lang}


def html(value: str) -> dict:
    return {"type": "html", "value": value}


def thematic_break() -> dict:
    return {"type": "thematicBreak"}


# ---------------------------------------------------------------------------
# Inline formatting
# ---------------------------------------------------------------------------

def strong(*children: dict) -> dict:
    return {"type": "strong", "children": list(children)}


def emphasis(*children: dict) -> dict:
    return {"type": "emphasis", "children": list(children)}


# ---------------------------------------------------------------------------
# Block structure
# ---------------------------------------------------------------------------

def paragraph(*children: dict) -> dict:
    return {"type": "paragraph", "children": list(children)}


def heading(depth: int, *children: dict) -> dict:
    return {"type": "heading", "depth": depth, "children": list(children)}


def root(*children: dict) -> dict:
    return {"type": "root", "children": list(children)}


def block(*children: dict) -> dict:
    return {"type": "block", "children": list(children)}


# ---------------------------------------------------------------------------
# Lists
# ---------------------------------------------------------------------------

def list_item(*children: dict) -> dict:
    return {"type": "listItem", "children": list(children)}


def unordered_list(*items: dict) -> dict:
    return {"type": "list", "ordered": False, "children": list(items)}


def ordered_list(*items: dict) -> dict:
    return {"type": "list", "ordered": True, "children": list(items)}


# ---------------------------------------------------------------------------
# Citations
# ---------------------------------------------------------------------------

def cite(identifier: str, label: str | None = None) -> dict:
    node: dict = {"type": "cite", "identifier": identifier}
    if label is not None:
        node["label"] = label
    return node


def cite_group(*cites: dict) -> dict:
    return {"type": "citeGroup", "children": list(cites)}


# ---------------------------------------------------------------------------
# Cross-references
# ---------------------------------------------------------------------------

def cross_reference(
    identifier: str = "",
    template: str = "",
    enumerator: str = "",
    children: list[dict] | None = None,
) -> dict:
    node: dict = {"type": "crossReference", "identifier": identifier}
    if template:
        node["template"] = template
    if enumerator:
        node["enumerator"] = enumerator
    if children:
        node["children"] = children
    return node


# ---------------------------------------------------------------------------
# Links
# ---------------------------------------------------------------------------

def link(url: str, *children: dict) -> dict:
    return {"type": "link", "url": url, "children": list(children)}


# ---------------------------------------------------------------------------
# Figures / containers
# ---------------------------------------------------------------------------

def figure(identifier: str, *children: dict) -> dict:
    return {"type": "container", "kind": "figure", "identifier": identifier, "children": list(children)}


def caption(*children: dict) -> dict:
    return {"type": "caption", "children": list(children)}


def caption_number(*children: dict) -> dict:
    return {"type": "captionNumber", "children": list(children)}


def table_container(identifier: str, *children: dict) -> dict:
    return {"type": "container", "kind": "table", "identifier": identifier, "children": list(children)}


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------

def table_row(*cells: dict) -> dict:
    return {"type": "tableRow", "children": list(cells)}


def table_cell(*children: dict) -> dict:
    return {"type": "tableCell", "children": list(children)}


def table(*rows: dict) -> dict:
    return {"type": "table", "children": list(rows)}


# ---------------------------------------------------------------------------
# iframes
# ---------------------------------------------------------------------------

def iframe(src: str) -> dict:
    return {"type": "iframe", "src": src}


# ---------------------------------------------------------------------------
# Admonitions
# ---------------------------------------------------------------------------

def admonition_title(*children: dict) -> dict:
    return {"type": "admonitionTitle", "children": list(children)}


def admonition(title_children: list[dict], body_children: list[dict], cls: str = "") -> dict:
    node: dict = {
        "type": "admonition",
        "children": [
            admonition_title(*title_children),
            *body_children,
        ],
    }
    if cls:
        node["class"] = cls
    return node


# ---------------------------------------------------------------------------
# Dropdowns / details
# ---------------------------------------------------------------------------

def summary(*children: dict) -> dict:
    return {"type": "summary", "children": list(children)}


def details(summary_children: list[dict], body_children: list[dict], *, open: bool = False) -> dict:
    node: dict = {
        "type": "details",
        "children": [
            summary(*summary_children),
            *body_children,
        ],
    }
    if open:
        node["open"] = True
    return node


# ---------------------------------------------------------------------------
# Tabs
# ---------------------------------------------------------------------------

def tab_item(title: str, *children: dict) -> dict:
    return {"type": "tabItem", "title": title, "children": list(children)}


def tab_set(*items: dict) -> dict:
    return {"type": "tabSet", "children": list(items)}
