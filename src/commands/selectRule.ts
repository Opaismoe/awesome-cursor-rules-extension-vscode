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
      console.log(`Loaded ${Array.from(localCategories.keys()).length} local template categories`);
      
      // Add local templates to the merged map
      for (const [category, templates] of localCategories.entries()) {
        mergedCategories.set(category, templates);
        console.log(`Added local category: ${category} with ${templates.length} templates`);
      }
      
      // Then try to load GitHub templates if configured
      const config = vscode.workspace.getConfiguration('cursorRules');
      const sources = config.get<string[]>('templateSources', [
        'https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules'
      ]);
      
      console.log(`Found template sources: ${JSON.stringify(sources)}`);
      
      if (sources.length > 0) {
        progress.report({ message: 'Fetching online templates...' });
        
        try {
          // For now, use the first source
          const source = sources[0];
          console.log(`Fetching directories from: ${source}`);
          
          const githubService = new GithubService();
          // Use the directory-based approach
          const directories = await githubService.fetchDirectories(source);
          console.log(`Loaded ${directories.length} GitHub directories`);
          
          // Process each directory to load its template
          for (const dir of directories) {
            const template = await githubService.fetchRuleFromDirectory(source, dir);
            if (template) {
              if (mergedCategories.has(template.category)) {
                console.log(`Adding template to existing category: ${template.category}`);
                mergedCategories.get(template.category)!.push(template);
              } else {
                console.log(`Creating new category: ${template.category} for template`);
                mergedCategories.set(template.category, [template]);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching online templates:', error);
          vscode.window.showErrorMessage(`Error loading GitHub templates: ${error}`);
          // Continue with local templates if GitHub fails
        }
      }
      
      console.log(`Total merged categories: ${mergedCategories.size}`);
      
      if (mergedCategories.size === 0) {
        vscode.window.showInformationMessage('No templates found');
        return;
      }
      
      // Show category quick pick
      const categories = Array.from(mergedCategories.keys());
      console.log(`Available categories: ${categories.join(', ')}`);
      
      const selectedCategory = await showCategoryQuickPick(categories);
      
      if (!selectedCategory) {
        return; // User cancelled
      }
      
      console.log(`Selected category: ${selectedCategory}`);
      
      // Show templates in selected category
      const templates = mergedCategories.get(selectedCategory) || [];
      console.log(`Templates in category: ${templates.length}`);
      
      const selectedTemplate = await showTemplateQuickPick(templates);
      
      if (!selectedTemplate) {
        return; // User cancelled
      }
      
      console.log(`Selected template: ${selectedTemplate.name}`);
      
      // Open the template in the editor
      RuleEditorPanel.createOrShow(context.extensionUri, selectedTemplate);
      
    } catch (error) {
      console.error('Error in selectRuleCommand:', error);
      vscode.window.showErrorMessage(`Error loading templates: ${error}`);
    }
  });
} 