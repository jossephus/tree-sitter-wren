package tree_sitter_wren_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_wren "github.com/jossephus/wren-lsp/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_wren.Language())
	if language == nil {
		t.Errorf("Error loading Wren grammar")
	}
}
