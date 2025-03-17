import * as vscode from 'vscode';
import axios from 'axios';
import { Template } from '../types';
import * as path from 'path';

export class GithubService {
  private cache: Map<string, Template[]> = new Map();
  
  /**
   * Fetches templates from a GitHub repository
   */
  async fetchTemplates(repo: string): Promise<Template[]> {
    if (this.cache.has(repo)) {
      return this.cache.get(repo)!;
    }
    
    try {
      // Parse repo path
      const [owner, repoName] = repo.replace('https://github.com/', '').split('/');
      
      // Fetch repository contents
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repoName}/contents`
      );
      
      const templates: Template[] = [];
      
      // Process repository contents
      for (const item of response.data) {
        if (item.type === 'file' && (
            item.name.endsWith('.cursorrules') || 
            item.name.endsWith('.md')
          )) {
          const contentResponse = await axios.get(item.download_url);
          const content = contentResponse.data;
          
          // Extract metadata if available
          let name = path.basename(item.name, path.extname(item.name));
          let description = `Template for ${name}`;
          let category = 'General';
          
          // Simple metadata extraction - could be enhanced
          if (typeof content === 'string') {
            const descMatch = content.match(/description:\s*(.+)/i);
            if (descMatch) {
              description = descMatch[1].trim();
            }
            
            const catMatch = content.match(/category:\s*(.+)/i);
            if (catMatch) {
              category = catMatch[1].trim();
            }
          }
          
          templates.push({
            name,
            description,
            category,
            content: typeof content === 'string' ? content : JSON.stringify(content)
          });
        }
      }
      
      this.cache.set(repo, templates);
      return templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      vscode.window.showErrorMessage(`Failed to fetch templates: ${error}`);
      return [];
    }
  }

  /**
   * Gets templates grouped by category
   */
  async getTemplatesByCategory(repo: string): Promise<Map<string, Template[]>> {
    const templates = await this.fetchTemplates(repo);
    const categorized = new Map<string, Template[]>();
    
    for (const template of templates) {
      if (!categorized.has(template.category)) {
        categorized.set(template.category, []);
      }
      categorized.get(template.category)!.push(template);
    }
    
    return categorized;
  }
} 