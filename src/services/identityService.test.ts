import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitialUsername, validateProfile } from './identityService';

test('getInitialUsername returns empty string', () => {
  assert.equal(getInitialUsername(), '');
});

test('validateProfile requires display name', () => {
  const result = validateProfile('valid_user', '');
  assert.equal(result.valid, false);
  assert.ok(result.error?.includes('اسم'));
});

test('validateProfile requires username', () => {
  const result = validateProfile('', 'نام من');
  assert.equal(result.valid, false);
  assert.ok(result.error?.includes('یوزرنیم'));
});

test('validateProfile enforces minimum length of 3', () => {
  const result = validateProfile('ab', 'نام من');
  assert.equal(result.valid, false);
  assert.ok(result.error?.includes('۳'));
});

test('validateProfile rejects invalid characters in username', () => {
  const result = validateProfile('invalid user!', 'نام من');
  assert.equal(result.valid, false);
});

test('validateProfile accepts valid english username and persian display name', () => {
  const result = validateProfile('sara_dev99', 'سارا احمدی');
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});
