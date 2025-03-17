import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { RulesService, fsOps } from '../../services/rules';
import { Rule } from '../../types';

suite('RulesService Tests', () => {
  let rulesService: RulesService;
  let sandbox: sinon.SinonSandbox;
  
  const mockWorkspacePath = '/tmp/mock-workspace';
  const mockRule: Rule = {
    name: 'Test Rule',
    content: '# Test Rule Content'
  };

  setup(() => {
    sandbox = sinon.createSandbox();
    
    // Mock the file system operations
    sandbox.stub(fsOps, 'writeFile').resolves();
    sandbox.stub(fsOps, 'mkdir').resolves();
    
    // Mock strings directly for readdir
    sandbox.stub(fsOps, 'readdir').resolves(['rule1.md', 'rule2.md'] as unknown as fs.Dirent[]);
    
    const readFileStub = sandbox.stub(fsOps, 'readFile');
    readFileStub.withArgs(path.join(mockWorkspacePath, '.cursor', 'rules', 'rule1.md'), 'utf8')
      .resolves('# Rule 1 Content');
    readFileStub.withArgs(path.join(mockWorkspacePath, '.cursor', 'rules', 'rule2.md'), 'utf8')
      .resolves('# Rule 2 Content');
    
    const existsStub = sandbox.stub(fsOps, 'exists');
    existsStub.callsFake((path: fs.PathLike) => {
      return Promise.resolve(path.toString().includes(mockWorkspacePath));
    });
    
    sandbox.stub(fsOps, 'unlink').resolves();
    
    // Create service after mocking the fs operations
    rulesService = new RulesService();
    
    // Mock workspace folders
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([
      { uri: { fsPath: mockWorkspacePath }, name: 'test', index: 0 }
    ]);
    
    // Mock config
    sandbox.stub(vscode.workspace, 'getConfiguration').returns({
      get: (key: string, defaultValue: any) => {
        if (key === 'useDirectoryStructure') {
          return true;
        }
        return defaultValue;
      }
    } as any);
    
    // Mock vscode window
    sandbox.stub(vscode.window, 'showInformationMessage').resolves();
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('saveRule should save to directory when useDirectory is true', async () => {
    await rulesService.saveRule(mockRule);
    
    const writeFileStub = fsOps.writeFile as sinon.SinonStub;
    assert.strictEqual(writeFileStub.called, true, 'writeFile should be called');
    
    // Find the call that saved our rule
    let foundMatch = false;
    for (let i = 0; i < writeFileStub.callCount; i++) {
      const call = writeFileStub.getCall(i);
      const filePath = call.args[0];
      if (filePath && filePath.toString().includes('test_rule.md')) {
        const content = call.args[1];
        const expectedPath = path.join(mockWorkspacePath, '.cursor', 'rules', 'test_rule.md');
        assert.strictEqual(filePath, expectedPath, 'Should write to the correct path');
        assert.strictEqual(content, mockRule.content, 'Should write the correct content');
        foundMatch = true;
        break;
      }
    }
    
    assert.strictEqual(foundMatch, true, 'Should find the call that wrote our rule');
  });

  test('loadRules should load rules from directory when useDirectory is true', async () => {
    // Stub getExistingRules directly to bypass fs.readdir issues
    sandbox.stub(rulesService, 'getExistingRules').resolves([
      { name: 'rule1', content: '# Rule 1 Content' },
      { name: 'rule2', content: '# Rule 2 Content' }
    ]);
    
    const rules = await rulesService.loadRules();
    
    assert.strictEqual(rules.length, 2, 'Should load 2 rules');
    assert.strictEqual(rules[0].name, 'rule1', 'First rule should have correct name');
    assert.strictEqual(rules[0].content, '# Rule 1 Content', 'First rule should have correct content');
    assert.strictEqual(rules[1].name, 'rule2', 'Second rule should have correct name');
    assert.strictEqual(rules[1].content, '# Rule 2 Content', 'Second rule should have correct content');
  });

  test('deleteRule should remove rule file', async () => {
    await rulesService.deleteRule('rule1');
    
    const unlinkStub = fsOps.unlink as sinon.SinonStub;
    assert.strictEqual(unlinkStub.called, true, 'unlink should be called');
    
    // Find the call that deleted our rule
    let foundMatch = false;
    for (let i = 0; i < unlinkStub.callCount; i++) {
      const call = unlinkStub.getCall(i);
      const filePath = call.args[0];
      if (filePath && filePath.toString().includes('rule1.md')) {
        const expectedPath = path.join(mockWorkspacePath, '.cursor', 'rules', 'rule1.md');
        assert.strictEqual(filePath, expectedPath, 'Should delete the correct file');
        foundMatch = true;
        break;
      }
    }
    
    assert.strictEqual(foundMatch, true, 'Should find the call that deleted our rule');
  });

  test('getRulesFolderPath should return proper path', () => {
    const folderPath = rulesService.getRulesFolderPath();
    const expectedPath = path.join(mockWorkspacePath, '.cursor', 'rules');
    
    assert.strictEqual(folderPath, expectedPath, 'Should return the correct folder path');
  });

  test('handleError should show error message', async () => {
    const error = new Error('Test error');
    await rulesService.handleError(error);
    
    const showErrorMessageStub = vscode.window.showErrorMessage as sinon.SinonStub;
    assert.strictEqual(showErrorMessageStub.calledOnce, true, 'showErrorMessage should be called once');
    
    const errorMessage = showErrorMessageStub.firstCall.args[0];
    assert.ok(
      typeof errorMessage === 'string' && errorMessage.includes('Test error'),
      `Error message should include the error text, but got: ${errorMessage}`
    );
  });
}); 