/**
 * @file Tree sitter parser for wren.io
 * @author jossephus <jossephustuemay@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Wren precedence table (tightest to loosest):
// 1:  () [] .        Grouping, Subscript, Method call
// 2:  - ! ~          Negate, Not, Complement (prefix)
// 3:  * / %          Multiply, Divide, Modulo
// 4:  + -            Add, Subtract
// 5:  .. ...         Range
// 6:  << >>          Shift
// 7:  &              Bitwise and
// 8:  ^              Bitwise xor
// 9:  |              Bitwise or
// 10: < <= > >=      Comparison
// 11: is             Type test
// 12: == !=          Equality
// 13: &&             Logical and
// 14: ||             Logical or
// 15: ?:             Conditional (ternary)
// 16: =              Assignment

const PREC = {
  ASSIGNMENT: 1,
  CONDITIONAL: 2,
  LOGICAL_OR: 3,
  LOGICAL_AND: 4,
  EQUALITY: 5,
  IS: 6,
  COMPARISON: 7,
  BITWISE_OR: 8,
  BITWISE_XOR: 9,
  BITWISE_AND: 10,
  SHIFT: 11,
  RANGE: 12,
  ADD: 13,
  MULTIPLY: 14,
  PREFIX: 15,
  CALL: 16,
};

module.exports = grammar({
  name: "wren",

  externals: $ => [
    $.block_comment,
  ],

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      optional($.shebang),
      repeat($._statement),
    ),

    shebang: $ => token(seq('#!', /[^\n]*/)),

    _statement: $ => choice(
      $.var_statement,
      $.class_definition,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.break_statement,
      $.continue_statement,
      $.return_statement,
      $.import_statement,
      $.expression_statement,
    ),

    // --- Blocks ---

    // Used for control flow bodies and method bodies, not standalone.
    block: $ => seq('{', repeat($._statement), '}'),

    // --- Statements ---

    var_statement: $ => seq(
      'var',
      field('name', $.identifier),
      optional(seq('=', field('value', $._expression))),
    ),

    expression_statement: $ => $._expression,

    // --- Control Flow ---

    _block_or_statement: $ => choice($.block, $._statement),

    if_statement: $ => prec.right(seq(
      'if',
      '(',
      field('condition', $._expression),
      ')',
      field('consequence', $._block_or_statement),
      optional(seq('else', field('alternative', $._block_or_statement))),
    )),

    while_statement: $ => seq(
      'while',
      '(',
      field('condition', $._expression),
      ')',
      field('body', $._block_or_statement),
    ),

    for_statement: $ => seq(
      'for',
      '(',
      field('variable', $.identifier),
      'in',
      field('iterator', $._expression),
      ')',
      field('body', $._block_or_statement),
    ),

    break_statement: $ => 'break',

    continue_statement: $ => 'continue',

    return_statement: $ => prec.right(seq(
      'return',
      optional(field('value', $._expression)),
    )),

    // --- Import ---

    import_statement: $ => prec.right(seq(
      'import',
      field('path', $.string),
      optional(seq(
        'for',
        field('variables', $.import_variable_list),
      )),
    )),

    import_variable_list: $ => seq(
      $.import_variable,
      repeat(seq(',', $.import_variable)),
    ),

    import_variable: $ => seq(
      field('name', $.identifier),
      optional(seq('as', field('alias', $.identifier))),
    ),

    // --- Class Definition ---

    class_definition: $ => seq(
      repeat($.attribute),
      optional('foreign'),
      'class',
      field('name', $.identifier),
      optional(seq('is', field('superclass', $.identifier))),
      '{',
      repeat($._class_member),
      '}',
    ),

    attribute: $ => seq(
      choice('#!', '#'),
      field('name', $.identifier),
      optional(choice(
        seq('=', field('value', $._attribute_value)),
        $.attribute_group,
      )),
    ),

    attribute_group: $ => seq(
      '(',
      $.attribute_entry,
      repeat(seq(',', $.attribute_entry)),
      ')',
    ),

    attribute_entry: $ => seq(
      field('key', $.identifier),
      optional(seq('=', field('value', $._attribute_value))),
    ),

    _attribute_value: $ => choice(
      $.identifier,
      $.string,
      $.boolean,
      $.number,
    ),

    _class_member: $ => choice(
      $.method_definition,
      $.constructor_definition,
      $.foreign_method,
    ),

    // Constructor: construct name(params) { body }
    constructor_definition: $ => seq(
      repeat($.attribute),
      'construct',
      field('name', $.identifier),
      optional(field('parameters', $.parameter_list)),
      field('body', $.method_body),
    ),

    // Regular method, getter, setter, operator, subscript
    method_definition: $ => seq(
      repeat($.attribute),
      optional('static'),
      choice(
        $.getter_definition,
        $.setter_definition,
        $.named_method,
        $.operator_method,
        $.prefix_operator_method,
        $.subscript_method,
        $.subscript_setter_method,
      ),
    ),

    getter_definition: $ => seq(
      field('name', $.identifier),
      field('body', $.method_body),
    ),

    setter_definition: $ => seq(
      field('name', $.identifier),
      '=',
      '(',
      field('parameter', $.identifier),
      ')',
      field('body', $.method_body),
    ),

    named_method: $ => seq(
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      field('body', $.method_body),
    ),

    operator_method: $ => seq(
      field('operator', choice('+', '-', '*', '/', '%', '<', '>', '<=', '>=', '==', '!=', '&', '|', 'is', '<<', '>>', '^')),
      '(',
      field('parameter', $.identifier),
      ')',
      field('body', $.method_body),
    ),

    prefix_operator_method: $ => seq(
      field('operator', choice('-', '!', '~')),
      field('body', $.method_body),
    ),

    subscript_method: $ => seq(
      '[',
      field('parameters', $.subscript_parameter_list),
      ']',
      field('body', $.method_body),
    ),

    subscript_setter_method: $ => seq(
      '[',
      field('parameters', $.subscript_parameter_list),
      ']',
      '=',
      '(',
      field('value_parameter', $.identifier),
      ')',
      field('body', $.method_body),
    ),

    subscript_parameter_list: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier)),
    ),

    // Foreign method declarations (no body)
    foreign_method: $ => seq(
      repeat($.attribute),
      optional('static'),
      'foreign',
      choice(
        $.foreign_named_method,
        $.foreign_getter,
      ),
    ),

    foreign_named_method: $ => seq(
      field('name', $.identifier),
      field('parameters', $.parameter_list),
    ),

    foreign_getter: $ => field('name', $.identifier),

    method_body: $ => seq('{', repeat($._statement), '}'),

    parameter_list: $ => seq(
      '(',
      optional(seq(
        $.identifier,
        repeat(seq(',', $.identifier)),
      )),
      ')',
    ),

    // --- Expressions ---

    _expression: $ => choice(
      $.number,
      $.string,
      $.raw_string,
      $.boolean,
      $.null,
      $.this,
      $.super_expression,
      $.identifier,
      $.parenthesized_expression,
      $.unary_expression,
      $.binary_expression,
      $.logical_expression,
      $.conditional_expression,
      $.assignment_expression,
      $.call_expression,
      $.method_call_expression,
      $.subscript_expression,
      $.field,
      $.static_field,
      $.list_literal,
      $.map_literal,
      $.closure,
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    this: $ => 'this',

    super_expression: $ => choice(
      // super.method or super.method(args)
      seq('super', '.', field('method', $.identifier)),
      // super(args) — in constructors
      seq('super', '(', optional(field('arguments', $.argument_list)), ')'),
      // bare super — calls same-named method in parent class
      prec(-1, 'super'),
    ),

    // --- Closures / Block arguments ---

    closure: $ => prec(-1, seq(
      '{',
      optional(seq('|', optional($.closure_parameter_list), '|')),
      repeat($._statement),
      '}',
    )),

    closure_parameter_list: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier)),
    ),

    // --- Unary ---

    unary_expression: $ => prec(PREC.PREFIX, seq(
      field('operator', choice('-', '!', '~')),
      field('operand', $._expression),
    )),

    // --- Binary ---

    binary_expression: $ => choice(
      ...[
        ['*', PREC.MULTIPLY],
        ['/', PREC.MULTIPLY],
        ['%', PREC.MULTIPLY],
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['..', PREC.RANGE],
        ['...', PREC.RANGE],
        ['<<', PREC.SHIFT],
        ['>>', PREC.SHIFT],
        ['&', PREC.BITWISE_AND],
        ['^', PREC.BITWISE_XOR],
        ['|', PREC.BITWISE_OR],
        ['<', PREC.COMPARISON],
        ['<=', PREC.COMPARISON],
        ['>', PREC.COMPARISON],
        ['>=', PREC.COMPARISON],
        ['is', PREC.IS],
        ['==', PREC.EQUALITY],
        ['!=', PREC.EQUALITY],
      ].map(([op, prec_val]) =>
        prec.left(prec_val, seq(
          field('left', $._expression),
          field('operator', op),
          field('right', $._expression),
        ))
      ),
    ),

    logical_expression: $ => choice(
      prec.left(PREC.LOGICAL_AND, seq(
        field('left', $._expression),
        field('operator', '&&'),
        field('right', $._expression),
      )),
      prec.left(PREC.LOGICAL_OR, seq(
        field('left', $._expression),
        field('operator', '||'),
        field('right', $._expression),
      )),
    ),

    // --- Conditional (ternary) ---

    conditional_expression: $ => prec.right(PREC.CONDITIONAL, seq(
      field('condition', $._expression),
      '?',
      field('consequence', $._expression),
      ':',
      field('alternative', $._expression),
    )),

    // --- Assignment ---

    assignment_expression: $ => prec.right(PREC.ASSIGNMENT, seq(
      field('target', choice(
        $.identifier,
        $.field,
        $.static_field,
        $.method_call_expression,
        $.subscript_expression,
      )),
      '=',
      field('value', $._expression),
    )),

    // --- Calls ---

    // Function/method call with block argument: expr(args) { block }
    // or just: expr(args)
    call_expression: $ => prec.right(PREC.CALL, seq(
      field('target', $._expression),
      '(',
      optional(field('arguments', $.argument_list)),
      ')',
      optional(field('block_argument', $.closure)),
    )),

    // Method/property access: expr.name or expr.name { block }
    method_call_expression: $ => prec.right(PREC.CALL, seq(
      field('receiver', $._expression),
      '.',
      field('method', $.identifier),
      optional(field('block_argument', $.closure)),
    )),

    // Subscript: expr[args]
    subscript_expression: $ => prec(PREC.CALL, seq(
      field('receiver', $._expression),
      '[',
      field('arguments', $.argument_list),
      ']',
    )),

    argument_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression)),
    ),

    // --- List & Map Literals ---

    list_literal: $ => seq(
      '[',
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression)),
        optional(','),
      )),
      ']',
    ),

    map_literal: $ => prec(1, seq(
      '{',
      optional(seq(
        $.map_entry,
        repeat(seq(',', $.map_entry)),
        optional(','),
      )),
      '}',
    )),

    map_entry: $ => seq(
      field('key', $._expression),
      ':',
      field('value', $._expression),
    ),

    // --- Fields ---

    field: $ => /_{1}[a-zA-Z_][a-zA-Z0-9_]*/,

    static_field: $ => /_{2}[a-zA-Z_][a-zA-Z0-9_]*/,

    // --- Literals ---

    number: $ => choice(
      /0x[0-9a-fA-F]+/,
      /[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/,
    ),

    string: $ => seq(
      '"',
      repeat(choice(
        $.escape_sequence,
        $.interpolation,
        $.string_content,
      )),
      '"',
    ),

    string_content: $ => /[^"\\%]+/,

    escape_sequence: $ => choice(
      /\\[0abefnrtv"\\%]/,
      /\\x[0-9a-fA-F]{2}/,
      /\\u[0-9a-fA-F]{4}/,
      /\\U[0-9a-fA-F]{8}/,
    ),

    interpolation: $ => seq('%', '(', $._expression, ')'),

    raw_string: $ => seq('"""', /([^"]|"[^"]|""[^"])*/, '"""'),

    boolean: $ => choice('true', 'false'),

    null: $ => 'null',

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // --- Comments ---

    line_comment: $ => /\/\/[^\n]*/,
  },
});
