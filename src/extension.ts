import * as vscode from "vscode";
import { activateCompletion } from "./commands/completeCode";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ai-coder" is now active!');

    activateCompletion(context);
}

export function deactivate() {}
