"""Regressions for the link parser after removing backtracking expressions."""
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from check_markdown_links import check_links, markdown_links


class MarkdownLinkTests(unittest.TestCase):
    def test_paths_with_spaces_and_optional_titles(self):
        self.assertEqual(
            list(markdown_links('[uno](docs/un archivo.md) [dos](<docs/otro archivo.md> "título")')),
            ['docs/un archivo.md', 'docs/otro archivo.md'],
        )

    def test_balanced_parentheses_and_escaped_closing_character(self):
        self.assertEqual(
            list(markdown_links(r'[uno](docs/a(b).md) ![dos](docs/c\).png)')),
            ['docs/a(b).md', r'docs/c\).png'],
        )

    def test_single_and_double_quoted_titles(self):
        self.assertEqual(
            list(markdown_links('[uno](a.md "un título") [dos](b.md \'otro título\')')),
            ['a.md', 'b.md'],
        )

    def test_unterminated_long_input_and_unmatched_labels(self):
        self.assertEqual(list(markdown_links('[' * 100000 + 'x')), [])
        self.assertEqual(list(markdown_links('[x](' + '(' * 100000)), [])

    def test_repository_check_reports_missing_and_external_paths_only(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'docs').mkdir()
            (root / 'docs' / 'a b.md').write_text('contenido', encoding='utf-8')
            (root / 'tmp').mkdir()
            (root / 'tmp' / 'ignored.md').write_text('[no](missing.md)', encoding='utf-8')
            (root / 'README.md').write_text(
                '[sí](<docs/a b.md>) [web](https://example.invalid) [salto](#x)\n'
                '[no](missing.md) [fuera](../external.md)\n'
                '```\n[ejemplo](absent.md)\n```\n', encoding='utf-8',
            )
            with patch('check_markdown_links.ROOT', root):
                broken = check_links()
            self.assertEqual(len(broken), 2)
            self.assertTrue(any('missing.md' in item for item in broken))
            self.assertTrue(any('../external.md' in item for item in broken))


if __name__ == '__main__':
    unittest.main()
