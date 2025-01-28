import * as vscode from "vscode";
import { completeCode } from "./commands/completeCode";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ai-coder" is now active!');

    const codeCompleteCommand = vscode.commands.registerCommand(
        "ai-coder.completeCode",
        completeCode
    );

    context.subscriptions.push(codeCompleteCommand);
}

export function deactivate() {}
