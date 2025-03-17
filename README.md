# Cursor Rules Manager

A VSCode extension to quickly create and manage CursorRules for the Cursor AI code editor.

## Features

- Create new CursorRules files from scratch
- Select from community templates organized by category
- Edit existing rule files in your workspace
- Support for both `.cursorrules` file and `.cursor/rules/` directory structure

## What are CursorRules?

CursorRules are custom instructions for the AI assistant in the Cursor editor, guiding its behavior when interpreting code, generating suggestions, and responding to queries. They help you tailor the AI's behavior to match your coding style and project requirements.

There are two types of CursorRules:
1. Global Rules: Set in Cursor Settings
2. Project-Specific Rules: Defined in a `.cursorrules` file or `.cursor/rules/` directory

## Usage

### Creating a New Rule

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Cursor Rules: Create New Rule"
3. Edit the rule in the editor that appears
4. Click "Save Rule" to save it to your workspace

### Selecting from Templates

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Cursor Rules: Select from Templates"
3. Choose a template category (Framework, Language, Style, etc.)
4. Select a specific template
5. Customize it in the editor that appears
6. Click "Save Rule" to save it to your workspace

### Editing Existing Rules

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Cursor Rules: Edit Existing Rule"
3. Select the rule you want to edit
4. Make your changes in the editor
5. Click "Save Rule" to update it

## Extension Settings

This extension contributes the following settings:

* `cursorRules.templateSources`: GitHub repositories to fetch rule templates from
* `cursorRules.useDirectoryStructure`: Use `.cursor/rules` directory structure instead of `.cursorrules` file

## Template Format

Templates use a simple Markdown format with YAML frontmatter:

```md
---
name: Template Name
description: Brief description of the template
category: Template Category
---

# Template Content

Your rule content here...
```

## Contributing

Contributions are welcome! Feel free to submit pull requests with new templates or features.

## License

This extension is licensed under the MIT License. 

## Testing

This extension includes a comprehensive testing setup:

### Running Tests

```bash
# Install dependencies
npm install

# Compile the extension and tests
npm run compile

# Run the tests
npm test
```

### Test Structure

- **Unit tests**: Test individual components in isolation
  - Located in `src/test/unit/`
  - Mock VS Code API and external dependencies

- **Extension tests**: Test the extension in a VS Code environment
  - Located in `src/test/suite/`
  - Run within an actual VS Code instance

### Continuous Integration

Tests automatically run on GitHub Actions when:
- Code is pushed to the main branch
- A pull request is created against the main branch

See the `.github/workflows/tests.yml` file for details. 