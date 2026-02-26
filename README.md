# tree-sitter-wren

Tree-sitter grammar for the Wren programming language.

## Status

- Grammar source: `grammar.js`
- Generated parser: `src/parser.c` and `src/scanner.c`
- Query files: `queries/`

## Editor Integration

- Zed: use this repository in the extension grammar config.
- Neovim: use this parser with `nvim-treesitter` and query files from `queries/`.

## Development

Generate parser sources:

```bash
tree-sitter generate
```

Parse a file:

```bash
tree-sitter parse path/to/file.wren
```
