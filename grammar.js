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
      $.comment,
      $.function_def,
      $.type_def,
      // TODO: $._const_def,
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
      optional(seq(
        $.param_var_decl_list,
      )),
      ")"
    ),

    lit_type: $ =>
      choice(
        $.primitive_type,
        $.array_type,
        $.identifier,
      ),

    primitive_type: $ => choice(
      "bool",
      "int",
      "float",
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
      choice($.identifier, $.literal),
    ),

    block: $ => seq(
      "let",
      repeat($._statement),
      "tel",
    ),

    _statement: $ => choice(
      $.equation_list,
      $.automaton,
      $.switch_statement,
      $.present_statement,
      // TODO: $.if_then_else_statement,
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
          $.identifier,
          repeat(seq(',', $.identifier)),
          ')'
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
      seq('(', $.expression, ')'),
      prec.right(10, seq($.unary_operator, $.expression)),
      prec.left(9, seq($.expression, $.binary_operator, $.expression)),
      $.record_construction,
      $.function_call,
      $.tuple,
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
      field('name', $.identifier),
      optional($.generic_instantiation),
      '(',
      optional(seq(
        $.expression,
        repeat(seq(
          ',',
          $.expression,
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

    switch_statement: $ => seq(
      'switch',
      $.identifier,
      repeat(seq(
        '|',
        $.enum_identifier,
        'do',
        repeat1($._statement),
      )),
      'end'
    ),

    present_statement: $ => seq(
      'present',
      repeat(seq(
        '|',
        $.expression,
        'do',
        $._statement,
      )),
      optional(seq(
        'default',
        'do',
        $._statement,
      )),
      'end'
    ),

    reset_statement: $ => seq(
      'reset',
      repeat($._statement),
      'every',
      $.expression,
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

    type_def: $ => seq(
      'type',
      $.identifier,
      '=',
      choice($.record_type_def, $.enum_type_def),
    ),

    record_type_def: $ => seq(
      '{',
      $.identifier,
      ':',
      $.lit_type,
      repeat(seq(';', $.identifier, ':', $.lit_type)),
      '}'
    ),

    enum_type_def: $=> seq(
      optional('|'),
      $.enum_identifier,
      repeat(seq(
        '|',
        $.enum_identifier,
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

    literal: $ => choice(
      $.l_number,
      $.l_bool,
      $.l_array,
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
      '=<.',
      '=<.',
      '=.',
      '<.',
      '>.',
      '=<',
      '>=',
      '=',
      '<',
      '>',
      'and',
      'or',
      '%',
      '^'
    ),

    identifier: $ => /[a-z][A-Za-z0-9_]*[']*/,

    enum_identifier: $ => /[A-Z][A-Za-z0-9_]*/,
  },

});
