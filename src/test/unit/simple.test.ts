import * as assert from 'assert';

suite('Simple Unit Tests', () => {
  test('Basic addition', () => {
    assert.strictEqual(1 + 1, 2, 'Math should work');
  });

  test('String concatenation', () => {
    assert.strictEqual('a' + 'b', 'ab', 'String concatenation should work');
  });
}); 