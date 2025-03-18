import * as assert from 'assert';
import * as sinon from 'sinon';
import axios from 'axios';
import { GithubService } from '../../services/github';
import { Template } from '../../types';

suite('GitHub Service Tests', () => {
  let githubService: GithubService;
  let axiosGetStub: sinon.SinonStub;
  
  setup(() => {
    githubService = new GithubService();
    // Stub axios.get to prevent actual API calls
    axiosGetStub = sinon.stub(axios, 'get');
  });
  
  teardown(() => {
    // Restore the original axios.get
    axiosGetStub.restore();
  });
  
  test('parseRepoUrl should correctly parse repository path with tree/main/rules', async () => {
    // We now test the parseRepoUrl method directly with reflection since it's private
    const parseRepoUrl = (githubService as any).parseRepoUrl.bind(githubService);
    
    const result = parseRepoUrl('https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules');
    
    // Assertions
    assert.strictEqual(result.owner, 'PatrickJS', 'Should extract correct owner');
    assert.strictEqual(result.repoName, 'awesome-cursorrules', 'Should extract correct repo name');
    assert.strictEqual(result.path, 'rules', 'Should extract correct path');
  });
  
  test('parseRepoUrl should handle invalid inputs', async () => {
    // We test the parseRepoUrl method for security handling
    const parseRepoUrl = (githubService as any).parseRepoUrl.bind(githubService);
    
    // Test invalid URL
    try {
      parseRepoUrl('not-a-url');
      assert.fail('Should have thrown an error for invalid URL');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok((error as Error).message.includes('URL must be a valid GitHub repository URL'));
    }
    
    // Test empty input
    try {
      parseRepoUrl('');
      assert.fail('Should have thrown an error for empty input');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok((error as Error).message.includes('Invalid repository URL'));
    }
  });
  
  test('fetchDirectories should return a list of directories without fetching content', async () => {
    // Setup the API response for repository directory listing
    const dirListResponse = {
      data: [
        {
          type: 'dir',
          name: 'react-template-dir',
          path: 'rules/react-template-dir'
        },
        {
          type: 'dir',
          name: 'angular-template-dir',
          path: 'rules/angular-template-dir'
        },
        {
          type: 'file',
          name: 'README.md',
          path: 'rules/README.md'
        }
      ]
    };
    
    // Configure the stub to return the directory listing
    axiosGetStub.withArgs('https://api.github.com/repos/PatrickJS/awesome-cursorrules/contents/rules')
      .resolves(dirListResponse);
    
    // Call the method
    const directories = await githubService.fetchDirectories('https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules');
    
    // Assertions
    assert.strictEqual(directories.length, 2, 'Should return only directories');
    assert.strictEqual(directories[0].name, 'react-template-dir', 'Should have correct directory name');
    assert.strictEqual(directories[1].name, 'angular-template-dir', 'Should have correct directory name');
    
    // Verify that axios.get was called once with the correct URL
    assert.strictEqual(axiosGetStub.callCount, 1, 'Should make only one API call');
    assert.ok(axiosGetStub.calledWith('https://api.github.com/repos/PatrickJS/awesome-cursorrules/contents/rules'),
      'Should call GitHub API with the correct path');
  });
  
  test('fetchDirectories should handle invalid inputs', async () => {
    // Test with invalid input
    const directories = await githubService.fetchDirectories('');
    assert.strictEqual(directories.length, 0, 'Should return empty array for invalid input');
  });
  
  test('fetchDirectories should handle API errors', async () => {
    // Setup the axios error
    axiosGetStub.rejects(new Error('API error'));
    
    // Call the method
    const directories = await githubService.fetchDirectories('https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules');
    
    // Should handle error and return empty array
    assert.strictEqual(directories.length, 0, 'Should return empty array on error');
  });
  
  test('fetchRuleFromDirectory should fetch the content of a specific rule', async () => {
    // Setup the API response for directory contents
    const dirContentsResponse = {
      data: [
        {
          type: 'file',
          name: 'README.md',
          path: 'rules/react-template-dir/README.md',
          download_url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/react-template-dir/README.md'
        }
      ]
    };
    
    // Setup the response for file content
    const fileContentResponse = {
      data: 'name: React Template\ndescription: Template for React apps\ncategory: Frontend\n\nTemplate content here'
    };
    
    // Configure stubs - ensure we're using encoded URLs to match our implementation changes
    axiosGetStub.withArgs('https://api.github.com/repos/PatrickJS/awesome-cursorrules/contents/rules%2Freact-template-dir')
      .resolves(dirContentsResponse);
    axiosGetStub.withArgs('https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/react-template-dir/README.md')
      .resolves(fileContentResponse);
    
    // Call the method
    const directory = {
      name: 'react-template-dir',
      path: 'rules/react-template-dir',
      type: 'dir',
      description: 'React templates',
      category: 'Frontend'
    };
    
    const template = await githubService.fetchRuleFromDirectory(
      'https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules',
      directory
    );
    
    // Assertions
    assert.ok(template, 'Should return a template');
    assert.strictEqual(template.name, 'React Template', 'Should have correct name from content');
    assert.strictEqual(template.category, 'Frontend', 'Should have correct category from content');
    assert.strictEqual(template.content, fileContentResponse.data, 'Should have correct content');
  });
  
  test('fetchRuleFromDirectory should handle invalid inputs', async () => {
    // Test with invalid directory
    const template = await githubService.fetchRuleFromDirectory('https://github.com/user/repo', null as any);
    assert.strictEqual(template, undefined, 'Should return undefined for invalid directory');
  });
  
  test('fetchRuleFromDirectory should handle API errors', async () => {
    // Setup the axios error
    axiosGetStub.rejects(new Error('API error'));
    
    // Call the method with valid inputs
    const directory = {
      name: 'template-dir',
      path: 'rules/template-dir',
      type: 'dir'
    };
    
    const template = await githubService.fetchRuleFromDirectory(
      'https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules',
      directory
    );
    
    // Should handle error and return undefined
    assert.strictEqual(template, undefined, 'Should return undefined on error');
  });
}); 