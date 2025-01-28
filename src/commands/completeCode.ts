import * as vscode from "vscode";
import { DeepseekService } from "../services/deepseekService";
import { v4 as uuidv4 } from "uuid";
const Diff = require("diff");

enum StatusBarStatus {
  Enabled,
  Disabled,
}

class DeepseekCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private lastTriggerTime: number = 0;
  private readonly debounceTime = 1000;
  private _lastShownCompletion: any;

  constructor(private deepseekService: DeepseekService) {}

  private onError(error: any) {
    const message = error?.message || "An error occurred during completion";
    vscode.window
      .showErrorMessage(message, "Documentation")
      .then((selection) => {
        if (selection === "Documentation") {
          vscode.env.openExternal(
            vscode.Uri.parse("https://deepseek.com/docs")
          );
        }
      });
  }

  private willDisplay(
    document: vscode.TextDocument,
    selectedCompletionInfo: vscode.SelectedCompletionInfo | undefined,
    completion: string
  ): boolean {
    if (selectedCompletionInfo) {
      const { text } = selectedCompletionInfo;
      if (!completion.startsWith(text)) {
        return false;
      }
    }
    return true;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | null> {
    console.log("Provide inline completion items");
    // Check if enough time has passed since last trigger
    const currentTime = Date.now();
    if (currentTime - this.lastTriggerTime < this.debounceTime) {
      return null;
    }
    this.lastTriggerTime = currentTime;

    // Don't trigger on empty lines or spaces only
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);
    if (!textBeforeCursor.trim()) {
      return null;
    }

    // Only trigger if there's at least 3 characters on the current line
    if (textBeforeCursor.length < 3) {
      return null;
    }

    // Don't autocomplete with multi-cursor
    if (vscode.window.activeTextEditor?.selections.length ?? 0 > 1) {
      return null;
    }

    try {
      // Get the text with context (previous lines for better completion)
      const contextLines = document.getText(
        new vscode.Range(
          new vscode.Position(Math.max(0, position.line - 5), 0),
          position
        )
      );
      console.log("Prompt:", contextLines);

      const completion = await this.deepseekService.getCompletion(contextLines);
      console.log("Completion:", completion);

      if (
        !this.willDisplay(document, context.selectedCompletionInfo, completion)
      ) {
        return null;
      }

      // Handle single vs multi-line completions
      const startPos = context.selectedCompletionInfo?.range.start ?? position;
      let range = new vscode.Range(startPos, startPos);
      let completionText = completion;

      if (!completion.includes("\n")) {
        const currentLineText = document
          .lineAt(startPos)
          .text.substring(startPos.character);
        const diffs = Diff.diffWords(currentLineText, completion);

        if (this.diffPatternMatches(diffs, ["+"])) {
          // Just insert at cursor
        } else if (this.diffPatternMatches(diffs, ["+", "="])) {
          range = new vscode.Range(
            startPos,
            document.lineAt(startPos).range.end
          );
        }
      } else {
        range = new vscode.Range(startPos, document.lineAt(startPos).range.end);
      }

      const completionItem = new vscode.InlineCompletionItem(
        completionText,
        range
      );
      (completionItem as any).completeBracketPairs = true;

      this._lastShownCompletion = {
        completion: completionText,
        id: uuidv4(),
      };

      return [completionItem];
    } catch (error) {
      this.onError(error);
      return null;
    }
  }

  private diffPatternMatches(
    diffs: any[],
    pattern: ("+" | "-" | "=")[]
  ): boolean {
    if (diffs.length !== pattern.length) {
      return false;
    }

    return diffs.every((diff, i) => {
      const type = !diff.added && !diff.removed ? "=" : diff.added ? "+" : "-";
      return type === pattern[i];
    });
  }
}

export function activateCompletion(context: vscode.ExtensionContext) {
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
  const provider = new DeepseekCompletionProvider(deepseekService);

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      [{ pattern: "**" }],
      provider
    )
  );
}
