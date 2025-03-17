import * as vscode from 'vscode';
import { GithubService } from '../services/github';
import { RuleEditorPanel } from '../views/webview';
import { showCategoryQuickPick, showTemplateQuickPick } from '../views/quickPick';

/**
 * Command handler for selecting a rule template
 */
export async function selectRuleCommand(context: vscode.ExtensionContext) {
  // Get configured template sources
  const config = vscode.workspace.getConfiguration('cursorRules');
  const sources = config.get<string[]>('templateSources', [
    'https://github.com/PatrickJS/awesome-cursorrules'
  ]);
  
  if (sources.length === 0) {
    vscode.window.showErrorMessage('No template sources configured. Please add template sources in settings.');
    return;
  }
  
  // For now, use the first source
  const source = sources[0];
  
  // Show progress while fetching templates
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Fetching rule templates...',
    cancellable: false
  }, async (progress) => {
    try {
      const githubService = new GithubService();
      const categorized = await githubService.getTemplatesByCategory(source);
      
      if (categorized.size === 0) {
        vscode.window.showInformationMessage('No templates found in the repository');
        return;
      }
      
      // Show category quick pick
      const categories = Array.from(categorized.keys());
      const selectedCategory = await showCategoryQuickPick(categories);
      
      if (!selectedCategory) {
        return; // User cancelled
      }
      
      // Show templates in selected category
      const templates = categorized.get(selectedCategory) || [];
      const selectedTemplate = await showTemplateQuickPick(templates);
      
      if (!selectedTemplate) {
        return; // User cancelled
      }
      
      // Open the template in the editor
      RuleEditorPanel.createOrShow(context.extensionUri, selectedTemplate);
      
    } catch (error) {
      vscode.window.showErrorMessage(`Error fetching templates: ${error}`);
    }
  });
} 