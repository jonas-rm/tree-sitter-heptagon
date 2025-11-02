; highlights.scm

[
  "fun"
  "node"
  "returns"
  "var"
  "let"
  "tel"
  "if"
  "then"
  "else"
  "automaton"
  "state"
  "do"
  "end"
  "until"
  "unless"
  "type"
  "switch"
  "reset"
  "every"
  "default"
  "with"
] @keyword

[
  "->"
  "fby"
  "pre"
  "last"
] @operator

(lit_type) @type

(comment) @comment

(l_number) @number

(l_bool) @constant

[
  "map"
  "fold"
  "mapfold"
] @function.builtin

(function_def
  name: (identifier) @function)

(function_call
  name: (identifier) @function)

(enum_identifier) @constructor