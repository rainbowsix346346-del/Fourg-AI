import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterCreations,
  appendMessage,
  shareAppWithSelected,
  initialContacts,
  initialGroups,
  initialConversations,
} from './chatService';
import { GeneratedApp } from '../types';

const testApp: GeneratedApp = {
  id: 'test_1',
  title: 'بازی دوز هوشمند',
  description: 'بازی دوز ساده برای دو بازیکن',
  category: 'بازی',
  html: '<div>دوز</div>',
  code: '<div>دوز</div>',
  prompt: 'بازی دوز',
  createdAt: 'امروز',
};

const testApp2: GeneratedApp = {
  id: 'test_2',
  title: 'ماشین‌حساب مینیمال',
  description: 'محاسبات ۴ عمل اصلی',
  category: 'ابزار',
  html: '<div>ماشین حساب</div>',
  code: '<div>ماشین حساب</div>',
  prompt: 'ماشین حساب',
  createdAt: 'دیروز',
};

test('filterCreations filters by category correctly', () => {
  const list = [testApp, testApp2];
  const games = filterCreations(list, '', 'بازی');
  assert.equal(games.length, 1);
  assert.equal(games[0].title, 'بازی دوز هوشمند');

  const tools = filterCreations(list, '', 'ابزار');
  assert.equal(tools.length, 1);
  assert.equal(tools[0].title, 'ماشین‌حساب مینیمال');

  const all = filterCreations(list, '', 'همه');
  assert.equal(all.length, 2);
});

test('filterCreations searches by query string in title and description', () => {
  const list = [testApp, testApp2];
  const queryResult = filterCreations(list, 'ماشین', 'همه');
  assert.equal(queryResult.length, 1);
  assert.equal(queryResult[0].title, 'ماشین‌حساب مینیمال');
});

test('appendMessage adds text message and updates conversation subtitle', () => {
  const updated = appendMessage(initialConversations, 'conv_1', 'سلام تست است');
  const conv1 = updated.find((c) => c.id === 'conv_1');
  assert.ok(conv1);
  assert.equal(conv1.messages.length, 2);
  assert.equal(conv1.messages[1].text, 'سلام تست است');
  assert.equal(conv1.subtitle, 'سلام تست است');
});

test('shareAppWithSelected appends attached app card to target conversations', () => {
  const updated = shareAppWithSelected(
    initialConversations,
    testApp,
    'pv',
    ['c1'],
    initialContacts,
    initialGroups
  );
  const conv1 = updated.find((c) => c.id === 'conv_1' || c.title === 'سارا احمدی');
  assert.ok(conv1);
  const lastMsg = conv1.messages[conv1.messages.length - 1];
  assert.ok(lastMsg.attachedApp);
  assert.equal(lastMsg.attachedApp.title, 'بازی دوز هوشمند');
});
