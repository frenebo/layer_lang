
export enum TokenName {
  keyword_assign = "keyword_assign",
  identifier = "identifier",
  literal_number = "literal_number",
  whitespace = "whitespace",
  keyword_of = "keyword_of",
  equals_sign = "equals_sign",
  semicolon = "semicolon",
  open_brace = "open_brace",
  close_brace = "close_brace",
  statement_sequence = "statement_sequence",
  statement = "statement",
  expression = "expression",
  atom = "atom",
  assignment = "assignment",
  block = "block",
  keyword_while = "keyword_while",
  while_loop = "while_loop",
  close_parenthesis = "close_parenthesis",
  open_parenthesis = "open_parenthesis",
  operator_expression = "operator_expression",
  plus_sign = "plus_sign",
  minus_sign = "minus_sign",
  forward_slash = "forward_slash",
  asterisk = "asterisk",
  operator_suffix = "operator_suffix",
  operator = "operator",
  if_block = "if_block",
  keyword_if = "keyword_if"
};

const wordCheckRegexes: Array<[TokenName, RegExp]>= [
  [TokenName.keyword_assign, /^assign/],
  [TokenName.keyword_while, /^while/],
  [TokenName.keyword_of, /^of/],
  [TokenName.keyword_if, /^if/],
  [TokenName.equals_sign, /^\=/],
  [TokenName.semicolon, /^\;/],
  [TokenName.open_parenthesis, /^\(/],
  [TokenName.close_parenthesis, /^\)/],
  [TokenName.whitespace, /^[ \t\n]+/],
  [TokenName.open_brace, /^\{/],
  [TokenName.close_brace, /^\}/],
  [TokenName.plus_sign, /^\+/],
  [TokenName.minus_sign, /^\-/],
  [TokenName.forward_slash, /^\//],
  [TokenName.asterisk, /^\*/],
  [TokenName.identifier, /^[a-zA-Z_][a-zA-Z0-9_]*/],
  [TokenName.literal_number, /^[0-9]*\.?[0-9]+/],
];

export type Token = {
  name: TokenName,
  text: string,
}

export function removeWhitespace(withWhitespace: Token[]): Token[] {
  return withWhitespace.filter((tok) => tok.name !== TokenName.whitespace);
}

export function lex(text: string): Token[] {
  const tokens: Token[] = [];
  let remainingText = text;
  while (remainingText.length !== 0) {
    let match: null | Token = null;
    for (const [name, regex] of wordCheckRegexes) {
      const exec = regex.exec(remainingText);
      // If exec finds a mtch:
      //   - if match is still null, set match to exec's value.
      //   - if match is not null, only overwrite match if exec finds a match longer than the old match.
      //     If they are the same length, do not overwrite.
      if (exec !== null && (match === null || exec[0].length > match.text.length)) {
        match = {name, text: exec[0]};
      }
    }

    if (match === null) throw new Error("Could not lex");
    else {
      tokens.push(match);
      remainingText = remainingText.slice(match.text.length);
    }
  }

  return tokens
}

// function lexWord(text: string): WordName | null {
//   const matches: WordName[] = [];
//   for (const wordName in wordCheckRegexes) {
//     const match = wordCheckRegexes[wordName as WordName]!.exec(text);
//   }
//
//   if (matches.length === 0) return null;
//   if (matches.length === 1) return matches[0];
//   else throw new Error("Multiple matches");
// }
