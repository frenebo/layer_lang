import { TokenName, Token, removeWhitespace } from "./lexer.js";
import { rules, ParseRule } from "./rules.js";
import { tokensToNodes } from "./utils.js";


export type ParseNode = {
  name: TokenName,
  definition: Array<ParseNode> | string,
}



export function parseProgram(tokens: Token[]) {
  const withoutWhitespace = removeWhitespace(tokens);
  const results = parse(tokensToNodes(withoutWhitespace), 0, TokenName.statement_sequence);
  if (results === null) throw new Error("Could not parse");
  else if (results.consumed < withoutWhitespace.length) {
    throw new Error(`Could not parse last ${withoutWhitespace.length - results.consumed} tokens:`);
  }

  return results;
}


type parseResults = {consumed: number, node: ParseNode };

export function parse(tokens: ReadonlyArray<ParseNode>, startidx: number, targetName: TokenName,
): parseResults | null {
  if (tokens.length - startidx > 0 && tokens[startidx].name == targetName) return { consumed: 1, node: tokens[startidx] };

  const targetDefinitions = rules[targetName];
  if (targetDefinitions === undefined) return null;

  let longestRuleMatch: parseResults | null = null;
  ruleLoop:
  for (const definition of targetDefinitions) {
    let definitionChildren: ParseNode[] = [];
    let consumed = 0;

    for (const defName of definition) {
      // if (tokens.length === startidx + consumed) continue ruleLoop;

      const match = parse(tokens, consumed + startidx, defName);
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
