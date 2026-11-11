import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCircleProgress, generateAppFromPrompt } from './aiBuilder';

test('calculateCircleProgress calculates stroke-dashoffset accurately', () => {
  const atZero = calculateCircleProgress(0, 50);
  assert.equal(Math.round(atZero.strokeDashoffset), Math.round(2 * Math.PI * 50));

  const atHundred = calculateCircleProgress(100, 50);
  assert.equal(Math.round(atHundred.strokeDashoffset), 0);

  const atFifty = calculateCircleProgress(50, 50);
  assert.equal(Math.round(atFifty.strokeDashoffset), Math.round(Math.PI * 50));
});

test('generateAppFromPrompt executes and calls progress callback to 100', async () => {
  let maxPercent = 0;
  const result = await generateAppFromPrompt('یک بازی دوز کوچک', (p) => {
    if (p > maxPercent) maxPercent = p;
  });

  assert.equal(maxPercent, 100);
  assert.equal(result.category, 'بازی');
  assert.ok(result.id.startsWith('app_'));
  assert.ok(result.html.includes('بازی'));
  assert.ok(result.title.length > 0);
  assert.ok(result.description.length > 0);
});
