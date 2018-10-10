import { TokenName } from "./lexer.js";

export type ParseRule = {
  name: TokenName;
  definitions: TokenName[][];
}

//
// statement_sequence: [] or [statement, statement_sequence]
//

export const rules: {
  [key in TokenName]?: {[key: string]: TokenName[]}
} = {
  statement_sequence: {
    empty: [],
    with_statement: [TokenName.statement, TokenName.statement_sequence],
  },
  statement: {
    while: [TokenName.while_loop],
    if: [TokenName.if_block],
    for: [TokenName.for_block],
    expression: [TokenName.expression, TokenName.semicolon],
    assignment: [TokenName.assignment, TokenName.semicolon],
  },
  block: {
    default_block: [TokenName.open_brace, TokenName.statement_sequence, TokenName.close_brace],
  },
  expression: {
    atom_with_op_suffix: [TokenName.atom, TokenName.operator_suffix],
  },
  operator_suffix: {
    with_suff: [TokenName.operator, TokenName.expression],
    empty: [],
  },
  atom: {
    num: [TokenName.literal_number],
    true: [TokenName.keyword_true],
    false: [TokenName.keyword_false],
    neg_num: [TokenName.minus_sign, TokenName.literal_number],
    ident: [TokenName.identifier],
    arr: [TokenName.array],
    paren_expression: [TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis],
  },
  array: {
    default_array:[TokenName.open_bracket, TokenName.array_body, TokenName.close_bracket],
  },
  assignment: {
    default_assignment: [TokenName.identifier, TokenName.equals_sign, TokenName.expression]
  },
  while_loop: {
    default_while: [TokenName.keyword_while, TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis, TokenName.block],
  },
  if_block: {
    default_if: [TokenName.keyword_if, TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis, TokenName.block, TokenName.else_block],
  },
  for_block: {default_for: [
    TokenName.keyword_for,
    TokenName.open_parenthesis,
    TokenName.optional_expression, TokenName.semicolon,
    TokenName.optional_expression, TokenName.semicolon,
    TokenName.optional_expression, TokenName.close_parenthesis,
    TokenName.block,
  ]},
  optional_expression: {
    empty: [],
    exp: [TokenName.expression]
  },
  else_block: {
    with_else: [TokenName.keyword_else, TokenName.block],
    empty: [],
  },
  array_body: {
    empty: [],
    with_exp: [TokenName.expression, TokenName.optional_comma_and_array],
  },
  optional_comma_and_array: {
    empty: [],
    with_comma_and_array: [TokenName.comma, TokenName.array_body],
  },
  operator: {
    plus: [TokenName.plus_sign],
    minus: [TokenName.minus_sign],
    asterisk: [TokenName.asterisk],
    forward_slash: [TokenName.forward_slash],
    double_equal: [TokenName.double_equals],
    not_equal: [TokenName.not_equals],
    or: [TokenName.or_operator],
    and: [TokenName.and_operator],
    less_or_equal: [TokenName.less_than_or_equal_to_symbol],
    more_or_equal: [TokenName.more_than_or_equal_to_symbol],
    less_than: [TokenName.less_than_symbol],
    more_than: [TokenName.more_than_symbol],
  },
};
