
export enum TokenName {
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
  keyword_if = "keyword_if",
  double_equals = "double_equals",
  not_equals = "not_equals",
  or_operator = "or_operator",
  and_operator = "and_operator",
  else_block = "else_block",
  keyword_else = "keyword_else",
  less_than_or_equal_to_symbol = "less_than_or_equal_to_symbol",
  more_than_or_equal_to_symbol = "more_than_or_equal_to_symbol",
  less_than_symbol = "less_than_symbol",
  more_than_symbol = "more_than_symbol",
  // plus_equals = "plus_equals",
  // minus_equals = "minus_equals",
  // times_equals = "times_equals",
  // divide_equals = "divide_equals",
  assign_symbol = "assign_symbol",
  optional_expression = "optional_expression",
  keyword_for = "keyword_for",
  for_block = "for_block",
  array_body = "array_body",
  comma = "comma",
  optional_comma_and_array = "optional_comma_and_array",
  array = "array",
  close_bracket = "close_bracket",
  open_bracket = "open_bracket",
  keyword_false = "keyword_false",
  keyword_true = "keyword_true",
  literal_string = "literal_string"
};

const wordCheckRegexes: Array<[TokenName, RegExp]>= [
  [TokenName.keyword_while, /^while/],
  [TokenName.keyword_of, /^of/],
  [TokenName.keyword_if, /^if/],
  [TokenName.keyword_else, /^else/],
  [TokenName.keyword_for, /^for/],
  [TokenName.keyword_true, /^true/],
  [TokenName.keyword_false, /^false/],
  [TokenName.equals_sign, /^\=/],
  [TokenName.semicolon, /^\;/],
  [TokenName.open_parenthesis, /^\(/],
  [TokenName.close_parenthesis, /^\)/],
  [TokenName.whitespace, /^[ \t\n]+/],
  [TokenName.open_brace, /^\{/],
  [TokenName.close_brace, /^\}/],
  [TokenName.open_bracket, /^\[/],
  [TokenName.close_bracket, /^\]/],
  [TokenName.plus_sign, /^\+/],
  [TokenName.minus_sign, /^\-/],
  [TokenName.forward_slash, /^\//],
  [TokenName.asterisk, /^\*/],
  [TokenName.comma, /^\,/],
  [TokenName.double_equals, /^\=\=/],
  [TokenName.more_than_symbol, /^\>/],
  [TokenName.less_than_symbol, /^\</],
  [TokenName.more_than_or_equal_to_symbol, /^\>\=/],
  [TokenName.less_than_or_equal_to_symbol, /^\<=/],
  // [TokenName.plus_equals, /^\+\=/],
  // [TokenName.minus_equals, /^\-\=/],
  // [TokenName.times_equals, /^\*\=/],
  // [TokenName.divide_equals, /^\/\=/],
  [TokenName.not_equals, /^\!\=/],
  [TokenName.or_operator, /^\|\|/],
  [TokenName.and_operator, /^\&\&/],
  [TokenName.identifier, /^[a-zA-Z_][a-zA-Z0-9_]*/],
  [TokenName.literal_number, /^[0-9]*\.?[0-9]+/],
  [TokenName.literal_string, /^\"(\\.|[^"\\])*\"/],
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
