import { ChatMessage, SharedToolSession, UserProfile } from '../types';

/**
 * Storage interface contract for server-side persistence.
 * Allows effortless swapping with PostgreSQL, Cloud SQL, SQLite, or Redis.
 */
export interface ServerStorageInterface {
  isUsernameAvailable(username: string): Promise<boolean>;
  registerUserProfile(profile: UserProfile): Promise<boolean>;
  getUserProfile(username: string): Promise<UserProfile | null>;

  getChatMessages(chatId: string): Promise<ChatMessage[]>;
  saveChatMessage(chatId: string, message: ChatMessage): Promise<void>;

  saveCollabSession(session: SharedToolSession): Promise<void>;
  getCollabSession(sessionId: string): Promise<SharedToolSession | null>;
  getCollabSessionByCode(shareCode: string): Promise<SharedToolSession | null>;
  updateCollabSession(
    sessionId: string,
    updater: (current: SharedToolSession) => SharedToolSession
  ): Promise<SharedToolSession | null>;
}

/**
 * Default in-memory implementation of the ServerStorageInterface
 */
export class InMemoryServerStorage implements ServerStorageInterface {
  private users = new Map<string, UserProfile>();
  private messages = new Map<string, ChatMessage[]>();
  private sessions = new Map<string, SharedToolSession>();

  constructor() {
    // Seed standard taken usernames
    this.users.set('sara', { username: 'sara', displayName: 'سارا احمدی', createdAt: '۱۴۰۳/۰۸/۰۱' });
    this.users.set('nima', { username: 'nima', displayName: 'نیما کاظمی', createdAt: '۱۴۰۳/۰۸/۰۲' });
    this.users.set('maryam', { username: 'maryam', displayName: 'مریم حسینی', createdAt: '۱۴۰۳/۰۸/۰۳' });
    this.users.set('ali', { username: 'ali', displayName: 'علی رضایی', createdAt: '۱۴۰۳/۰۸/۰۴' });
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    return !this.users.has(username.trim().toLowerCase());
  }

  async registerUserProfile(profile: UserProfile): Promise<boolean> {
    const key = profile.username.trim().toLowerCase();
    if (this.users.has(key)) return false;
    this.users.set(key, profile);
    return true;
  }

  async getUserProfile(username: string): Promise<UserProfile | null> {
    return this.users.get(username.trim().toLowerCase()) || null;
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    return this.messages.get(chatId) || [];
  }

  async saveChatMessage(chatId: string, message: ChatMessage): Promise<void> {
    const list = this.messages.get(chatId) || [];
    list.push(message);
    this.messages.set(chatId, list);
  }

  async saveCollabSession(session: SharedToolSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async getCollabSession(sessionId: string): Promise<SharedToolSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getCollabSessionByCode(shareCode: string): Promise<SharedToolSession | null> {
    for (const session of this.sessions.values()) {
      if (session.shareCode.toUpperCase() === shareCode.trim().toUpperCase()) {
        return session;
      }
    }
    return null;
  }

  async updateCollabSession(
    sessionId: string,
    updater: (current: SharedToolSession) => SharedToolSession
  ): Promise<SharedToolSession | null> {
    const existing = this.sessions.get(sessionId);
    if (!existing) return null;
    const updated = updater(existing);
    this.sessions.set(sessionId, updated);
    return updated;
  }
}
