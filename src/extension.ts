import * as vscode from 'vscode';
import { createRuleCommand } from './commands/createRule';
import { selectRuleCommand } from './commands/selectRule';
import { editRuleCommand } from './commands/editRule';
import { RulesService } from './services/rules';
import { Rule } from './types';

/**
 * This method is called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Cursor Rules extension is now active');

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('cursor-rules.create', () => 
      createRuleCommand(context)),
    vscode.commands.registerCommand('cursor-rules.select', () => 
      selectRuleCommand(context)),
    vscode.commands.registerCommand('cursor-rules.edit', () => 
      editRuleCommand(context))
  );

  // Register the save rule command
  context.subscriptions.push(
    vscode.commands.registerCommand('cursor-rules.saveRule', (rule: Rule) => {
      const rulesService = new RulesService();
      rulesService.saveRule(rule)
        .then(() => {
          vscode.window.showInformationMessage(`Rule "${rule.name}" saved successfully`);
        })
        .catch(error => {
          vscode.window.showErrorMessage(`Failed to save rule: ${error}`);
        });
    })
  );
}

/**
 * This method is called when the extension is deactivated
 */
export function deactivate() {
  // Clean up resources
} 