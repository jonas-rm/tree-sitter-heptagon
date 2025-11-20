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
  "present"
  "reset"
  "every"
  "default"
  "with"
  "const"
  "open"
  "merge"
] @keyword

[
  "->"
  "fby"
  "pre"
  "last"
  "or"
  "and"
  "not"
  "xor"
] @operator

(lit_type) @type

(comment) @comment

(l_number) @number

(l_bool) @constant

(l_string) @string

[
  "map"
  "fold"
  "mapfold"
] @function.builtin

(function_def
  name: (identifier) @function)

(function_call
  name: (identifier) @function)

(module_prefix
  module_name: (enum_identifier) @module)

(module_call
  module_name: (enum_identifier) @module)

(enum_identifier) @constructor
