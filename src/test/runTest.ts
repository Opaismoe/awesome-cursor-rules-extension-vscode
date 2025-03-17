import * as path from 'path';
import * as os from 'os';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    
    // The path to the extension test script
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    
    // Use a shorter temp directory for user data to avoid socket path length issues
    const tmpDir = path.join(os.tmpdir(), 'vscode-test-workspace');
    
    // Download VS Code, unzip it and run the integration test
    await runTests({ 
      extensionDevelopmentPath, 
      extensionTestsPath,
      // Use a shorter path for user data
      launchArgs: [
        '--user-data-dir', tmpDir
      ]
    });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

main(); 