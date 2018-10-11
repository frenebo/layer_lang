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
    evaluateExpression(statement.contents[0] as ParseNode, scope);
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

  while (isTruth(evaluateExpression(condition_expression, scope))) {
    executeBlock(block, scope);
  }
}

function executeIf(ifNode: ParseNode, scope: Scope) {
  const conditionTrue: boolean = isTruth(evaluateExpression(ifNode.contents[2] as ParseNode, scope));

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
    evaluateExpression(optional_init_exp.contents[0] as ParseNode, scope);
  }

  let continuing = true;

  function shouldContinue(): boolean {
    if (optional_condition_exp.definition_name === "empty") return true;

    const executeExp = evaluateExpression(optional_condition_exp.contents[0] as ParseNode, scope);

    return isTruth(executeExp);
  }

  while (continuing = shouldContinue()) {
    executeBlock(if_block as ParseNode, scope);
    if (optional_increment.definition_name === "exp") {
      evaluateExpression(optional_increment.contents[0] as ParseNode, scope);
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

  assignInScope(identifier_string, evaluateExpression(exp_node, scope), scope);

  return evalutateIdentifier(assignment.contents[0] as ParseNode, scope);
}

function evalutateIdentifier(identifier: ParseNode, scope: Scope): ExpressionValue {
  return getValueFromScope(identifier.contents as string, scope);
}

function evaluateExpression(expression: ParseNode, scope: Scope): ExpressionValue {
  if (expression.definition_name === "assignment") {
    return executeAssignment(expression.contents[0] as ParseNode, scope);
  } else if (expression.definition_name === "atom_with_op_suffix") {
    return evaluateAtomWithSuffixExpression(expression, scope);
  } else {
    throw new Error("Unsupported expression type");
  }
}

function evaluateAtomWithSuffixExpression(expression: ParseNode, scope: Scope): ExpressionValue {
  if (expression.definition_name !== "atom_with_op_suffix") throw new Error("Wrong function called");
  const operands: Array<ParseNode | ExpressionValue> = [expression.contents[0] as ParseNode];
  const operator_suffixes: ParseNode[] = [];
  let optional_suffix = expression.contents[1] as ParseNode;

  while (optional_suffix.definition_name !== "empty") {
    const operand_exp = optional_suffix.contents[1] as ParseNode;
    operator_suffixes.push(optional_suffix);
    operands.push(operand_exp.contents[0] as ParseNode);
    optional_suffix = operand_exp.contents[1] as ParseNode;
  }

  const orderOfOperations: string[][] = [
    ["func_call_op", "index_op"],
    ["asterisk", "forward_slash"],
    ["plus", "minus"],
    ["less_or_equal", "more_or_equal", "less_than", "more_than"],
    ["double_equal", "not_equal"],
    ["and"],
    ["or"],
  ];

  for (const opNames of orderOfOperations) {
    for (let i = 0; i < operator_suffixes.length; i++) {
      if (opNames.indexOf(operator_suffixes[i].definition_name!) !== -1) {
        const operator_suffix = operator_suffixes.splice(i, 1)[0];
        const [operand, operator_arg] = operands.splice(i, 2);
        const newVal = calculateOperation(operand, operator_suffix.definition_name!, operator_arg, scope);
        operands.splice(i, 0, newVal);
        // const operator_arg = operands[]
      }
    }
    for (const opName of opNames) {

    }
  }

  // for (const opNames of orderOfOperations) {
  //   for (let i = 0; i < operators.length; i++) {
  //     if (opNames.indexOf(operators[i].definition_name!) !== -1) {
  //       const [exp_node1, exp_node2] = operand_nodes.splice(i, 2);
  //       const operator = operators.splice(i, 1)[0];
  //
  //       const newAtom = calculateOperation(exp_node1, operator.definition_name!, exp_node2);
  //       operand_nodes.splice(i, 0, newAtom);
  //     }
  //   }
  // }

  if (operands.length !== 1) throw new Error("Something went wrong");
  if (typeof (operands[0] as ExpressionValue).type !== "string") {
    operands[0] = evaluateAtom(operands[0] as ParseNode, scope);
  }

  return (operands as ExpressionValue[])[0];
}

function calculateOperation(input_arg1: ExpressionValue | ParseNode, op_name: string, input_arg2: ExpressionValue | ParseNode, scope: Scope) {
  function isExpressionVal(v: ExpressionValue | ParseNode): v is ExpressionValue {
    return typeof (v as ExpressionValue).type === "string";
  }

  type opFunc = (i1: ExpressionValue | ParseNode, i2: ExpressionValue | ParseNode) => ExpressionValue;

  const index_op: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "array" || exp2.type !== "number") throw new Error("Cannot multiply non-numbers");

    return exp1.value[exp2.value];

  }
  const asterisk: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot multiply non-numbers");

    return {type: "number", value: exp1.value*exp2.value};
  }

  const forward_slash: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot multiply non-numbers");

    return {type: "number", value: exp1.value/exp2.value};
  }

  const plus: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
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

  const minus: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot subtract non-numbers");

    return {type: "number", value: exp1.value - exp2.value};
  }

  const less_or_equal: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value <= exp2.value};
  }

  const more_or_equal: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value >= exp2.value};
  }

  const less_than: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value < exp2.value};
  }

  const more_than: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "number" || exp2.type !== "number") throw new Error("Cannot compare non-number");

    return {type: "bool", value: exp1.value > exp2.value};
  }

  const double_equal: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (
      (exp1.type !== "number" && exp1.type !== "string" && exp1.type !== "bool") ||
      (exp2.type !== "number" && exp2.type !== "string" && exp2.type !== "bool")
    ) {
      throw new Error("Unsupported equality comparison");
    } else {
      return {type: "bool", value: exp1.value === exp2.value};
    }
  }

  const not_equal: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    return {type: "bool", value: !double_equal(exp1, exp2) };
  }

  const and: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "bool" || exp2.type !== "bool") throw new Error("Cannot apply 'and' operation on non-bool");

    return {type: "bool", value: exp1.value && exp2.value};
  }

  const or: opFunc = (input1, input2): ExpressionValue => {
    const exp1 = isExpressionVal(input1) ? input1 : evaluateAtom(input1, scope);
    const exp2 = isExpressionVal(input2) ? input2 : evaluateAtom(input2, scope);
    if (exp1.type !== "bool" || exp2.type !== "bool") throw new Error("Cannot apply 'and' operation on non-bool");

    return {type: "bool", value: exp1.value || exp2.value};
  }

  const ops: {[key: string]: (a1: ExpressionValue | ParseNode, a2: ExpressionValue | ParseNode) => ExpressionValue} = {
    index_op,
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

  return get_func(input_arg1, input_arg2);
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
    return evalutateIdentifier(atom.contents[0] as ParseNode, scope);
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
    values.push(evaluateExpression(currentArrayBody.contents[0] as ParseNode, scope));

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
