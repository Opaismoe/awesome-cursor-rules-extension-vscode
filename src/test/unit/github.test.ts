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
  
  test('fetchTemplates should correctly parse repository path with tree/main/rules', async () => {
    // Setup the first API response (repository contents)
    const contentsResponse = {
      data: [
        {
          type: 'file',
          name: 'example.cursorrules',
          download_url: 'https://raw.githubusercontent.com/user/repo/main/rules/example.cursorrules'
        }
      ]
    };
    
    // Setup the second API response (file content)
    const contentResponse = {
      data: 'name: Example Rule\ndescription: Example rule description\ncategory: Testing\n\nRule content here'
    };
    
    // Configure the stub to return different responses based on the URL
    axiosGetStub.withArgs('https://api.github.com/repos/PatrickJS/awesome-cursorrules/contents/rules')
      .resolves(contentsResponse);
    axiosGetStub.withArgs('https://raw.githubusercontent.com/user/repo/main/rules/example.cursorrules')
      .resolves(contentResponse);
      
    // Test with the specific repository path
    const templates = await githubService.fetchTemplates('https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules');
    
    // Assertions
    assert.strictEqual(templates.length, 1, 'Should return one template');
    assert.strictEqual(templates[0].name, 'Example Rule', 'Should extract correct name');
    assert.strictEqual(templates[0].description, 'Example rule description', 'Should extract correct description');
    assert.strictEqual(templates[0].category, 'Testing', 'Should extract correct category');
    assert.strictEqual(templates[0].content, contentResponse.data, 'Should have correct content');
    
    // Verify that axios.get was called with the correct URL including the path
    assert.ok(axiosGetStub.calledWith('https://api.github.com/repos/PatrickJS/awesome-cursorrules/contents/rules'),
      'Should call GitHub API with the correct path');
  });
  
  test('getTemplatesByCategory should organize templates by category', async () => {
    // Stub fetchTemplates to return predefined templates
    const templates: Template[] = [
      {
        name: 'Template1',
        description: 'Description1',
        category: 'Category1',
        content: 'Content1'
      },
      {
        name: 'Template2',
        description: 'Description2',
        category: 'Category2',
        content: 'Content2'
      },
      {
        name: 'Template3',
        description: 'Description3',
        category: 'Category1',
        content: 'Content3'
      }
    ];
    
    sinon.stub(githubService, 'fetchTemplates').resolves(templates);
    
    // Call the method
    const categorized = await githubService.getTemplatesByCategory('https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules');
    
    // Assertions
    assert.ok(categorized.has('Category1'), 'Should have Category1');
    assert.ok(categorized.has('Category2'), 'Should have Category2');
    assert.strictEqual(categorized.get('Category1')!.length, 2, 'Category1 should have 2 templates');
    assert.strictEqual(categorized.get('Category2')!.length, 1, 'Category2 should have 1 template');
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
    
    // Configure stubs
    axiosGetStub.withArgs('https://api.github.com/repos/PatrickJS/awesome-cursorrules/contents/rules/react-template-dir')
      .resolves(dirContentsResponse);
    axiosGetStub.withArgs('https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/react-template-dir/README.md')
      .resolves(fileContentResponse);
    
    // Call the method
    const directory = {
      name: 'react-template-dir',
      path: 'rules/react-template-dir',
      type: 'dir'
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
}); 