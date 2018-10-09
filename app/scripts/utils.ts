import { ParseNode } from "./parser.js";
import { Token, TokenName } from "./lexer.js";

export function tokensToNodes(tokens: Token[]): ParseNode[] {
  return tokens.map((tok) => {return {name: tok.name, definition: tok.text}});
}

type RuleObjType = { [key in TokenName]?: TokenName[][] };

function possibleLeftMostTokens(ruleObj: RuleObjType, ruleName: TokenName): Array<TokenName | undefined> {
  const definitions = ruleObj[ruleName];
  if (definitions === undefined) return [ruleName];

  const possibleLeftTokens: Array<TokenName | undefined> = [];
  for (const definition of definitions) {
    const leftRule: TokenName | undefined = definition[0];
    if (leftRule === undefined) {
      possibleLeftTokens.push(undefined);
    } else {
      possibleLeftTokens.push(...possibleLeftMostTokens(ruleObj, leftRule).filter((tok) => possibleLeftTokens.indexOf(tok) === -1));
    }
  }

  return possibleLeftTokens;
}

export function generateLeftMostTable(ruleObj: RuleObjType) {
  const leftMostTable: {[key in TokenName]?: Array<TokenName | undefined> } = {};

  for (const ruleName in ruleObj) {
    leftMostTable[ruleName as TokenName] = possibleLeftMostTokens(ruleObj, ruleName as TokenName);
  }

  return leftMostTable
}
