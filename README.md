# Awesome Cursor Rules Extension

[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-lightgrey.svg)](http://creativecommons.org/publicdomain/zero/1.0/)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue.svg)](https://marketplace.visualstudio.com/items?itemName=Opaismoe.awesome-cursor-rules)

A VS Code extension for managing Cursor Rules with seamless integration with the [Awesome Cursor Rules](https://github.com/PatrickJS/awesome-cursorrules) repository.

## Features

- 🚀 **Fast Template Selection**: Quickly browse and select from curated Cursor Rules templates
- 📝 **Create New Rules**: Create custom Cursor Rules with an intuitive interface
- 🔄 **Edit Existing Rules**: Easily modify your existing rules
- 🌐 **GitHub Integration**: Direct access to the Awesome Cursor Rules repository
- 💾 **Local Storage**: Store rules locally in `.cursor/rules` directory

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Awesome Cursor Rules"
4. Click Install

## Commands

The extension provides the following commands:

- `ACR: Create New Rule` - Create a new Cursor Rule from scratch
- `ACR: Select from Templates` - Choose from local templates
- `ACR: Edit Existing Rule` - Modify an existing rule
- `ACR: Select from Awesome Cursor Rules Repository` - Browse and select from the official repository

## Configuration

The extension can be configured through VS Code settings:

```json
{
  "cursorRules.templateSources": [
    "https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules"
  ],
  "cursorRules.useDirectoryStructure": true,
  "cursorRules.githubToken": ""
}
```

- `templateSources`: GitHub repositories to fetch rule templates from
- `useDirectoryStructure`: Use `.cursor/rules` directory structure (recommended)
- `githubToken`: GitHub personal access token for increased API rate limits

## GitHub Token Setup

To avoid API rate limits, you can add a GitHub personal access token:

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token with `repo` scope
3. Copy the token
4. Add it to VS Code settings under `cursorRules.githubToken`

## Usage

1. **Creating a New Rule**:
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Type "ACR: Create New Rule"
   - Follow the prompts to create your rule

2. **Using Templates**:
   - Open Command Palette
   - Type "ACR: Select from Templates"
   - Choose a template to use as a starting point

3. **Browsing Awesome Cursor Rules**:
   - Open Command Palette
   - Type "ACR: Select from Awesome Cursor Rules Repository"
   - Browse and select from available templates

4. **Editing Rules**:
   - Open Command Palette
   - Type "ACR: Edit Existing Rule"
   - Select the rule you want to modify

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development

To set up the development environment:

```bash
# Clone the repository
git clone https://github.com/Opaismoe/awesome-cursor-rules-extension-vscode.git
cd awesome-cursor-rules-extension-vscode

# Install dependencies
npm install

# Compile
npm run compile

# Watch for changes
npm run watch
```

## License

This project is licensed under the CC0-1.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Awesome Cursor Rules Repository](https://github.com/PatrickJS/awesome-cursorrules) for providing the template collection
- All contributors who have helped to build and maintain this extension 