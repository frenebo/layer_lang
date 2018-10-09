import { TokenName, removeWhitespace, Token } from "./lexer.js";
import { generateLeftMostTable } from "./utils.js";
import { rules } from "./rules.js";


export type ParseNode = {
  name: TokenName,
  definition: Array<ParseNode> | string,
  // startIdx: number,
  consumed: number,
};

type TentativeOption = {
  consumed: number,
  parsed: ParseNode[],
  parsing: TentativeParseNode | null | TokenName,
  toParse: TokenName[],
};
type TentativeParseNode = {
  name: TokenName,
  parent?: TentativeParseNode,
  currentOptionIdx: number,
  startIdx: number,
  options: Array<TentativeOption>;
};

export function parseProgram(tokens: Token[]) {
  const withoutWhitespace = removeWhitespace(tokens);
  const state: ParseState = {
    current: newTentativeParseNode(TokenName.statement_sequence),
    tokens: withoutWhitespace,
  };
  let done = false;
  while (!done) {
    done = parse(state);
  }
  return tentativeToParseNode(state.current);
}

function newTentativeParseNode(ruleName: TokenName, parent?: TentativeParseNode, parentOption?: TentativeOption) {
  const definitions = rules[ruleName];
  if (definitions === undefined) throw new Error("No definitions available");

  const tentativeNode: TentativeParseNode = {
    name: ruleName,
    parent,
    currentOptionIdx: 0,
    startIdx: parentOption === undefined ? 0 : parentOption.consumed + parent!.startIdx,
    options: [],
  };

  for (const definition of definitions) {
    tentativeNode.options.push({
      consumed: 0,
      parsed: [],
      parsing: null,
      toParse: definition.slice(),
    });
  }

  return tentativeNode;
}

/*
  parse node is full -> go to parent
  parse node is not full ->
    option is full -> go to next option
    option is not full ->
      currently parsing something -> make into a full node
      not currently parsing something -> make next toParse the currently parsing
*/

type ParseState = {
  current: TentativeParseNode;
  tokens: Token[],
};

function tentativeToParseNode(tentative: TentativeParseNode): ParseNode | null {
  let longestNode: ParseNode | null = null;
  let longestConsumed = 0;
  for (const option of tentative.options) {
    if (option.parsing !== null || option.toParse.length !== 0) {
      throw new Error("Can't convert incomplete node");
    }
    const newNode: ParseNode = {
      name: tentative.name,
      definition: option.parsed,
      consumed: option.consumed,
    };
    if (longestNode === null || option.consumed > longestConsumed) {
      longestNode = newNode;
      longestConsumed = option.consumed;
    }
  }

  return longestNode;
}

function parse(state: ParseState): boolean {
  if (state.current.currentOptionIdx >= state.current.options.length) {
    if (state.current.parent === undefined) {
      return true;
    } else {
      state.current = state.current.parent;
    }
  } else {
    const option = state.current.options[state.current.currentOptionIdx];

    if (option.parsing !== null) {
      if (typeof option.parsing === "object") {
        const getParseNode = tentativeToParseNode(option.parsing);
        if (getParseNode === null) {
          state.current.options.splice(state.current.currentOptionIdx, 1);
        } else {
          option.parsed.push(getParseNode);
          option.consumed += getParseNode.consumed;
          option.parsing = null;
        }
      } else {
        const nextToken: Token | undefined = state.tokens[state.current.startIdx + option.consumed];
        if (nextToken === undefined || nextToken.name !== option.parsing) {
          state.current.options.splice(state.current.currentOptionIdx, 1);
        } else {
          option.parsed.push({
            name: option.parsing,
            definition: nextToken.text,
            consumed: 1,
          });
          option.consumed += 1;
          option.parsing = null;
        }
      }
    } else {
      const nextToParse = option.toParse.shift()
      if (nextToParse !== undefined) {
        if (rules[nextToParse] === undefined) {
          option.parsing = nextToParse;
        } else {
          option.parsing = newTentativeParseNode(nextToParse, state.current, option);
          state.current = option.parsing;
        }
      } else {
        state.current.currentOptionIdx++;
      }
    }
  }

  return false;
}
