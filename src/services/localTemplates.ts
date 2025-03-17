import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Template } from '../types';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const exists = promisify(fs.exists);

export class LocalTemplateService {
  /**
   * Loads templates from the local templates directory
   */
  async loadLocalTemplates(extensionPath: string): Promise<Template[]> {
    const templatesDir = path.join(extensionPath, 'templates');
    
    if (!await exists(templatesDir)) {
      console.log(`Templates directory not found: ${templatesDir}`);
      return [];
    }
    
    try {
      const files = await readdir(templatesDir);
      const templates: Template[] = [];
      
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.cursorrules')) {
          const filePath = path.join(templatesDir, file);
          const content = await readFile(filePath, 'utf8');
          
          // Extract metadata if available
          let name = path.basename(file, path.extname(file));
          let description = `Template for ${name}`;
          let category = 'Local Templates';
          
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
            content
          });
        }
      }
      
      return templates;
    } catch (error) {
      console.error('Error loading local templates:', error);
      return [];
    }
  }

  /**
   * Gets local templates grouped by category
   */
  async getTemplatesByCategory(extensionPath: string): Promise<Map<string, Template[]>> {
    const templates = await this.loadLocalTemplates(extensionPath);
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