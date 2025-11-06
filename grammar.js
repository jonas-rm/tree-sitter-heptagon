/**
 * @file A Heptagon tree-sitter parser
 * @author jonas-rm
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-nocheck

module.exports = grammar({
  name: "heptagon",


  extras: $ => [/\s+/, $.comment],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.sub_expression, $.function_call],
  ],

  rules: {
    source_file: $ => repeat($._definition),

    comment: $ => token(seq(
      "(*",
      /[^*]*\*+([^*)][^*]*\*+)*/,
      ")"
    )),

    _definition: $ => choice(
      $.function_def,
      $.type_def,
      $.const_def,
      $.module_call,
    ),

    module_call: $ => seq(
      'open',
      $.enum_identifier,
      repeat(seq('.', $.enum_identifier)),
    ),

    function_def: $ => seq(
      choice("fun", "node"),
      field('name', $.identifier),
      optional(seq("<<", $.param_var_decl_list, ">>")),
      $.parameter_list,
      "returns",
      $.parameter_list,
      optional($.local_vars),
      $.block,
      optional(';'),
    ),

    parameter_list: $ => seq(
      "(",
      optional($.param_var_decl_list),
      ")"
    ),

    lit_type: $ =>
      choice(
        $.primitive_type,
        $.array_type,
        $.user_defined_type,
      ),

    primitive_type: $ => choice(
      "bool",
      "int",
      "float",
      "string",
    ),

    array_type: $ => seq(
      $.lit_type,
      "^",
      choice(
        seq('(', $.expression, ')'),
        $.identifier,
        $.l_number,
      ),
    ),

    user_defined_type: $ =>  seq(
      repeat(seq(
        $.enum_identifier,
        '.',
      )),
      $.identifier,
    ),

    local_vars: $ => seq(
      "var",
      $.local_var_decl_list,
    ),

    param_var_decl_list: $ => seq(
      $.var_decl,
      repeat(seq(';', $.var_decl)),
      optional(';'),
    ),

    local_var_decl_list: $ => seq(
      $.var_decl,
      repeat(seq(';', $.var_decl)),
      ';'
    ),

    var_decl: $ => choice(
      $.var_decl_base,
      $.var_decl_last,
    ),

    var_decl_base: $ => seq(
      $.identifier,
      repeat(seq(",", $.identifier)),
      ":",
      $.lit_type,
      optional($.var_decl_clock),
    ),

    var_decl_clock: $ => seq(
      '::',
      '.',
      repeat1(seq(
        'on',
        choice(
          $.enum_identifier,
          $.identifier),
        '(',
        $.identifier,
        ')',
      )),
    ),

    var_decl_last: $ => seq(
      'last',
      $.var_decl_base,
      '=',
      choice($.identifier, $.literal, $.enum_identifier),
    ),

    block: $ => seq(
      "let",
      optional($._statement_list),
      "tel",
    ),

    _statement_list: $ => repeat1($._statement),

    _statement: $ => choice(
      $.equation_list,
      $.automaton,
      $.switch_statement,
      $.present_statement,
      $.if_then_else_statement,
      $.block,
    ),

    equation_list: $ => prec.right(seq(
      choice($.equation, $.reset_statement),
      repeat(seq(
        ';',
        choice($.equation, $.reset_statement),
      )),
      optional(';'),
    )),

    equation: $ => seq(
      choice(
        $.identifier,
        seq(
          '(',
          optional(seq(
            $.identifier,
            repeat(seq(',', $.identifier)),
          )),
          ')',
        ),
      ),
      "=",
      $.expression,
    ),

    expression: $ => choice(
      $.if_then_else_expression,
      $.sub_expression,
      // $.merge_expression,
      $.iterator_expression,
    ),

    sub_expression: $ => choice(
      $.literal,
      $.identifier,
      $.enum_identifier,
      seq('(', $.expression, ')'),
      prec.right(10, seq($.unary_operator, $.expression)),
      prec.left(9, seq($.expression, $.binary_operator, $.expression)),
      $.record_construction,
      $.function_call,
      $.tuple,
      $.record_access,
      $.array_access,
    ),

    iterator_expression: $ => seq(
      choice('map', 'fold', 'mapfold'),
      $.generic_instantiation,
      $.function_call,
    ),

    tuple: $ => seq(
      '(',
      $.expression,
      repeat1(seq(',', $.expression)),
      ')',
    ),

    function_call: $ => prec.left(seq(
      repeat(seq($.enum_identifier, '.')),
      field('name', $.identifier),
      optional($.generic_instantiation),
      '(',
      optional(seq(
        field('argument', $.expression),
        repeat(seq(
          ',',
          field('argument', $.expression),
        )),
      )),
      ')'
    )),

    generic_instantiation: $ => seq(
      '<<',
      $.expression,
      repeat(seq(
        ',',
        $.expression,
      )),
      '>>'
    ),

    record_construction: $ => seq(
      '{',
      $.identifier,
      '=',
      $.expression,
      repeat(seq(
        ';',
        $.identifier,
        '=',
        $.expression)),
      '}'
    ),

    if_then_else_expression: $ => seq(
      'if',
      $.expression,
      'then',
      $.expression,
      'else',
      $.expression,
    ),

    switch_statement: $ => prec.right(seq(
      'switch',
      $.expression,
      field('case', repeat($.switch_case)),
      'end',
      optional(';'),
    )),

    switch_case: $ => seq(
      '|',
      $.enum_identifier,
      optional($.local_vars),
      'do',
      optional($._statement_list),
    ),

    present_statement: $ => prec.right(seq(
      'present',
      repeat($.present_case),
      optional(seq(
        'default',
        'do',
        $._statement_list,
      )),
      'end',
      optional(';'),
    )),

    present_case: $ => seq(
      '|',
      $.expression,
      optional($.local_vars),
      'do',
      $._statement_list,
    ),

    reset_statement: $ => seq(
      'reset',
      repeat($._statement),
      'every',
      $.expression,
    ),

    if_then_else_statement: $ => seq(
      'if',
      $.expression,
      'then',
      $._statement,
      'else',
      $._statement,
      'end',
    ),

    automaton: $ => seq(
      'automaton',
      optional($.local_vars),
      repeat($.automaton_state),
      'end',
    ),

    automaton_state: $ => seq(
      'state',
      $.enum_identifier,
      optional($.local_vars),
      'do',
      repeat($._statement),
      repeat($.automaton_transition),
    ),

    automaton_transition: $ => seq(
      choice('unless', 'until'),
      $.expression,
      'then',
      $.enum_identifier,
      repeat(seq(
        '|',
        $.expression,
        'then',
        $.enum_identifier,
      )),
    ),

    record_access: $ => seq(
      $.identifier,
      '.',
      $.identifier,
      repeat(seq(
        '.',
        $.identifier,
      )),
    ),

    array_access: $ => prec.right(seq(
      $.identifier,
      choice(
        $.array_access_default,
        $.array_access_truncated,
        $.array_access_slice,
        seq('[', $.expression, ']'),
      ),
    )),

    array_access_default: $ => seq(
      '.',
      '[',
      $.expression,
      ']',
      'default',
      $.expression,
    ),

    array_access_truncated: $ => seq(
      '[>',
      $.expression,
      '<]',
    ),

    array_access_slice: $ => seq(
      '[',
      $.expression,
      '..',
      $.expression,
      ']',
    ),

    type_def: $ => seq(
      'type',
      $.identifier,
      '=',
      choice($.record_type_def, $.enum_type_def, $.lit_type),
    ),

    record_type_def: $ => seq(
      '{',
      $.identifier,
      ':',
      $.lit_type,
      repeat(seq(';', $.identifier, ':', $.lit_type)),
      '}'
    ),

    enum_type_def: $ => seq(
      optional('|'),
      $.enum_identifier,
      repeat(seq(
        '|',
        $.enum_identifier,
      )),
    ),

    const_def: $ => seq(
      'const',
      $.identifier,
      ':',
      $.lit_type,
      '=',
      $.expression,
      optional(';'),
    ),

    literal: $ => choice(
      $.l_number,
      $.l_bool,
      $.l_array,
      $.l_string,
    ),

    l_number: $ => /\d+\.\d+|\d+/,

    l_bool: $ => choice(
      'true',
      'false',
    ),

    l_array: $ => choice(
      $.l_array_extensive,
      $.l_array_intentive,
    ),

    l_array_extensive: $ => seq(
      '[',
      optional(seq(
        $.expression,
        repeat(seq(',', $.expression)),
      )),
      ']',
    ),

    l_array_intentive: $ => seq(
      '[',
      choice($.identifier, $.l_array),
      'with',
      '[',
      $.expression,
      ']',
      '=',
      $.expression,
      ']',
    ),

    l_string: $ => choice(
      seq('"', '"'),
      seq('"', $._string_content, '"'),
    ),

    _string_content: $ => repeat1(choice(
      $.string_content,
      $.escape_sequence,
    )),

    string_content: _ => token.immediate(prec(1, /[^\\"\n]+/)),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      /(\"|\\|\/|b|f|n|r|t|u)/,
    )),


    unary_operator: $ => choice(
      '-.',
      '-',
      'pre',
      'not',
      'last',
    ),

    binary_operator: $ => choice(
      '->',
      'fby',
      '+.',
      '-.',
      '*.',
      '/.',
      '+',
      '-',
      '*',
      '/',
      '<>',
      '<=.',
      '>=.',
      '=.',
      '<.',
      '>.',
      '<=',
      '>=',
      '=',
      '<',
      '>',
      'and',
      'or',
      'xor',
      '%',
      '^'
    ),

    identifier: $ => /[a-z][A-Za-z0-9_]*[']*/,

    enum_identifier: $ => /[A-Z][A-Za-z0-9_]*/,
  },

});
