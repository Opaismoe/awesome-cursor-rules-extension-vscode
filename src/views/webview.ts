import * as vscode from 'vscode';
import { Template, Rule } from '../types';

export class RuleEditorPanel {
  public static currentPanel: RuleEditorPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  /**
   * Creates or shows the rule editor panel
   */
  public static createOrShow(
    extensionUri: vscode.Uri, 
    template?: Template,
    rule?: Rule
  ) {
    // If we already have a panel, show it
    if (RuleEditorPanel.currentPanel) {
      RuleEditorPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'cursorRuleEditor',
      'Edit Cursor Rule',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    RuleEditorPanel.currentPanel = new RuleEditorPanel(panel, extensionUri, template, rule);
  }

  /**
   * Private constructor for RuleEditorPanel
   */
  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    template?: Template,
    rule?: Rule
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set initial content
    const initialContent = template ? template.content : 
                          rule ? rule.content : 
                          '# Cursor Rule\n\nProvide instructions for the AI assistant here.\n';
    
    const initialName = template ? template.name : 
                       rule ? rule.name : 
                       'my-rule';

    // Set the webview's initial html content
    this._panel.webview.html = this._getHtmlForWebview(initialName, initialContent);

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'save':
            // Post the save message back to the extension
            vscode.commands.executeCommand('cursor-rules.saveRule', message.rule);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Generates the HTML for the webview
   */
  private _getHtmlForWebview(initialName: string, initialContent: string): string {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edit Cursor Rule</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          input, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
          }
          textarea {
            min-height: 400px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
          }
          button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
        </style>
      </head>
      <body>
        <form id="ruleForm">
          <div class="form-group">
            <label for="name">Rule Name:</label>
            <input type="text" id="name" value="${this._escapeHtml(initialName)}" required>
          </div>
          <div class="form-group">
            <label for="content">Rule Content:</label>
            <textarea id="content" rows="20" required>${this._escapeHtml(initialContent)}</textarea>
          </div>
          <button type="submit">Save Rule</button>
        </form>

        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById('ruleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            vscode.postMessage({
              command: 'save',
              rule: {
                name: document.getElementById('name').value,
                content: document.getElementById('content').value
              }
            });
          });
        </script>
      </body>
      </html>`;
  }

  /**
   * Simple HTML escaping for security
   */
  private _escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Disposes of the panel when it's closed
   */
  public dispose() {
    RuleEditorPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
} 