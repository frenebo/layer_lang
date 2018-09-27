import { ParseNode } from "./parser.js";
import { Token } from "./lexer.js";

export function tokensToNodes(tokens: Token[]): ParseNode[] {
  return tokens.map((tok) => {return {name: tok.name, definition: tok.text}});
}
