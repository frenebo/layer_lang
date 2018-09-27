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
    [TokenName.literal_number],
    [TokenName.identifier],
    [TokenName.operator_expression],
    [TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis],
  ],
  [TokenName.assignment]: [[TokenName.identifier, TokenName.equals_sign, TokenName.expression]],
  [TokenName.while_loop]: [[TokenName.keyword_while, TokenName.open_parenthesis, TokenName.expression, TokenName.close_parenthesis, TokenName.block]],
  [TokenName.operator]: [[TokenName.plus_sign]],
};
