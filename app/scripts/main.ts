import { parseProgram } from "./stackParser.js";
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
    console.log(parseProgram(lex(code)));
  }, 0);
  // editor.session.setMode("ace/mode/javascript");
}
