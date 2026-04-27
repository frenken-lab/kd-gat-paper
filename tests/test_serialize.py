"""Tests for tools/tmlr/build.py AST → Distill markdown serializer.

Focuses on two known failure modes:
  1. HTML tags (especially <d-cite>) rendering as literal text
  2. Inline math not compiling correctly in Distill/MathJax
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Make tools/tmlr importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "tmlr"))
from build import serialize, _text_of

from conftest import (
    text,
    inline_math,
    block_math,
    inline_code,
    code,
    html,
    thematic_break,
    strong,
    emphasis,
    paragraph,
    heading,
    root,
    list_item,
    unordered_list,
    ordered_list,
    cite,
    cite_group,
    cross_reference,
    link,
    figure,
    caption,
    caption_number,
    table_container,
    table_row,
    table_cell,
    table,
    iframe,
    admonition,
    details,
    tab_item,
    tab_set,
)


# ===================================================================
# CITATIONS — <d-cite> tags must survive as raw HTML, not escaped text
# ===================================================================


class TestCitations:
    """Verify <d-cite> tags render as valid HTML in all contexts."""

    def test_single_cite(self):
        result = serialize(cite("smith2024"))
        assert result == '<d-cite key="smith2024"></d-cite>'

    def test_cite_uses_label_over_identifier(self):
        result = serialize(cite("smith2024", label="Smith2024"))
        assert result == '<d-cite key="Smith2024"></d-cite>'

    def test_cite_falls_back_to_identifier(self):
        result = serialize(cite("smith2024"))
        assert result == '<d-cite key="smith2024"></d-cite>'

    def test_cite_group_multiple(self):
        result = serialize(
            cite_group(
                cite("smith2024"),
                cite("jones2023"),
                cite("lee2025"),
            )
        )
        assert result == (
            '<d-cite key="smith2024"></d-cite>'
            '<d-cite key="jones2023"></d-cite>'
            '<d-cite key="lee2025"></d-cite>'
        )

    def test_cite_group_ignores_non_cite_children(self):
        """Non-cite children in a citeGroup should be skipped."""
        node = {
            "type": "citeGroup",
            "children": [
                cite("a"),
                {"type": "text", "value": "noise"},
                cite("b"),
            ],
        }
        result = serialize(node)
        assert '<d-cite key="a"></d-cite>' in result
        assert '<d-cite key="b"></d-cite>' in result
        assert "noise" not in result

    def test_cite_in_paragraph_not_escaped(self):
        """<d-cite> inside a paragraph must remain raw HTML, not &lt;d-cite&gt;."""
        node = paragraph(text("See "), cite("smith2024"), text("."))
        result = serialize(node)
        assert "<d-cite" in result
        assert "&lt;" not in result
        assert "&gt;" not in result

    def test_cite_group_in_paragraph(self):
        """Multiple citations in running text."""
        node = paragraph(
            text("Prior work "),
            cite_group(cite("a"), cite("b")),
            text(" shows..."),
        )
        result = serialize(node)
        assert result.count("<d-cite") == 2
        assert "Prior work " in result
        assert " shows..." in result

    def test_cite_adjacent_to_emphasis(self):
        """Citation next to emphasized text shouldn't break markdown."""
        node = paragraph(
            emphasis(text("important")),
            text(" "),
            cite("ref1"),
        )
        result = serialize(node)
        assert "*important*" in result
        assert '<d-cite key="ref1"></d-cite>' in result

    def test_cite_inside_strong(self):
        """Citation inside bold text — ensure tags aren't swallowed."""
        node = paragraph(strong(text("bold "), cite("ref1")))
        result = serialize(node)
        assert "**" in result
        assert "<d-cite" in result

    def test_cite_key_special_characters(self):
        """Bib keys with underscores, hyphens, colons."""
        for key in ["smith_2024", "smith-2024", "arxiv:2024.12345"]:
            result = serialize(cite(key))
            assert f'key="{key}"' in result

    def test_cite_in_list_item(self):
        node = unordered_list(
            list_item(paragraph(text("Item "), cite("ref1"))),
        )
        result = serialize(node)
        assert "<d-cite" in result
        assert "- " in result

    def test_cite_in_caption(self):
        """Citations in figure captions must render as HTML."""
        node = figure(
            "fig-test",
            caption(text("Results from "), cite("smith2024")),
        )
        result = serialize(node)
        assert "<figcaption>" in result
        assert "<d-cite" in result

    def test_cite_not_double_wrapped(self):
        """d-cite should not appear inside another HTML tag like <p>."""
        node = paragraph(cite("ref1"))
        result = serialize(node)
        # Should be \n<d-cite ...>\n  — no <p> wrapping
        assert "<p>" not in result


# ===================================================================
# INLINE MATH — must compile in MathJax, not break markdown parsing
# ===================================================================


class TestInlineMath:
    """Verify $...$ inline math survives serialization for MathJax."""

    def test_simple_expression(self):
        result = serialize(inline_math("x^2"))
        assert result == "$x^2$"

    def test_subscript(self):
        result = serialize(inline_math("x_i"))
        assert result == "$x_i$"

    def test_subscript_not_interpreted_as_emphasis(self):
        """$a_i$ + text + $b_i$ — underscores must stay inside $ delimiters.

        NOTE: Whether a downstream markdown parser mis-interprets the _
        between closing and opening $ as emphasis is a rendering-level
        concern (parser must process math before emphasis).  The
        serializer's job is to emit correct $-delimited math.
        """
        node = paragraph(
            inline_math("a_i"),
            text(" and "),
            inline_math("b_i"),
        )
        result = serialize(node)
        assert "$a_i$" in result
        assert "$b_i$" in result
        assert "<em>" not in result

    def test_fraction(self):
        result = serialize(inline_math(r"\frac{a}{b}"))
        assert result == r"$\frac{a}{b}$"

    def test_curly_braces_preserved(self):
        result = serialize(inline_math(r"\mathbf{x}"))
        assert result == r"$\mathbf{x}$"

    def test_dollar_delimiter_no_spaces(self):
        """MathJax strict mode requires $...$ with no inner leading/trailing space."""
        result = serialize(inline_math("x + y"))
        # Should be "$x + y$" not "$ x + y $"
        assert result == "$x + y$"
        assert not result.startswith("$ ")
        assert not result.endswith(" $")

    def test_math_in_paragraph_context(self):
        node = paragraph(
            text("where "),
            inline_math("\\alpha = 0.5"),
            text(" is the learning rate"),
        )
        result = serialize(node)
        assert "$\\alpha = 0.5$" in result
        assert "where " in result

    def test_multiple_inline_math_same_paragraph(self):
        """Multiple math expressions in one paragraph shouldn't interfere."""
        node = paragraph(
            inline_math("x"),
            text(", "),
            inline_math("y"),
            text(", and "),
            inline_math("z"),
        )
        result = serialize(node)
        assert result.count("$") == 6  # 3 expressions × 2 delimiters each

    def test_math_adjacent_to_punctuation(self):
        """$x$.  — period after math must not break delimiter matching."""
        node = paragraph(inline_math("x"), text("."))
        result = serialize(node)
        assert "$x$." in result or "$x$" in result

    def test_math_with_text_command(self):
        r"""\\text{} inside inline math."""
        result = serialize(inline_math(r"\text{softmax}(z_i)"))
        assert result == r"$\text{softmax}(z_i)$"

    def test_math_with_operatorname(self):
        result = serialize(inline_math(r"\operatorname{GAT}(x)"))
        assert result == r"$\operatorname{GAT}(x)$"

    def test_math_with_pipe_should_not_break_tables(self):
        """|x| inside math shouldn't create a table column."""
        result = serialize(inline_math(r"\|x\|"))
        assert result == r"$\|x\|$"

    def test_math_with_angle_brackets(self):
        """< and > in math shouldn't be interpreted as HTML tags."""
        result = serialize(inline_math(r"x < y"))
        assert "$x < y$" in result

    def test_math_with_double_subscript(self):
        result = serialize(inline_math(r"x_{i,j}"))
        assert result == r"$x_{i,j}$"

    def test_math_with_hat_and_tilde(self):
        result = serialize(inline_math(r"\hat{y}_i"))
        assert result == r"$\hat{y}_i$"

    def test_math_with_sum(self):
        result = serialize(inline_math(r"\sum_{i=1}^{N} x_i"))
        assert result == r"$\sum_{i=1}^{N} x_i$"


class TestBlockMath:
    """Verify $$...$$ block math."""

    def test_simple_block(self):
        result = serialize(block_math("E = mc^2"))
        assert "$$" in result
        assert "E = mc^2" in result

    def test_block_math_has_blank_line_separation(self):
        """Block math needs newlines around $$ for markdown parsers."""
        result = serialize(block_math("x = 1"))
        assert result == "\n$$\nx = 1\n$$\n"

    def test_align_environment(self):
        latex = r"\begin{align}a &= b \\c &= d\end{align}"
        result = serialize(block_math(latex))
        assert "$$" in result
        assert r"\begin{align}" in result

    def test_block_math_in_paragraph_sequence(self):
        """Math block between paragraphs should have clear separation."""
        node = root(
            paragraph(text("Consider:")),
            block_math(r"\mathcal{L} = -\sum y \log \hat{y}"),
            paragraph(text("where...")),
        )
        result = serialize(node)
        assert "\n$$\n" in result


# ===================================================================
# CROSS-REFERENCES — resolved enumerators from MyST
# ===================================================================


class TestCrossReferences:
    def test_equation_ref_with_template(self):
        node = cross_reference(identifier="eq-loss", template="(%s)", enumerator="3")
        result = serialize(node)
        assert result == "(3)"

    def test_figure_ref_with_template(self):
        node = cross_reference(identifier="fig-arch", template="Figure %s", enumerator="2")
        result = serialize(node)
        assert result == "Figure 2"

    def test_table_ref_with_template(self):
        node = cross_reference(identifier="tbl-results", template="Table %s", enumerator="1")
        result = serialize(node)
        assert result == "Table 1"

    def test_fallback_to_children_text(self):
        """When template/enumerator are missing, use children text."""
        node = cross_reference(
            identifier="sec-intro",
            children=[text("Introduction")],
        )
        result = serialize(node)
        assert result == "Introduction"

    def test_fallback_to_identifier_bracket(self):
        """Last resort: [identifier] when no template, enumerator, or children."""
        node = cross_reference(identifier="sec-missing")
        result = serialize(node)
        assert result == "[sec-missing]"

    def test_empty_enumerator_uses_children(self):
        """Template present but enumerator empty — should fall through."""
        node = cross_reference(
            identifier="eq-1",
            template="(%s)",
            enumerator="",
            children=[text("??")],
        )
        result = serialize(node)
        assert result == "??"


# ===================================================================
# LINKS
# ===================================================================


class TestLinks:
    def test_external_url(self):
        node = link("https://example.com", text("click"))
        result = serialize(node)
        assert result == "[click](https://example.com)"

    def test_internal_path_becomes_anchor(self):
        node = link("/introduction", text("Intro"))
        result = serialize(node)
        assert result == "[Intro](#introduction)"

    def test_internal_path_strips_slashes(self):
        node = link("/background/", text("Background"))
        result = serialize(node)
        assert result == "[Background](#background)"

    def test_path_with_extension_kept(self):
        """Paths with dots (file extensions) should NOT become anchors."""
        node = link("/images/fig.png", text("Figure"))
        result = serialize(node)
        assert result == "[Figure](/images/fig.png)"


# ===================================================================
# IFRAMES — Liquid template syntax for Jekyll
# ===================================================================


class TestIframes:
    def test_github_pages_url_extraction(self):
        node = iframe("https://frenken-lab.github.io/kd-gat-paper/confusion_matrix.html")
        result = serialize(node)
        assert "assets/html/submission/confusion_matrix.html" in result
        assert "relative_url" in result

    def test_liquid_template_syntax(self):
        node = iframe("https://example.com/fig.html")
        result = serialize(node)
        assert "{{ " in result
        assert " | relative_url }}" in result

    def test_iframe_title_from_stem(self):
        node = iframe("https://example.com/roc_curve.html")
        result = serialize(node)
        assert 'title="roc_curve"' in result

    def test_iframe_dimensions(self):
        # Height is just an initial placeholder — autoResizeIframe (in
        # interactive/src/lib/figure-resize.ts) grows/shrinks the host iframe
        # to fit content on same-origin builds.
        node = iframe("https://example.com/fig.html")
        result = serialize(node)
        assert 'width="100%"' in result
        assert 'height="400"' in result


# ===================================================================
# ADMONITIONS — blockquotes (regular) and algorithm boxes
# ===================================================================


class TestAdmonitions:
    def test_regular_admonition_blockquote(self):
        node = admonition(
            [text("Note")],
            [paragraph(text("This is important."))],
        )
        result = serialize(node)
        assert "> **Note**" in result
        assert "> " in result

    def test_algorithm_admonition_uses_div(self):
        node = admonition(
            [text("Algorithm 1")],
            [paragraph(text("Step 1"))],
            cls="algorithm",
        )
        result = serialize(node)
        assert '<div class="algorithm"' in result
        assert "Algorithm 1" in result
        assert "<style>" in result

    def test_algorithm_has_markdown_attribute(self):
        node = admonition([text("Algo")], [paragraph(text("body"))], cls="algorithm")
        result = serialize(node)
        assert 'markdown="1"' in result

    def test_admonition_with_math_in_body(self):
        node = admonition(
            [text("Definition")],
            [paragraph(text("Let "), inline_math("x \\in \\mathbb{R}"))],
        )
        result = serialize(node)
        assert "$x \\in \\mathbb{R}$" in result


# ===================================================================
# DROPDOWNS / DETAILS
# ===================================================================


class TestDetails:
    def test_closed_details(self):
        node = details(
            [text("Show proof")],
            [paragraph(text("By induction..."))],
        )
        result = serialize(node)
        assert (
            "<details " in result or "<details\n" in result or result.strip().startswith("<details")
        )
        assert " open" not in result.split("<summary")[0]  # no open before summary
        assert "<summary" in result

    def test_open_details(self):
        node = details(
            [text("Expanded")],
            [paragraph(text("Visible content"))],
            open=True,
        )
        result = serialize(node)
        assert "<details open" in result

    def test_details_markdown_attribute(self):
        """Both <details> and <summary> need markdown='1' for Kramdown."""
        node = details([text("Title")], [paragraph(text("Body"))])
        result = serialize(node)
        assert result.count('markdown="1"') == 2

    def test_details_body_is_markdown(self):
        """Body content should be serialized markdown, not raw AST."""
        node = details(
            [text("Details")],
            [paragraph(strong(text("bold")), text(" text"))],
        )
        result = serialize(node)
        assert "**bold**" in result


# ===================================================================
# TAB SETS — degraded to flat sections
# ===================================================================


class TestTabSets:
    def test_tabs_degrade_to_sections(self):
        node = tab_set(
            tab_item("PyTorch", paragraph(text("import torch"))),
            tab_item("TensorFlow", paragraph(text("import tf"))),
        )
        result = serialize(node)
        assert "**PyTorch**" in result
        assert "**TensorFlow**" in result
        assert "import torch" in result

    def test_empty_tab_set_falls_through(self):
        node = tab_set()
        result = serialize(node)
        assert result == ""


# ===================================================================
# FIGURES AND TABLES
# ===================================================================


class TestContainers:
    def test_figure_with_id(self):
        node = figure("fig-arch", caption(text("Architecture")))
        result = serialize(node)
        assert '<figure id="fig-arch">' in result
        assert "<figcaption>" in result

    def test_figure_without_id(self):
        node = {
            "type": "container",
            "kind": "figure",
            "children": [
                caption(text("Caption")),
            ],
        }
        result = serialize(node)
        assert "<figure>" in result
        assert "id=" not in result

    def test_caption_number_spacing(self):
        node = caption(caption_number(text("Figure 1")), text("The architecture"))
        result = serialize(node)
        assert "Figure 1 " in result
        assert "The architecture" in result

    def test_table_container_pipe_table(self):
        """Table container without pre-built HTML falls back to pipe table."""
        node = table_container(
            "tbl-custom",
            caption(text("Results")),
            table(
                table_row(table_cell(text("Model")), table_cell(text("F1"))),
                table_row(table_cell(text("GAT")), table_cell(text("0.99"))),
            ),
        )
        result = serialize(node)
        assert "**Results**" in result
        assert "Model" in result
        assert "GAT" in result


# ===================================================================
# BASIC LEAF / FORMATTING NODES
# ===================================================================


class TestLeafNodes:
    def test_text_strips_anchor_syntax(self):
        node = text("Heading text {#sec-intro}")
        result = serialize(node)
        assert result == "Heading text"
        assert "{#" not in result

    def test_text_without_anchor(self):
        assert serialize(text("plain text")) == "plain text"

    def test_inline_code(self):
        assert serialize(inline_code("x = 1")) == "`x = 1`"

    def test_code_block_with_lang(self):
        result = serialize(code("print('hi')", lang="python"))
        assert "```python" in result
        assert "print('hi')" in result

    def test_code_block_no_lang(self):
        result = serialize(code("echo hi"))
        assert "```\n" in result

    def test_html_passthrough(self):
        assert serialize(html("<br/>")) == "<br/>"

    def test_comment_suppressed(self):
        assert serialize({"type": "comment", "value": "ignore"}) == ""

    def test_thematic_break(self):
        assert serialize(thematic_break()) == "\n---\n"

    def test_strong(self):
        assert serialize(strong(text("bold"))) == "**bold**"

    def test_emphasis(self):
        assert serialize(emphasis(text("italic"))) == "*italic*"

    def test_heading_depth(self):
        for depth in range(1, 5):
            result = serialize(heading(depth, text("Title")))
            assert result.strip() == f"{'#' * depth} Title"


class TestLists:
    def test_unordered_list(self):
        node = unordered_list(
            list_item(paragraph(text("a"))),
            list_item(paragraph(text("b"))),
        )
        result = serialize(node)
        assert "- a" in result
        assert "- b" in result

    def test_ordered_list(self):
        node = ordered_list(
            list_item(paragraph(text("first"))),
            list_item(paragraph(text("second"))),
        )
        result = serialize(node)
        assert "1. first" in result
        assert "2. second" in result


# ===================================================================
# SERIALIZE DISPATCH — unknown types
# ===================================================================


class TestDispatch:
    def test_unknown_type_falls_through_to_children(self):
        """Unknown node types should still serialize their children."""
        node = {
            "type": "mystDirective",
            "children": [
                paragraph(text("inner content")),
            ],
        }
        with pytest.warns(UserWarning, match="unhandled AST node type"):
            result = serialize(node)
        assert "inner content" in result

    def test_unknown_type_no_children(self):
        node = {"type": "unknownLeaf"}
        with pytest.warns(UserWarning, match="unhandled"):
            result = serialize(node)
        assert result == ""


# ===================================================================
# HELPER: _text_of
# ===================================================================


class TestTextOf:
    def test_plain_text(self):
        assert _text_of(text("hello")) == "hello"

    def test_nested(self):
        node = paragraph(strong(text("bold")), text(" plain"))
        assert _text_of(node) == "bold plain"

    def test_empty(self):
        assert _text_of({"type": "root"}) == ""
