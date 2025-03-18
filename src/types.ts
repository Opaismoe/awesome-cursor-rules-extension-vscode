export interface Template {
  name: string;
  description: string;
  category: string;
  content: string;
}

export interface Rule {
  name: string;
  content: string;
}

export interface GitHubDirectory {
  name: string;
  path: string;
  type: string;
  description?: string;
  category?: string;
} 