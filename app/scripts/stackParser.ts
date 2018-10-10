import { TokenName, removeWhitespace, Token } from "./lexer.js";
import { rules } from "./rules.js";

export type ParseNode = {
  name: TokenName,
  contents: Array<ParseNode> | string,
  definition_name: string | null,
  consumed: number,
};

type TentativeOption = {
  definition_name: string,
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
  // may not use all tokens! @WARNING @TODO fix
  const parseNode = tentativeToParseNode(state.current);

  if (parseNode === null) throw new Error("Could not parse anything");

  if (parseNode.consumed < withoutWhitespace.length) throw new Error("Couldn't parse all tokens");

  return parseNode;
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

  for (const definitionName in definitions) {
    tentativeNode.options.push({
      definition_name: definitionName,
      consumed: 0,
      parsed: [],
      parsing: null,
      toParse: definitions[definitionName].slice(),
    });
  }

  return tentativeNode;
}

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
      definition_name: option.definition_name,
      name: tentative.name,
      contents: option.parsed,
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
  console.log(state.current.name);
  if (state.current.currentOptionIdx >= state.current.options.length) {
    if (state.current.parent === undefined) {
      return true;
    } else {
      state.current = state.current.parent;
    }
  } else {
    const currentOption = state.current.options[state.current.currentOptionIdx];

    if (currentOption.parsing !== null) {
      if (typeof currentOption.parsing === "object") {
        const getParseNode = tentativeToParseNode(currentOption.parsing);
        if (getParseNode === null) {
          state.current.options.splice(state.current.currentOptionIdx, 1);
        } else {
          currentOption.parsed.push(getParseNode);
          currentOption.consumed += getParseNode.consumed;
          currentOption.parsing = null;
        }
      } else {
        const nextToken: Token | undefined = state.tokens[state.current.startIdx + currentOption.consumed];
        if (nextToken === undefined || nextToken.name !== currentOption.parsing) {
          state.current.options.splice(state.current.currentOptionIdx, 1);
        } else {
          currentOption.parsed.push({
            definition_name: null,
            name: currentOption.parsing,
            contents: nextToken.text,
            consumed: 1,
          });
          currentOption.consumed += 1;
          currentOption.parsing = null;
        }
      }
    } else {
      const nextToParse = currentOption.toParse.shift()
      if (nextToParse !== undefined) {
        if (rules[nextToParse] === undefined) {
          currentOption.parsing = nextToParse;
        } else {
          currentOption.parsing = newTentativeParseNode(nextToParse, state.current, currentOption);
          state.current = currentOption.parsing;
        }
      } else {
        state.current.currentOptionIdx++;
      }
    }
  }

  return false;
}
