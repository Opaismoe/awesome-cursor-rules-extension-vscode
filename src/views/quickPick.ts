import * as vscode from 'vscode';
import { Template, Rule } from '../types';

/**
 * Shows a QuickPick to select a rule
 */
export async function showRuleQuickPick(rules: Rule[]): Promise<Rule | undefined> {
  if (rules.length === 0) {
    vscode.window.showInformationMessage('No rules found');
    return undefined;
  }

  const selected = await vscode.window.showQuickPick(
    rules.map(rule => ({
      label: rule.name,
      detail: rule.content.substring(0, 100) + (rule.content.length > 100 ? '...' : ''),
      rule
    })),
    {
      placeHolder: 'Select a rule to edit',
      matchOnDetail: true
    }
  );

  return selected?.rule;
}

/**
 * Shows a QuickPick to select a template category
 */
export async function showCategoryQuickPick(
  categories: string[]
): Promise<string | undefined> {
  const selected = await vscode.window.showQuickPick(
    categories.map(category => ({
      label: category
    })),
    {
      placeHolder: 'Select a template category'
    }
  );

  return selected?.label;
}

/**
 * Shows a QuickPick to select a template
 */
export async function showTemplateQuickPick(
  templates: Template[]
): Promise<Template | undefined> {
  if (templates.length === 0) {
    vscode.window.showInformationMessage('No templates found');
    return undefined;
  }

  const selected = await vscode.window.showQuickPick(
    templates.map(template => ({
      label: template.name,
      description: template.category,
      detail: template.description,
      template
    })),
    {
      placeHolder: 'Select a template',
      matchOnDetail: true
    }
  );

  return selected?.template;
} 