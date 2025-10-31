/**
 * @file A Heptagon tree-sitter parser
 * @author jonas-rm
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

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
      $._function_def,
      $._type_def,
      // TODO: $._const_def,
    ),

    _function_def: $ => seq(
      choice("fun", "node"),
      $.identifier,
      optional(seq("<<", $.identifier, ":", $.lit_type, ">>")),
      $.parameter_list,
      "returns",
      $.parameter_list,
      optional($.local_vars),
      $.block,
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
      choice($.identifier, $.l_number),
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
        $.state_identifier,
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
      // $.merge_statement,
      $.reset_statement,
      // $.if_then_else_statement,
    ),

    equation_list: $ => prec.left(seq(
      $.equation,
      repeat(seq(
        ';',
        $.equation
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
      $.ifthenelse,
      $.sub_expression,
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
    ),

    tuple: $ => seq(
      '(',
      $.expression,
      repeat1(seq(',', $.expression)),
      ')',
    ),

    function_call: $ => prec.left(seq(
      $.identifier,
      '(',
      repeat(seq(
        $.expression,
        repeat(seq(
          ',',
          $.expression,
        )),
      )),
      ')'
    )),

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

    ifthenelse: $ => seq(
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
      $.state_identifier,
      optional($.local_vars),
      'do',
      repeat($._statement),
      repeat($.automaton_transition),
    ),

    automaton_transition: $ => seq(
      choice('unless', 'until'),
      $.expression,
      'then',
      $.state_identifier,
    ),

    _type_def: $ => seq(
      'type',
      $.identifier,
      '=',
      choice($._record_type_def, $._enum_type_def),
    ),

    _record_type_def: $ => seq(
      '{',
      $.identifier,
      ':',
      $.lit_type,
      repeat(seq(';', $.identifier, ':', $.lit_type)),
      '}'
    ),

    _enum_type_def: $=> seq(
      optional('|'),
      $.enum_identifier,
      repeat(seq(
        '|',
        $.enum_identifier,
      )),
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

    l_array: $ => seq(
      '[',
      optional(seq(
        $.expression,
        repeat(seq(',', $.expression)),
      )),
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

    identifier: $ => /[a-z][a-z0-9_]*[']*/,

    enum_identifier: $ => /[A-Z][A-Za-z0-9_]*/,

    state_identifier: $ => /[A-Za-z][A-Za-z0-9_]*/,
  },

});
