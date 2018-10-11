import { ParseNode } from "./stackParser.js";
import { TokenName } from "./lexer.js";

export function executeProgram(statement_sequence: ParseNode) {
  if (statement_sequence.name !== TokenName.statement_sequence) {
    throw new Error("Can't parse program, parse node has incorrect name " + statement_sequence.name);
  }
  const scope = defaultScope();
  executeStatementSequence(statement_sequence, scope);
  console.log(scope);
}

function defaultScope(): Scope {
  return {
    parent_scope: null,
    values: {},
  };
}

type ExpressionValue =
  {type: "string", value: string} |
  {type: "number", value: number} |
  {type: "bool", value: boolean} |
  {type: "array", value: ExpressionValue[]};


type Scope = {
  parent_scope: Scope | null;
  values: {
    [key: string]: ExpressionValue,
  }
};

function executeStatementSequence(statement_sequence: ParseNode, scope: Scope) {
  const statements: ParseNode[] = [];
  let current_seq: ParseNode | null = statement_sequence;
  while (current_seq !== null) {
    if (current_seq.definition_name === "empty") {
      current_seq = null;
    } else if (current_seq.definition_name === "with_statement") {
      statements.push(current_seq.contents[0] as ParseNode);
      current_seq = current_seq.contents[1] as ParseNode;
    } else {
      throw new Error("Unsupported type");
    }
  }

  for (const statement of statements) {
    executeStatement(statement, scope);
  }
}

function executeStatement(statement: ParseNode, scope: Scope) {
  if (statement.definition_name ===  "while") {
    executeWhileLoop(statement.contents[0] as ParseNode, scope);
  } else if (statement.definition_name ===  "if") {
    executeIf(statement.contents[0] as ParseNode, scope);
  } else if (statement.definition_name ===  "for") {
    executeForLoop(statement.contents[0] as ParseNode, scope);
  } else if (statement.definition_name ===  "expression") {
    executeExpression(statement.contents[0] as ParseNode, scope);
  } else if (statement.definition_name === "assignment") {
    executeAssignment(statement.contents[0] as ParseNode, scope);
  } else {
    throw new Error("Unsupported definition type");
  }
}

function executeBlock(block: ParseNode, parent_scope: Scope) {
  const scope: Scope = {
    parent_scope,
    values: {},
  };

  const statement_sequence = block.contents[1] as ParseNode;
  executeStatementSequence(statement_sequence, scope);
}

function executeWhileLoop(loop: ParseNode, scope: Scope) {
  const condition_expression = loop.contents[2] as ParseNode;

  const block = loop.contents[4] as ParseNode;

  while (isTruth(executeExpression(condition_expression, scope))) {
    executeBlock(block, scope);
  }
}

function executeIf(ifNode: ParseNode, scope: Scope) {
  const conditionTrue: boolean = isTruth(executeExpression(ifNode.contents[2] as ParseNode, scope));

  if (conditionTrue) {
    executeBlock(ifNode.contents[4] as ParseNode, scope);
  } else {
    const elseBlock = ifNode.contents[5] as ParseNode;
    if (elseBlock.definition_name === "with_else") {
      executeBlock(elseBlock.contents[0] as ParseNode, scope);
    }
  }
}

function executeForLoop(forNode: ParseNode, parent_scope: Scope) {
  const optional_init_exp = forNode.contents[2] as ParseNode;
  const optional_condition_exp = forNode.contents[4] as ParseNode;
  const optional_increment = forNode.contents[6] as ParseNode;
  const if_block = forNode.contents[8] as ParseNode;

  const scope: Scope = {
    parent_scope,
    values: {},
  };

  if (optional_init_exp.definition_name === "exp") {
    executeStatement(optional_init_exp.contents[0] as ParseNode, scope);
  }

  let continuing = true;

  function shouldContinue(): boolean {
    if (optional_condition_exp.definition_name === "empty") return true;

    const executeExp = executeExpression(optional_condition_exp.contents[0] as ParseNode, scope);

    return isTruth(executeExp);
  }

  while (continuing = shouldContinue()) {
    executeBlock(if_block as ParseNode, scope);
    if (optional_increment.definition_name === "exp") {
      executeExpression(optional_increment.contents[0] as ParseNode, scope);
    }
  }
}

function assignInScope(name: string, expVal: ExpressionValue, scope: Scope) {
  let searchScope: Scope | null = scope;
  while (searchScope !== null) {
    if (searchScope.values[name] === undefined) {
      searchScope = searchScope.parent_scope;
    } else {
      searchScope.values[name] = expVal;
      return;
    }
  }

  // this is a new value name
  scope.values[name] = expVal;
}

function executeAssignment(assignment: ParseNode, scope: Scope) {
  const identifier_string = (assignment.contents[0] as ParseNode).contents as string;
  const exp_node = assignment.contents[2] as ParseNode;

  assignInScope(identifier_string, executeExpression(exp_node, scope), scope);
}

function executeExpression(expression: ParseNode, scope: Scope): ExpressionValue {
  const expressions: ExpressionValue[] = [evaluateAtom(expression.contents[0] as ParseNode, scope)];
  const operators: ParseNode[] = [];

  let op_suffix = expression.contents[1] as ParseNode;
  while (op_suffix.definition_name === "with_stuff") {
    const operator = op_suffix.contents[0] as ParseNode;
    const expression = op_suffix.contents[1] as ParseNode;
    const atom = evaluateAtom(expression.contents[0] as ParseNode, scope);
    expressions.push(atom);
    operators.push(operator);
    op_suffix = expression.contents[1] as ParseNode;
  }

  const orderOfOperations: string[][] = [
    ["asterisk", "forward_slash"],
    ["plus", "minus"],
    ["less_or_equal", "more_or_equal", "less_than", "more_than"],
    ["double_equal", "not_equal"],
    ["and"],
    ["or"],
  ];

  for (const opNames of orderOfOperations) {
    for (let i = 0; i < operators.length; i++) {
      if (opNames.indexOf(operators[i].definition_name!) !== -1) {
        const [exp1, exp2] = expressions.splice(i, 2);
        const operator = operators.splice(i, 1)[0];

        const newAtom = calculateOperation(exp1, operator.definition_name!, exp2);
        expressions.splice(i, 0, newAtom);
      }
    }
  }

  if (expressions.length !== 1) throw new Error("Something went wrong");

  return expressions[0];
}

function calculateOperation(input_exp1: ExpressionValue, op_name: string, input_exp2: ExpressionValue) {
  function asterisk(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot multiply non-numbers");

    return {type: "number", value: exp1.value*exp2.value};
  }

  function forward_slash(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot multiply non-numbers");

    return {type: "number", value: exp1.value/exp2.value};
  }

  function plus(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type === "number" && exp2.type === "number") {
      return {type: "number", value: exp1.value + exp2.value};
    } else if (
      (exp1.type === "number" && exp2.type === "string") ||
      (exp1.type === "string" && exp2.type === "number") ||
      (exp1.type === "string" && exp2.type === "string")
    ) {
      return {type: "string", value: exp1.value as string + exp2.value as string};
    } else {
      throw new Error(`Cannot add values of types ${exp1.type} and ${exp2.type}`);
    }
  }

  function minus(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot subtract non-numbers");

    return {type: "number", value: exp1.value - exp2.value};
  }

  function less_or_equal(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value <= exp2.value};
  }

  function more_or_equal(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value >= exp2.value};
  }

  function less_than(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value < exp2.value};
  }

  function more_than(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value > exp2.value};
  }

  function double_equal(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (
      (exp1.type !== "number" && exp1.type !== "string" && exp1.type !== "bool") ||
      (exp2.type !== "number" && exp2.type !== "string" && exp2.type !== "bool")
    ) {
      throw new Error("Unsupported equality comparison");
    } else {
      return {type: "bool", value: exp1.value === exp2.value};
    }
  }

  function not_equal(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    return {type: "bool", value: !double_equal(exp1, exp2) };
  }

  function and(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "bool" || exp2.type !== "bool") throw new Error("Cannot apply 'and' operation on non-bool");

    return {type: "bool", value: exp1.value && exp2.value};
  }

  function or(exp1: ExpressionValue, exp2: ExpressionValue): ExpressionValue {
    if (exp1.type !== "bool" || exp2.type !== "bool") throw new Error("Cannot apply 'and' operation on non-bool");

    return {type: "bool", value: exp1.value || exp2.value};
  }

  const ops: {[key: string]: (a1: ExpressionValue, a2: ExpressionValue) => ExpressionValue} = {
    asterisk,
    forward_slash,
    plus,
    minus,
    less_or_equal,
    more_or_equal,
    less_than,
    more_than,
    double_equal,
    not_equal,
    and,
    or,
  };

  const get_func = ops[op_name];
  if (get_func === undefined) throw new Error(`Unimplemented operation ${op_name}`);

  return get_func(input_exp1, input_exp2);
}

function getValueFromScope(name: string, scope: Scope): ExpressionValue {
  let searchScope: Scope | null = scope;
  while (searchScope !== null) {
    if (searchScope.values[name] !== undefined) {
      return searchScope.values[name];
    }
    searchScope = searchScope.parent_scope;
  }
  throw new Error("Couldn't find identifier in scope");
}

function evaluateAtom(atom: ParseNode, scope: Scope): ExpressionValue {
  if (atom.definition_name ===  "num") {
    return {
      type: "number",
      value: parseFloat((atom.contents[0] as ParseNode).contents as string)};
  } else if (atom.definition_name ===  "true") {
    return {type: "bool", value: true};
  } else if (atom.definition_name === "false") {
    return {type: "bool", value: false};
  } else if (atom.definition_name ===  "neg_num") {
    return {
      type: "number",
      value: parseFloat("-" + (atom.contents[1] as ParseNode).contents as string),
    }
  } else if (atom.definition_name ===  "ident") {
    return getValueFromScope((atom.contents[0] as ParseNode).contents as string, scope);
  } else if (atom.definition_name ===  "arr") {
    return evaluateArray(atom.contents[0] as ParseNode, scope);
  } else if (atom.definition_name ===  "paren_expression") {
    return evaluateAtom(atom.contents[1] as ParseNode, scope);
  } else if (atom.definition_name === "string") {
    const stringWithQuotes = (atom.contents[0] as ParseNode).contents as string;
    return {
      type: "string",
      value: stringWithQuotes.substring(1, stringWithQuotes.length - 1) as string,
    };
  } else {
    throw new Error("Unimplemented");
  }
}

function evaluateArray(arrayNode: ParseNode, scope: Scope): ExpressionValue {
  const values: ExpressionValue[] = [];
  let currentArrayBody = arrayNode.contents[1] as ParseNode;

  while (currentArrayBody.definition_name === "with_exp") {
    values.push(executeExpression(currentArrayBody.contents[0] as ParseNode, scope));

    const optionalCommaAndArray = currentArrayBody.contents[1] as ParseNode;
    if (optionalCommaAndArray.definition_name === "with_comma_and_array") {
      currentArrayBody = optionalCommaAndArray.contents[1] as ParseNode;
    } else {
      break;
    }
  }

  return {type: "array", value: values};
}

function isTruth(expressionValue: ExpressionValue): boolean {
  if (expressionValue.type !== "bool") throw new Error("Cannot use a non-boolean value as truth or false");

  return expressionValue.value;
}
