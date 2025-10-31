package tree_sitter_heptagon_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_heptagon "github.com/jonas-rm/tree-sitter-heptagon/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_heptagon.Language())
	if language == nil {
		t.Errorf("Error loading heptagon grammar")
	}
}
