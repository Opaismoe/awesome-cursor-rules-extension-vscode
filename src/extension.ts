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

  // Register a command to reset GitHub rate limit status
  context.subscriptions.push(
    vscode.commands.registerCommand('cursor-rules.resetGithubRateLimit', () => {
      const githubService = new GithubService();
      githubService.clearRateLimitStatus();
      vscode.window.showInformationMessage('GitHub rate limit status has been reset. Try fetching templates again.');
    })
  );

  // Register a specific command for GitHub templates
  context.subscriptions.push(
    vscode.commands.registerCommand('cursor-rules.selectGithub', async () => {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading GitHub templates...',
        cancellable: false
      }, async (progress) => {
        try {
          const githubService = new GithubService();
          const repoUrl = 'https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules';
          
          progress.report({ message: `Fetching templates from ${repoUrl}...` });
          
          // Get templates by category
          const categories = await githubService.getTemplatesByCategory(repoUrl);
          
          if (categories.size === 0) {
            vscode.window.showInformationMessage('No GitHub templates found');
            return;
          }
          
          // Show category quick pick
          const categoryNames = Array.from(categories.keys());
          const selectedCategory = await showCategoryQuickPick(categoryNames);
          
          if (!selectedCategory) {
            return; // User cancelled
          }
          
          // Show templates in selected category
          const templates = categories.get(selectedCategory) || [];
          const selectedTemplate = await showTemplateQuickPick(templates);
          
          if (!selectedTemplate) {
            return; // User cancelled
          }
          
          // Open the template in the editor
          RuleEditorPanel.createOrShow(context.extensionUri, selectedTemplate);
          
        } catch (error) {
          console.error('Error fetching GitHub templates:', error);
          vscode.window.showErrorMessage(`Error loading GitHub templates: ${error}`);
        }
      });
    })
  );

  // Register the cached GitHub templates command (two-step process)
  context.subscriptions.push(
    vscode.commands.registerCommand('cursor-rules.selectGithubCached', async () => {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading GitHub directories...',
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