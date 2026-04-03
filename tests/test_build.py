"""Tests for TMLR build orchestration: frontmatter, TOC, table fallback."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "export" / "tmlr"))
from build import build_frontmatter, build_toc


# ===================================================================
# FRONTMATTER
# ===================================================================

class TestFrontmatter:

    def test_distill_layout(self):
        fm = build_frontmatter({}, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert parsed["layout"] == "distill"

    def test_title_from_project(self):
        fm = build_frontmatter({"title": "My Paper"}, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert parsed["title"] == "My Paper"

    def test_anonymous_mode(self):
        proj = {
            "title": "Test",
            "authors": [{"name": "Alice", "affiliations": ["MIT"]}],
        }
        fm = build_frontmatter(proj, anonymous=True)
        parsed = yaml.safe_load(fm)
        assert len(parsed["authors"]) == 1
        assert parsed["authors"][0]["name"] == "Anonymous"

    def test_non_anonymous_preserves_authors(self):
        proj = {
            "title": "Test",
            "authors": [
                {"name": "Alice", "affiliations": ["MIT"]},
                {"name": "Bob", "affiliations": [{"name": "Stanford"}]},
            ],
        }
        fm = build_frontmatter(proj, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert len(parsed["authors"]) == 2
        assert parsed["authors"][0]["name"] == "Alice"
        assert parsed["authors"][1]["name"] == "Bob"

    def test_affiliation_string_format(self):
        """Affiliations given as plain strings."""
        proj = {"authors": [{"name": "A", "affiliations": ["OSU"]}]}
        fm = build_frontmatter(proj, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert parsed["authors"][0]["affiliations"]["name"] == "OSU"

    def test_affiliation_dict_format(self):
        """Affiliations given as dicts with 'name' key."""
        proj = {"authors": [{"name": "A", "affiliations": [{"name": "OSU"}]}]}
        fm = build_frontmatter(proj, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert parsed["authors"][0]["affiliations"]["name"] == "OSU"

    def test_bibliography_field(self):
        fm = build_frontmatter({}, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert parsed["bibliography"] == "submission.bib"

    def test_htmlwidgets_enabled(self):
        fm = build_frontmatter({}, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert parsed["htmlwidgets"] is True

    def test_empty_project(self):
        """Shouldn't crash with empty project dict."""
        fm = build_frontmatter({}, anonymous=False)
        parsed = yaml.safe_load(fm)
        assert parsed["title"] == ""
        assert parsed["authors"] == []


# ===================================================================
# TOC GENERATION
# ===================================================================

class TestTOC:

    def test_h2_entries(self):
        content = "## Introduction\ntext\n## Methods\ntext"
        toc = build_toc(content)
        assert len(toc) == 2
        assert toc[0]["name"] == "Introduction"
        assert toc[1]["name"] == "Methods"

    def test_h3_subsections(self):
        content = "## Methods\n### Dataset\n### Model"
        toc = build_toc(content)
        assert len(toc) == 1
        assert len(toc[0]["subsections"]) == 2
        assert toc[0]["subsections"][0]["name"] == "Dataset"

    def test_h3_without_h2_ignored(self):
        """### before any ## should not create orphan entries."""
        content = "### Orphan\n## Real Section"
        toc = build_toc(content)
        assert len(toc) == 1
        assert toc[0]["name"] == "Real Section"

    def test_h1_ignored(self):
        """# Title should not appear in TOC (only ## and ###)."""
        content = "# Title\n## Section"
        toc = build_toc(content)
        assert len(toc) == 1
        assert toc[0]["name"] == "Section"

    def test_empty_content(self):
        assert build_toc("") == []

    def test_h4_ignored(self):
        content = "## Section\n#### Deep heading"
        toc = build_toc(content)
        assert len(toc) == 1
        assert "subsections" not in toc[0]

    def test_heading_with_inline_math(self):
        """Headings containing $math$ in serialized output."""
        content = "## Loss Function $\\mathcal{L}$\n### KL Divergence"
        toc = build_toc(content)
        assert toc[0]["name"] == "Loss Function $\\mathcal{L}$"

    def test_heading_with_html_tags(self):
        """Headings containing <d-cite> or other tags."""
        content = '## Related Work <d-cite key="ref"></d-cite>'
        toc = build_toc(content)
        assert '<d-cite' in toc[0]["name"]


# ===================================================================
# TABLE SERIALIZATION
# ===================================================================

class TestTableSerialization:

    def test_simple_pipe_table(self):
        from build import _serialize_table
        from conftest import table_row, table_cell, text

        rows = [
            table_row(table_cell(text("A")), table_cell(text("B"))),
            table_row(table_cell(text("1")), table_cell(text("2"))),
        ]
        result = _serialize_table(rows)
        assert "A" in result
        assert "B" in result
        assert "|" in result
        assert "---" in result  # separator row

    def test_empty_table(self):
        from build import _serialize_table
        assert _serialize_table([]) == ""

    def test_header_only_table(self):
        """Single row (header only) — no data rows."""
        from build import _serialize_table
        from conftest import table_row, table_cell, text

        rows = [table_row(table_cell(text("H1")), table_cell(text("H2")))]
        result = _serialize_table(rows)
        assert result == ""  # tabulate needs >= 2 rows (header + 1 data)
