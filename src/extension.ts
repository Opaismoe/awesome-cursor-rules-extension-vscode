import * as vscode from 'vscode';
import { createRuleCommand } from './commands/createRule';
import { selectRuleCommand } from './commands/selectRule';
import { editRuleCommand } from './commands/editRule';
import { RulesService } from './services/rules';
import { Rule } from './types';
import { GithubService } from './services/github';
import { RuleEditorPanel } from './views/webview';
import { showCategoryQuickPick, showTemplateQuickPick } from './views/quickPick';

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

  // Register a specific command for GitHub templates
  context.subscriptions.push(
    vscode.commands.registerCommand('cursor-rules.selectGithubFast', async () => {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading GitHub templates (Fast Method)...',
        cancellable: false
      }, async (progress) => {
        try {
          const githubService = new GithubService();
          const repoUrl = 'https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules';
          
          // Step 1: Fetch only directories first (faster)
          progress.report({ message: `Fetching template directories...` });
          const directories = await githubService.fetchDirectories(repoUrl);
          
          if (directories.length === 0) {
            vscode.window.showInformationMessage('No GitHub template directories found');
            return;
          }
          
          // Create QuickPickItems from directories
          const directoryItems = directories.map(dir => ({
            label: dir.name.replace(/-/g, ' ').replace(/cursorrules-prompt-file$/, '').trim(),
            description: dir.description || `Template for ${dir.name}`,
            detail: 'GitHub Template Directory',
            directory: dir
          }));
          
          // Show directory selection
          const selectedDirItem = await vscode.window.showQuickPick(directoryItems, {
            placeHolder: 'Select a template directory',
            matchOnDescription: true,
            matchOnDetail: true
          });
          
          if (!selectedDirItem) {
            return; // User cancelled
          }
          
          // Step 2: Fetch the specific template from the selected directory
          progress.report({ message: `Loading template from ${selectedDirItem.label}...` });
          const template = await githubService.fetchRuleFromDirectory(repoUrl, selectedDirItem.directory);
          
          if (!template) {
            vscode.window.showErrorMessage(`Could not load template from ${selectedDirItem.label}`);
            return;
          }
          
          // Open the template in the editor
          RuleEditorPanel.createOrShow(context.extensionUri, template);
          
        } catch (error) {
          console.error('Error in two-step template selection:', error);
          vscode.window.showErrorMessage(`Error loading templates: ${error}`);
        }
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