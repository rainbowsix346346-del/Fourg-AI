export type AppTab = 'create' | 'creations' | 'shares' | 'settings';

export type AppTheme = 'auto' | 'light' | 'dark';

export type AppCategory = 'همه' | 'علاقه‌مندی‌ها' | 'بازی' | 'ابزار' | 'برنامه';

export type GeminiModelId = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-carbon';

export interface GeminiModelOption {
  id: GeminiModelId;
  name: string;
  badge: 'سریع' | 'قوی';
  description: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  createdAt: string;
}

export interface GeneratedApp {
  id: string;
  title: string;
  description: string;
  category: 'بازی' | 'ابزار' | 'برنامه' | 'دیگر';
  html: string;
  code: string;
  prompt: string;
  createdAt: string;
  isFavorite?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface AppVersion {
  versionNumber: number;
  prompt: string;
  authorUsername: string;
  authorDisplayName: string;
  timestamp: string;
  html: string;
}

export interface SharedToolSession {
  id: string;
  shareCode: string;
  app: GeneratedApp;
  ownerUsername: string;
  ownerDisplayName: string;
  mode: 'preview' | 'collab';
  collaborators: { username: string; displayName: string }[];
  versions: AppVersion[];
  currentVersion: number;
  createdAt: string;
}

export interface Contact {
  id: string;
  username: string;
  name: string;
  status: string;
}

export interface Group {
  id: string;
  name: string;
  membersCount: number;
  description: string;
}

export interface ChatAttachment {
  type: 'image' | 'video' | 'app';
  data?: string;
  app?: GeneratedApp;
  title?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  senderUsername?: string;
  senderName?: string;
  text?: string;
  attachment?: ChatAttachment;
  attachedApp?: GeneratedApp;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  type: 'pv' | 'group';
  timestamp: string;
  unreadCount?: number;
  messages: ChatMessage[];
  sharedSessionId?: string;
}
