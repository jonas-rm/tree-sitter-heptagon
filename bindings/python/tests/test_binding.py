from unittest import TestCase

import tree_sitter
import tree_sitter_heptagon


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_heptagon.language())
        except Exception:
            self.fail("Error loading heptagon grammar")
