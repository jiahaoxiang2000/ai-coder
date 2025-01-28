import * as vscode from "vscode";
import axios from "axios";
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "ai-coder" is now active!');

  const codeComplete = vscode.commands.registerCommand(
    "ai-coder.completeCode",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor!");
        return;
      }

      const document = editor.document;
      const selection = editor.selection;
      const text = document.getText(selection);

      try {
        const apiKey = vscode.workspace
          .getConfiguration("ai-coder")
          .get("deepseekApiKey");
        if (!apiKey) {
          vscode.window.showErrorMessage(
            "Please set your Deepseek API key in settings"
          );
          return;
        }

        const response = await axios.post(
          "https://api.deepseek.com/chat/completions",
          {
            model: "deepseek-chat",
            messages: [
              {
                role: "user",
                content: `Complete this code:\n${text}`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        const completion = response.data.choices[0].message.content;
        editor.edit((editBuilder) => {
          editBuilder.replace(selection, completion);
        });
      } catch (error: any) {
        vscode.window.showErrorMessage(
          "Error getting code completion: " + error.message
        );
      }
    }
  );

  context.subscriptions.push(codeComplete);
}
export function deactivate() {}
