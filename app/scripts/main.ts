// import { tokenize, removeWhitespace, TokenName } from "./lexer.js";
import { parseProgram } from "./parser.js";
import { lex } from "./lexer.js";

export function run(div: HTMLElement): void {

  const aceDiv = document.createElement("div");
  div.appendChild(aceDiv);
  // aceDiv.style.position = "absolute";
  aceDiv.style.width = "100%";
  aceDiv.style.height = "80%";
  var editor = ace.edit(aceDiv);
  editor.setOptions({
    fontSize: "15pt",
  });
  editor.setTheme("ace/theme/monokai");

  const runButton = document.createElement("button");
  div.appendChild(runButton);
  runButton.innerText = "run";
  runButton.onclick = () => setTimeout(() => {
    const code = editor.getValue();
    // console.log(lex(code));
    console.log(parseProgram(lex(code)));
    // const nodes = tokenize(code);
    // console.log(parseProgram(nodes));
  }, 0);
  // editor.session.setMode("ace/mode/javascript");
}
