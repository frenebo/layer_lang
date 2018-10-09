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
  [TokenName.assignment]: [[TokenName.identifier, TokenName.equals_sign, TokenName.expression]],
  [TokenName.while_loop]: [[TokenName.keyword_while, TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis, TokenName.block]],
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
  ],
};
