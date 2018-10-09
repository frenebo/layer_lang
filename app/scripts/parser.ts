import { TokenName, Token, removeWhitespace } from "./lexer.js";
import { rules, ParseRule } from "./rules.js";
import { tokensToNodes, generateLeftMostTable } from "./utils.js";


export type ParseNode = {
  name: TokenName,
  definition: Array<ParseNode> | string,
}



export function parseProgram(tokens: Token[]) {
  const withoutWhitespace = removeWhitespace(tokens);
  const results = parse(generateLeftMostTable(rules), tokensToNodes(withoutWhitespace), 0, TokenName.statement_sequence);
  if (results === null) throw new Error("Could not parse");
  else if (results.consumed < withoutWhitespace.length) {
    throw new Error(`Could not parse last ${withoutWhitespace.length - results.consumed} tokens:`);
  }

  return results;
}


type parseResults = {consumed: number, node: ParseNode };

export function parse(leftMostTable: ReturnType<typeof generateLeftMostTable>,
  tokens: ReadonlyArray<ParseNode>, startidx: number, targetName: TokenName, indents=0,
): parseResults | null {
  if (tokens.length - startidx > 0 && tokens[startidx].name == targetName) return { consumed: 1, node: tokens[startidx] };

  const targetDefinitions = rules[targetName];
  if (targetDefinitions === undefined) return null;

  // if (leftMostTable[targetName]!.indexOf(undefined) === -1) {
  //   const nextNode: ParseNode | undefined = tokens[startidx];
  //   const nextTokenName: TokenName | undefined = nextNode === undefined ? undefined : nextNode.name;
  //
  //   if (leftMostTable[targetName]!.indexOf(nextTokenName) === -1) return null;
  // }

  let longestRuleMatch: parseResults | null = null;
  ruleLoop:
  for (const definition of targetDefinitions) {
    let definitionChildren: ParseNode[] = [];
    let consumed = 0;

    for (const defName of definition) {
      // if (tokens.length === startidx + consumed) continue ruleLoop;

      const match = parse(leftMostTable, tokens, consumed + startidx, defName, indents + 1);
      if (match === null) {
        continue ruleLoop;
      } else {
        consumed += match.consumed;
        definitionChildren.push(match.node);
      }
    }

    if (longestRuleMatch === null || (consumed > longestRuleMatch.consumed)) {
      longestRuleMatch = { consumed, node: {name: targetName, definition: definitionChildren }};
    }
  }

  return longestRuleMatch;
}
