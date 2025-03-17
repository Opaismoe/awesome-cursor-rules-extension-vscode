import * as vscode from 'vscode';
import { RulesService } from '../services/rules';
import { RuleEditorPanel } from '../views/webview';
import { showRuleQuickPick } from '../views/quickPick';

/**
 * Command handler for editing an existing rule
 */
export async function editRuleCommand(context: vscode.ExtensionContext) {
  const rulesService = new RulesService();
  
  try {
    // Fetch existing rules
    const rules = await rulesService.getExistingRules();
    
    if (rules.length === 0) {
      vscode.window.showInformationMessage('No rules found in the workspace');
      return;
    }
    
    // Show rule selection QuickPick
    const selectedRule = await showRuleQuickPick(rules);
    
    if (!selectedRule) {
      return; // User cancelled
    }
    
    // Open the rule in the editor
    RuleEditorPanel.createOrShow(context.extensionUri, undefined, selectedRule);
    
  } catch (error) {
    vscode.window.showErrorMessage(`Error fetching rules: ${error}`);
  }
} 