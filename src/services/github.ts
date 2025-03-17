import * as vscode from 'vscode';
import axios from 'axios';
import { Template } from '../types';
import * as path from 'path';

export class GithubService {
  private cache: Map<string, Template[]> = new Map();
  
  /**
   * Parses a GitHub repository URL and extracts owner, repo name, and path
   */
  parseRepoUrl(repoUrl: string): { owner: string; repoName: string; path: string } {
    // Remove GitHub URL prefix
    const cleanUrl = repoUrl.replace('https://github.com/', '');
    
    // Check if URL has a path component (e.g., /tree/main/rules)
    const treePattern = /\/tree\/[^\/]+\/(.+)$/;
    const treeMatch = cleanUrl.match(treePattern);
    
    let repoPath = '';
    let repoWithoutPath = cleanUrl;
    
    if (treeMatch) {
      // Extract the path after /tree/branch/
      repoPath = treeMatch[1];
      // Remove the /tree/branch/path part from the repo
      repoWithoutPath = cleanUrl.replace(/\/tree\/[^\/]+\/.+$/, '');
    }
    
    // Split owner and repo name
    const [owner, repoName] = repoWithoutPath.split('/');
    
    return { owner, repoName, path: repoPath };
  }
  
  /**
   * Fetches templates from a GitHub repository
   */
  async fetchTemplates(repo: string): Promise<Template[]> {
    if (this.cache.has(repo)) {
      return this.cache.get(repo)!;
    }
    
    try {
      // Parse repo URL to extract owner, repo name, and path
      const { owner, repoName, path: repoPath } = this.parseRepoUrl(repo);
      
      // Build the API URL with path if provided
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents${repoPath ? '/' + repoPath : ''}`;
      
      // Fetch repository contents
      const response = await axios.get(apiUrl);
      
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
            const nameMatch = content.match(/name:\s*(.+)/i);
            if (nameMatch) {
              name = nameMatch[1].trim();
            }
            
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