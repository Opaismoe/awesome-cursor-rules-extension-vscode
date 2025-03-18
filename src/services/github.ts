import * as vscode from 'vscode';
import axios from 'axios';
import { Template, GitHubDirectory } from '../types';
import * as path from 'path';

export class GithubService {
  private cache: Map<string, Template[]> = new Map();
  private directoriesCache: Map<string, GitHubDirectory[]> = new Map();
  private templateCache: Map<string, Template> = new Map();
  private isRateLimited = false;
  private mockTemplatesGenerated = false;
  private mockTemplates: GitHubDirectory[] = [];
  
  /**
   * Gets the GitHub token from settings if available
   */
  private getGitHubToken(): string | undefined {
    return vscode.workspace.getConfiguration('cursorRules').get<string>('githubToken');
  }
  
  /**
   * Creates HTTP headers with authorization if token is available
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    const token = this.getGitHubToken();
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    return headers;
  }
  
  /**
   * Generates mock templates when rate limited
   */
  private generateMockTemplates(): GitHubDirectory[] {
    if (this.mockTemplatesGenerated) {
      return this.mockTemplates;
    }
    
    const templates: GitHubDirectory[] = [
      {
        name: 'react-typescript-cursorrules',
        path: 'rules/react-typescript-cursorrules',
        type: 'dir',
        description: 'Template for React TypeScript applications',
        category: 'GitHub Templates'
      },
      {
        name: 'angular-typescript-cursorrules',
        path: 'rules/angular-typescript-cursorrules',
        type: 'dir',
        description: 'Template for Angular TypeScript applications',
        category: 'GitHub Templates'
      },
      {
        name: 'nextjs-typescript-cursorrules',
        path: 'rules/nextjs-typescript-cursorrules',
        type: 'dir',
        description: 'Template for Next.js TypeScript applications',
        category: 'GitHub Templates'
      },
      {
        name: 'vue-typescript-cursorrules',
        path: 'rules/vue-typescript-cursorrules',
        type: 'dir',
        description: 'Template for Vue TypeScript applications',
        category: 'GitHub Templates'
      }
    ];
    
    this.mockTemplates = templates;
    this.mockTemplatesGenerated = true;
    return templates;
  }
  
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
   * Fetches only the directory listings from a GitHub repository path
   * This is faster than fetching all templates with their content
   */
  async fetchDirectories(repo: string): Promise<GitHubDirectory[]> {
    // Check if we're rate limited and use mock data if needed
    if (this.isRateLimited) {
      vscode.window.showWarningMessage('Using cached templates due to GitHub API rate limit. Consider adding a GitHub token in settings.');
      return this.generateMockTemplates();
    }
    
    // Check cache first
    if (this.directoriesCache.has(repo)) {
      return this.directoriesCache.get(repo)!;
    }
    
    try {
      // Parse repo URL to extract owner, repo name, and path
      const { owner, repoName, path: repoPath } = this.parseRepoUrl(repo);
      
      // Build the API URL with path if provided
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents${repoPath ? '/' + repoPath : ''}`;
      console.log(`Fetching directories from GitHub API: ${apiUrl}`);
      
      // Fetch repository contents with authorization headers if available
      const response = await axios.get(apiUrl, { headers: this.getHeaders() });
      
      // Filter only directories
      const directories = response.data
        .filter((item: any) => item.type === 'dir')
        .map((dir: any) => ({
          name: dir.name,
          path: dir.path,
          type: dir.type,
          // Format directory name for display
          description: `Template for ${dir.name.replace(/-/g, ' ').replace(/cursorrules-prompt-file$/, '').trim()}`,
          category: 'GitHub Templates'
        }));
      
      console.log(`Found ${directories.length} template directories`);
      
      // Cache the result
      this.directoriesCache.set(repo, directories);
      return directories;
    } catch (error) {
      console.error('Error fetching directories:', error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data
        });
        
        // Set the rate limited flag
        this.isRateLimited = true;
        
        // Use mock data as fallback
        vscode.window.showWarningMessage('GitHub API rate limit exceeded. Using cached templates. Consider adding a GitHub token in settings.');
        return this.generateMockTemplates();
      }
      
      vscode.window.showErrorMessage(`Failed to fetch template directories: ${error}`);
      return [];
    }
  }
  
  /**
   * Fetches a specific rule template from a directory
   * This is called after the user selects a directory
   */
  async fetchRuleFromDirectory(repo: string, directory: GitHubDirectory): Promise<Template | undefined> {
    // Check cache first using directory path as key
    const cacheKey = `${repo}/${directory.path}`;
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }
    
    // If rate limited, generate a mock template
    if (this.isRateLimited) {
      const mockTemplate: Template = {
        name: directory.name.replace(/-/g, ' ').replace(/cursorrules-prompt-file$/, '').trim(),
        description: directory.description || `Template for ${directory.name}`,
        category: directory.category || 'GitHub Templates',
        content: `# ${directory.name}\n\nThis is a template placeholder for ${directory.name}.\n\nGitHub API rate limit was exceeded. Please try again later or add a GitHub token in settings.`
      };
      
      this.templateCache.set(cacheKey, mockTemplate);
      return mockTemplate;
    }
    
    try {
      // Parse repo URL to extract owner, repo name
      const { owner, repoName } = this.parseRepoUrl(repo);
      
      // Build the API URL for the directory contents
      const dirContentsUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${directory.path}`;
      console.log(`Fetching contents of directory: ${dirContentsUrl}`);
      
      // Fetch directory contents
      const dirResponse = await axios.get(dirContentsUrl, { headers: this.getHeaders() });
      
      // Look for a README.md or .cursorrules file in the directory
      const templateFile = dirResponse.data.find((file: any) => 
        file.type === 'file' && (file.name === 'README.md' || file.name.endsWith('.cursorrules'))
      );
      
      if (templateFile) {
        console.log(`Found template file: ${templateFile.name}`);
        
        // Fetch the file content
        const contentResponse = await axios.get(templateFile.download_url, { headers: this.getHeaders() });
        const content = contentResponse.data;
        
        // Extract directory name as the template name
        let name = directory.name.replace(/-/g, ' ').replace(/cursorrules-prompt-file$/, '').trim();
        let description = directory.description || `Template for ${name}`;
        let category = directory.category || 'GitHub Templates';
        
        // Simple metadata extraction if available
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
        
        const template = {
          name,
          description,
          category,
          content: typeof content === 'string' ? content : JSON.stringify(content)
        };
        
        // Cache the template
        this.templateCache.set(cacheKey, template);
        return template;
      } else {
        // If no README.md or .cursorrules file, use the directory name as a template
        console.log(`No template file found in directory, using directory name: ${directory.name}`);
        
        // Clean up the name
        const name = directory.name.charAt(0).toUpperCase() + 
                    directory.name.slice(1).replace(/-/g, ' ').replace(/cursorrules-prompt-file$/, '').trim();
        
        const template = {
          name,
          description: directory.description || `Template for ${name}`,
          category: directory.category || 'GitHub Templates',
          content: `# ${name}\n\nTemplate content`
        };
        
        // Cache the template
        this.templateCache.set(cacheKey, template);
        return template;
      }
    } catch (error) {
      console.error(`Error fetching template from directory ${directory.name}:`, error);
      vscode.window.showErrorMessage(`Failed to fetch template from ${directory.name}: ${error}`);
      return undefined;
    }
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
      console.log(`Parsed GitHub URL: owner=${owner}, repo=${repoName}, path=${repoPath}`);
      
      // Build the API URL with path if provided
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents${repoPath ? '/' + repoPath : ''}`;
      console.log(`GitHub API URL: ${apiUrl}`);
      
      // Fetch repository contents
      console.log(`Fetching contents from GitHub API...`);
      const response = await axios.get(apiUrl, { headers: this.getHeaders() });
      console.log(`Received ${response.data.length} items from GitHub API`);
      
      const templates: Template[] = [];
      
      // Process repository contents
      for (const item of response.data) {
        // Handle directories - treat directories as template files themselves
        if (item.type === 'dir') {
          console.log(`Processing directory: ${item.name}`);
          
          try {
            // Try to fetch the README.md or any .cursorrules file from the directory
            const dirContentsUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${item.path}`;
            const dirResponse = await axios.get(dirContentsUrl, { headers: this.getHeaders() });
            
            // Look for a README.md or .cursorrules file in the directory
            const readmeFile = dirResponse.data.find((file: any) => 
              file.type === 'file' && (file.name === 'README.md' || file.name.endsWith('.cursorrules'))
            );
            
            if (readmeFile) {
              console.log(`Found template file in directory: ${readmeFile.name}`);
              const contentResponse = await axios.get(readmeFile.download_url, { headers: this.getHeaders() });
              const content = contentResponse.data;
              
              // Extract directory name as the template name
              let name = item.name.replace(/-/g, ' ').replace(/cursorrules-prompt-file$/, '').trim();
              let description = `Template for ${name}`;
              let category = 'GitHub Templates';
              
              // Simple metadata extraction if available
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
                
                console.log(`Extracted metadata: name=${name}, category=${category}`);
              }
              
              templates.push({
                name,
                description,
                category,
                content: typeof content === 'string' ? content : JSON.stringify(content)
              });
            } else {
              // If no README.md or .cursorrules file, use the directory name as a template
              console.log(`No template file found in directory, using directory name: ${item.name}`);
              
              // Clean up the name
              const name = item.name.replace(/-/g, ' ').replace(/cursorrules-prompt-file$/, '').trim();
              
              templates.push({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                description: `Template for ${name}`,
                category: 'GitHub Templates',
                content: `# ${name}\n\nTemplate content`
              });
            }
          } catch (error) {
            console.error(`Error processing directory ${item.name}:`, error);
          }
        }
        // Handle direct files
        else if (item.type === 'file' && (
            item.name.endsWith('.cursorrules') || 
            item.name.endsWith('.md')
          )) {
          console.log(`Processing file: ${item.name}, download URL: ${item.download_url}`);
          
          const contentResponse = await axios.get(item.download_url, { headers: this.getHeaders() });
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
            
            console.log(`Extracted metadata: name=${name}, category=${category}`);
          }
          
          templates.push({
            name,
            description,
            category,
            content: typeof content === 'string' ? content : JSON.stringify(content)
          });
        }
      }
      
      console.log(`Total templates found: ${templates.length}`);
      this.cache.set(repo, templates);
      return templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data
        });
      }
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

  /**
   * Clears the rate limit status and caches
   * This can be called after the user adds a token
   */
  clearRateLimitStatus(): void {
    this.isRateLimited = false;
    this.directoriesCache.clear();
    this.templateCache.clear();
    this.cache.clear();
    console.log('GitHub service caches and rate limit status cleared');
  }
} 