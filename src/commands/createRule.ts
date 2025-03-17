import * as vscode from 'vscode';
import { RuleEditorPanel } from '../views/webview';

/**
 * Command handler for creating a new rule
 */
export async function createRuleCommand(context: vscode.ExtensionContext) {
  // Open the rule editor with a blank template
  RuleEditorPanel.createOrShow(context.extensionUri);
} 