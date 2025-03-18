import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Bundle Tests', () => {
    test('Webpack bundle exists and is not empty', async () => {
        const bundlePath = path.join(__dirname, '../../../dist/extension.js');
        assert.strictEqual(fs.existsSync(bundlePath), true, 'Bundle file should exist');
        
        const stats = fs.statSync(bundlePath);
        assert.ok(stats.size > 0, 'Bundle should not be empty');
    });

    test('Unnecessary files are excluded', () => {
        const vscodeignorePath = path.join(__dirname, '../../../.vscodeignore');
        assert.strictEqual(fs.existsSync(vscodeignorePath), true, '.vscodeignore should exist');
        
        const vscodeignoreContent = fs.readFileSync(vscodeignorePath, 'utf8');
        const requiredPatterns = [
            'src/**',
            'out/test/**',
            'node_modules/**',
            '.vscode-test/**'
        ];
        
        for (const pattern of requiredPatterns) {
            assert.ok(
                vscodeignoreContent.includes(pattern),
                `${pattern} should be in .vscodeignore`
            );
        }
    });

    test('Webpack config is properly configured', () => {
        const webpackConfigPath = path.join(__dirname, '../../../webpack.config.js');
        assert.strictEqual(fs.existsSync(webpackConfigPath), true, 'webpack.config.js should exist');
        
        const config = require(webpackConfigPath);
        assert.strictEqual(config.target, 'node', 'Target should be node');
        assert.strictEqual(config.output.libraryTarget, 'commonjs2', 'Library target should be commonjs2');
        assert.ok(config.externals.vscode, 'VSCode should be external');
    });
}); 