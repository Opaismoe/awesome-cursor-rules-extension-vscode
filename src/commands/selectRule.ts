import * as vscode from 'vscode';
import { GithubService } from '../services/github';
import { LocalTemplateService } from '../services/localTemplates';
import { RuleEditorPanel } from '../views/webview';
import { showCategoryQuickPick, showTemplateQuickPick } from '../views/quickPick';

/**
 * Command handler for selecting a rule template
 */
export async function selectRuleCommand(context: vscode.ExtensionContext) {
  // Show progress while fetching templates
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Loading rule templates...',
    cancellable: false
  }, async (progress) => {
    try {
      const mergedCategories = new Map<string, any[]>();
      
      // First load local templates
      const localTemplateService = new LocalTemplateService();
      const localCategories = await localTemplateService.getTemplatesByCategory(context.extensionUri.fsPath);
      
      // Add local templates to the merged map
      for (const [category, templates] of localCategories.entries()) {
        mergedCategories.set(category, templates);
      }
      
      // Then try to load GitHub templates if configured
      const config = vscode.workspace.getConfiguration('cursorRules');
      const sources = config.get<string[]>('templateSources', [
        'https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules'
      ]);
      
      if (sources.length > 0) {
        progress.report({ message: 'Fetching online templates...' });
        
        try {
          // For now, use the first source
          const source = sources[0];
          const githubService = new GithubService();
          const onlineCategories = await githubService.getTemplatesByCategory(source);
          
          // Merge GitHub templates with local templates
          for (const [category, templates] of onlineCategories.entries()) {
            if (mergedCategories.has(category)) {
              mergedCategories.get(category)!.push(...templates);
            } else {
              mergedCategories.set(category, templates);
            }
          }
        } catch (error) {
          console.error('Error fetching online templates:', error);
          // Continue with local templates if GitHub fails
        }
      }
      
      if (mergedCategories.size === 0) {
        vscode.window.showInformationMessage('No templates found');
        return;
      }
      
      // Show category quick pick
      const categories = Array.from(mergedCategories.keys());
      const selectedCategory = await showCategoryQuickPick(categories);
      
      if (!selectedCategory) {
        return; // User cancelled
      }
      
      // Show templates in selected category
      const templates = mergedCategories.get(selectedCategory) || [];
      const selectedTemplate = await showTemplateQuickPick(templates);
      
      if (!selectedTemplate) {
        return; // User cancelled
      }
      
      // Open the template in the editor
      RuleEditorPanel.createOrShow(context.extensionUri, selectedTemplate);
      
    } catch (error) {
      vscode.window.showErrorMessage(`Error loading templates: ${error}`);
    }
  });
} 