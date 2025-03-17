import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Rule } from '../types';
import { promisify } from 'util';

// Expose these for easier mocking in tests
export const fsOps = {
  writeFile: promisify(fs.writeFile),
  mkdir: promisify(fs.mkdir),
  readdir: promisify(fs.readdir),
  readFile: promisify(fs.readFile),
  exists: promisify(fs.exists),
  unlink: promisify(fs.unlink)
};

export class RulesService {
  /**
   * Checks if a directory exists, creates it if it doesn't
   */
  private async ensureDir(dir: string): Promise<void> {
    if (!await fsOps.exists(dir)) {
      await fsOps.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Saves a rule to the workspace
   */
  async saveRule(rule: Rule): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error('No workspace folder open');
    }
    
    const rootPath = workspaceFolders[0].uri.fsPath;
    
    // Get configuration
    const config = vscode.workspace.getConfiguration('cursorRules');
    const useDirectory = config.get<boolean>('useDirectoryStructure', true);
    
    if (useDirectory) {
      // Save to .cursor/rules directory
      const rulesDir = path.join(rootPath, '.cursor', 'rules');
      await this.ensureDir(rulesDir);
      
      // Sanitize rule name for filename
      const safeName = rule.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      const filePath = path.join(rulesDir, `${safeName}.md`);
      
      await fsOps.writeFile(filePath, rule.content, 'utf8');
      vscode.window.showInformationMessage(`Rule saved to ${filePath}`);
    } else {
      // Save as .cursorrules file
      const filePath = path.join(rootPath, '.cursorrules');
      await fsOps.writeFile(filePath, rule.content, 'utf8');
      vscode.window.showInformationMessage(`Rule saved to ${filePath}`);
    }
  }

  /**
   * Gets existing rules from the workspace
   */
  async getExistingRules(): Promise<Rule[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }
    
    const rootPath = workspaceFolders[0].uri.fsPath;
    const rules: Rule[] = [];
    
    // Check for .cursorrules file
    const rootRulePath = path.join(rootPath, '.cursorrules');
    if (await fsOps.exists(rootRulePath)) {
      const content = await fsOps.readFile(rootRulePath, 'utf8');
      rules.push({
        name: '.cursorrules',
        content
      });
    }
    
    // Check for .cursor/rules directory
    const rulesDir = path.join(rootPath, '.cursor', 'rules');
    if (await fsOps.exists(rulesDir)) {
      const files = await fsOps.readdir(rulesDir) as (string | fs.Dirent)[];
      
      for (const file of files) {
        const fileName = typeof file === 'string' ? file : file.name;
        
        if (fileName.endsWith('.md')) {
          const filePath = path.join(rulesDir, fileName);
          const content = await fsOps.readFile(filePath, 'utf8');
          const name = path.basename(fileName, '.md');
          
          rules.push({
            name,
            content
          });
        }
      }
    }
    
    return rules;
  }
  
  /**
   * Loads all rules from the workspace
   */
  async loadRules(): Promise<Rule[]> {
    return this.getExistingRules();
  }
  
  /**
   * Deletes a rule from the workspace
   */
  async deleteRule(name: string): Promise<void> {
    const rulePath = path.join(this.getRulesFolderPath(), `${name}.md`);
    await fsOps.unlink(rulePath);
  }
  
  /**
   * Returns the path to the rules folder
   */
  getRulesFolderPath(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error('No workspace folder open');
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    return path.join(rootPath, '.cursor', 'rules');
  }
  
  /**
   * Handles errors by showing an error message
   */
  async handleError(error: Error): Promise<void> {
    vscode.window.showErrorMessage(`Error: ${error.message}`);
  }
} 