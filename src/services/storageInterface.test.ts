import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryServerStorage } from './storageInterface';
import { SharedToolSession } from '../types';

test('InMemoryServerStorage handles user registration and username availability', async () => {
  const storage = new InMemoryServerStorage();
  assert.equal(await storage.isUsernameAvailable('sara_test'), true);

  await storage.registerUserProfile({
    username: 'sara_test',
    displayName: 'سارا تستی',
    createdAt: 'امروز',
  });

  assert.equal(await storage.isUsernameAvailable('sara_test'), false);
  assert.equal(await storage.isUsernameAvailable('SARA_TEST'), false);
});

test('InMemoryServerStorage saves and retrieves chat messages', async () => {
  const storage = new InMemoryServerStorage();
  const msg1 = {
    id: 'm1',
    sender: 'user' as const,
    text: 'سلام پیام ۱',
    timestamp: '۱۰:۰۰',
  };
  await storage.saveChatMessage('chat_1', msg1);

  const list = await storage.getChatMessages('chat_1');
  assert.equal(list.length, 1);
  assert.equal(list[0].text, 'سلام پیام ۱');
});

test('InMemoryServerStorage saves and retrieves collab session by id and code', async () => {
  const storage = new InMemoryServerStorage();
  const session: SharedToolSession = {
    id: 'collab_123',
    shareCode: 'APP-9988',
    app: {
      id: 'app_1',
      title: 'بازی تست',
      description: 'توضیح تست',
      category: 'بازی',
      html: '<h1>بازی</h1>',
      code: '<h1>بازی</h1>',
      prompt: 'بازی',
      createdAt: 'امروز',
      orientation: 'portrait',
    },
    ownerUsername: 'owner_dev',
    ownerDisplayName: 'توسعه دهنده',
    mode: 'collab',
    collaborators: [{ username: 'collab_user', displayName: 'همکار' }],
    versions: [
      {
        versionNumber: 1,
        prompt: 'نسخه ۱',
        authorUsername: 'owner_dev',
        authorDisplayName: 'توسعه دهنده',
        timestamp: 'الان',
        html: '<h1>نسخه ۱</h1>',
      },
    ],
    currentVersion: 1,
    createdAt: 'امروز',
  };

  await storage.saveCollabSession(session);

  const byId = await storage.getCollabSession('collab_123');
  assert.ok(byId);
  assert.equal(byId.shareCode, 'APP-9988');

  const byCode = await storage.getCollabSessionByCode('APP-9988');
  assert.ok(byCode);
  assert.equal(byCode.id, 'collab_123');
});
