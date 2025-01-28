import * as vscode from "vscode";
import { DeepseekService } from "../services/deepseekService";

export async function completeCode() {
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
      .get<string>("deepseekApiKey");

    if (!apiKey) {
      vscode.window.showErrorMessage(
        "Please set your Deepseek API key in settings"
      );
      return;
    }

    const deepseekService = new DeepseekService(apiKey);
    const completion = await deepseekService.getCompletion(text);

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, completion);
    });
  } catch (error: any) {
    vscode.window.showErrorMessage(
      "Error getting code completion: " + error.message
    );
  }
}
