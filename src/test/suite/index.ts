import * as path from 'path';
import * as fs from 'fs';
import Mocha from 'mocha';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',  // or 'bdd' based on preference
    color: true
  });

  const testsRoot = path.resolve(__dirname, '.');
  const unitTestsRoot = path.resolve(__dirname, '../unit');

  return new Promise<void>((resolve, reject) => {
    // Directly add the test files - we know which ones we have
    mocha.addFile(path.resolve(testsRoot, 'extension.test.js'));
    
    // Add unit tests if the directory exists
    if (fs.existsSync(unitTestsRoot)) {
      try {
        const unitTestFiles = fs.readdirSync(unitTestsRoot);
        for (const file of unitTestFiles) {
          if (file.endsWith('.js')) {
            mocha.addFile(path.join(unitTestsRoot, file));
          }
        }
      } catch (err) {
        console.error('Error loading unit tests:', err);
      }
    }
    
    try {
      // Run the mocha test
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
} 