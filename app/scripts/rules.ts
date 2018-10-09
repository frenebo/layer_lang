import { TokenName } from "./lexer.js";

export type ParseRule = {
  name: TokenName;
  definitions: TokenName[][];
}

//
// statement_sequence: [] or [statement, statement_sequence]
//

export const rules: { [key in TokenName]?: TokenName[][]} = {
  [TokenName.statement_sequence]: [
    [],
    [TokenName.statement, TokenName.statement_sequence],
  ],
  [TokenName.statement]: [
    [TokenName.while_loop],
    [TokenName.if_block],
    [TokenName.for_block],
    [TokenName.expression, TokenName.semicolon],
  ],
  [TokenName.block]: [[TokenName.open_brace, TokenName.statement_sequence, TokenName.close_brace]],
  [TokenName.expression]: [
    [TokenName.assignment],
    [TokenName.operator_expression],
    [TokenName.atom, TokenName.operator_suffix],
  ],
  [TokenName.atom]: [
    [TokenName.literal_number],
    [TokenName.minus_sign, TokenName.literal_number],
    [TokenName.identifier],
    [TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis],
  ],
  [TokenName.assignment]: [[TokenName.identifier, TokenName.assign_symbol, TokenName.expression]],
  [TokenName.assign_symbol]: [
    [TokenName.plus_equals],
    [TokenName.minus_equals],
    [TokenName.times_equals],
    [TokenName.divide_equals],
    [TokenName.equals_sign],
  ],
  [TokenName.while_loop]: [[TokenName.keyword_while, TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis, TokenName.block]],
  [TokenName.if_block]: [[TokenName.keyword_if, TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis, TokenName.block, TokenName.else_block]],
  [TokenName.for_block]: [[
    TokenName.keyword_for, TokenName.open_parenthesis,
    TokenName.optional_expression, TokenName.semicolon,
    TokenName.optional_expression, TokenName.semicolon,
    TokenName.optional_expression, TokenName.close_parenthesis,
    TokenName.block,
  ]],
  [TokenName.optional_expression]: [
    [],
    [TokenName.expression]
  ],
  [TokenName.else_block]: [
    [TokenName.keyword_else, TokenName.block],
    [],
  ],
  // order of operations
  [TokenName.operator_suffix]: [
    [TokenName.operator, TokenName.expression],
    [],
  ],
  [TokenName.operator]: [
    [TokenName.plus_sign],
    [TokenName.minus_sign],
    [TokenName.asterisk],
    [TokenName.forward_slash],
    [TokenName.double_equals],
    [TokenName.not_equals],
    [TokenName.or_operator],
    [TokenName.and_operator],
    [TokenName.less_than_or_equal_to_symbol],
    [TokenName.more_than_or_equal_to_symbol],
    [TokenName.less_than_symbol],
    [TokenName.more_than_symbol],
  ],
};
