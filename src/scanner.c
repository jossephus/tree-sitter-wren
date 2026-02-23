// External scanner for nested block comments in Wren.
// Wren supports /* ... /* ... */ ... */ style nesting.

#include "tree_sitter/parser.h"

enum TokenType {
  BLOCK_COMMENT,
};

void *tree_sitter_wren_external_scanner_create(void) {
  return NULL;
}

void tree_sitter_wren_external_scanner_destroy(void *payload) {
}

unsigned tree_sitter_wren_external_scanner_serialize(void *payload,
                                                     char *buffer) {
  return 0;
}

void tree_sitter_wren_external_scanner_deserialize(void *payload,
                                                    const char *buffer,
                                                    unsigned length) {
}

static void skip_whitespace(TSLexer *lexer) {
  while (!lexer->eof(lexer) &&
         (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
          lexer->lookahead == '\r' || lexer->lookahead == '\n')) {
    lexer->advance(lexer, true);
  }
}

bool tree_sitter_wren_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  if (!valid_symbols[BLOCK_COMMENT]) {
    return false;
  }

  skip_whitespace(lexer);

  if (lexer->lookahead != '/') {
    return false;
  }

  // Mark end before advancing so we don't consume '/' if this isn't a comment.
  lexer->mark_end(lexer);
  lexer->advance(lexer, false);

  if (lexer->lookahead != '*') {
    return false;
  }
  lexer->advance(lexer, false);

  int nesting = 1;

  while (nesting > 0 && !lexer->eof(lexer)) {
    if (lexer->lookahead == '/') {
      lexer->advance(lexer, false);
      if (!lexer->eof(lexer) && lexer->lookahead == '*') {
        lexer->advance(lexer, false);
        nesting++;
      }
      continue;
    }

    if (lexer->lookahead == '*') {
      lexer->advance(lexer, false);
      if (!lexer->eof(lexer) && lexer->lookahead == '/') {
        lexer->advance(lexer, false);
        nesting--;
      }
      continue;
    }

    lexer->advance(lexer, false);
  }

  lexer->mark_end(lexer);
  lexer->result_symbol = BLOCK_COMMENT;
  return true;
}
