import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import { Template, GitHubDirectory } from '../types';
import * as path from 'path';

export class GithubService {
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
      // Use token auth instead of plain text
      headers['Authorization'] = `token ${token}`;
    }
    
    return headers;
  }
  
  /**
   * Parses a GitHub repository URL into its components
   * @param repoUrl The URL to parse (e.g., 'https://github.com/owner/repo/tree/branch/path')
   */
  private parseRepoUrl(repoUrl: string): { owner: string; repoName: string; path?: string } {
    // Sanitize and validate URL input
    if (!repoUrl || typeof repoUrl !== 'string') {
      throw new Error('Invalid repository URL');
    }
    
    // Basic URL validation
    if (!repoUrl.startsWith('https://github.com/')) {
      throw new Error('URL must be a valid GitHub repository URL');
    }
    
    // Match GitHub repository URL parts using RegExp with security checks
    const match = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/[^\/]+\/(.+))?/.exec(repoUrl);
    
    if (!match) {
      throw new Error('Could not parse GitHub repository URL');
    }
    
    const owner = match[1];
    const repoName = match[2];
    const path = match[3];
    
    // Additional validation
    if (!owner || !repoName) {
      throw new Error('Missing repository owner or name');
    }
    
    return { owner, repoName, path };
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
   * Fetches only the directory listings from a GitHub repository path
   * This is faster than fetching all templates with their content
   */
  async fetchDirectories(repo: string): Promise<GitHubDirectory[]> {
    // Validate input
    if (!repo || typeof repo !== 'string') {
      console.error('Invalid repository URL provided');
      return [];
    }
    
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
      
      // Build the API URL with path if provided - use encodeURIComponent for security
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents${repoPath ? '/' + encodeURIComponent(repoPath) : ''}`;
      console.log(`Fetching directories from GitHub API: ${apiUrl}`);
      
      // Fetch repository contents with authorization headers if available
      const response = await axios.get(apiUrl, { 
        headers: this.getHeaders(),
        timeout: 10000 // Set a reasonable timeout
      });
      
      // Validate response data
      if (!Array.isArray(response.data)) {
        console.error('Invalid response data from GitHub API');
        return [];
      }
      
      // Filter only directories
      const directories = response.data
        .filter((item: any) => item && typeof item === 'object' && item.type === 'dir')
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
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 403) {
          console.error('Axios error details:', {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            responseData: axiosError.response?.data
          });
          
          this.isRateLimited = true;
          vscode.window.showWarningMessage('GitHub API rate limit exceeded. Using cached templates. Consider adding a GitHub token in settings.');
          return this.generateMockTemplates();
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to fetch template directories: ${errorMessage}`);
      return [];
    }
  }
  
  /**
   * Fetches a specific rule template from a directory
   * This is called after the user selects a directory
   */
  async fetchRuleFromDirectory(repo: string, directory: GitHubDirectory): Promise<Template | undefined> {
    // Input validation
    if (!repo || !directory || typeof directory !== 'object') {
      console.error('Invalid repository URL or directory');
      return undefined;
    }
    
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
      
      // Validate directory path
      if (!directory.path) {
        throw new Error('Directory path is missing');
      }
      
      // Build the API URL for the directory contents - use encodeURIComponent for security
      const dirContentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents/${encodeURIComponent(directory.path)}`;
      console.log(`Fetching contents of directory: ${dirContentsUrl}`);
      
      // Fetch directory contents with a timeout
      const dirResponse = await axios.get(dirContentsUrl, { 
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      // Validate response data
      if (!Array.isArray(dirResponse.data)) {
        throw new Error('Invalid response from GitHub API');
      }
      
      // Look for a README.md or .cursorrules file in the directory
      const templateFile = dirResponse.data.find((file: any) => 
        file && typeof file === 'object' && 
        file.type === 'file' && 
        (file.name === 'README.md' || file.name.endsWith('.cursorrules'))
      );
      
      if (templateFile) {
        console.log(`Found template file: ${templateFile.name}`);
        
        // Validate download URL
        if (!templateFile.download_url || typeof templateFile.download_url !== 'string' || 
            !templateFile.download_url.startsWith('https://')) {
          throw new Error('Invalid download URL for template file');
        }
        
        // Fetch the file content with a timeout
        const contentResponse = await axios.get(templateFile.download_url, { 
          headers: this.getHeaders(),
          timeout: 10000
        });
        
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
          content: typeof content === 'string' ? 
            // Sanitize content by handling potentially harmful content
            content.replace(/[^\x09\x0A\x0D\x20-\uFFFF]/g, '') : 
            JSON.stringify(content)
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
          // Provide a simple, safe template content
          content: `# ${name}\n\nTemplate content`
        };
        
        // Cache the template
        this.templateCache.set(cacheKey, template);
        return template;
      }
    } catch (error) {
      console.error(`Error fetching template from directory ${directory.name}:`, error);
      vscode.window.showErrorMessage(`Failed to fetch template from ${directory.name}: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }
} 