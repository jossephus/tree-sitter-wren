; Scopes
(block) @local.scope
(method_body) @local.scope
(closure) @local.scope

; Definitions
(class_definition
  name: (identifier) @local.definition)

(constructor_definition
  name: (identifier) @local.definition)

(named_method
  name: (identifier) @local.definition)

(getter_definition
  name: (identifier) @local.definition)

(setter_definition
  name: (identifier) @local.definition)

(foreign_named_method
  name: (identifier) @local.definition)

(foreign_getter
  name: (identifier) @local.definition)

(var_statement
  name: (identifier) @local.definition)

(parameter_list
  (identifier) @local.definition)

(closure_parameter_list
  (identifier) @local.definition)

(subscript_parameter_list
  (identifier) @local.definition)

(import_variable
  name: (identifier) @local.definition)

(import_variable
  alias: (identifier) @local.definition)

; References
(identifier) @local.reference
