import { Contact, Group, Conversation, ChatMessage, GeneratedApp, AppCategory } from '../types';

export const initialContacts: Contact[] = [
  { id: 'c1', username: 'sara_a', name: 'سارا احمدی', status: 'آنلاین' },
  { id: 'c2', username: 'nima_k', name: 'نیما کاظمی', status: 'آخرین بازدید ۱۰ دقیقه پیش' },
  { id: 'c3', username: 'maryam_h', name: 'مریم حسینی', status: 'آنلاین' },
  { id: 'c4', username: 'ali_r', name: 'علی رضایی', status: 'آخرین بازدید دیروز' },
  { id: 'c5', username: 'mehdi_t', name: 'مهدی تهرانی', status: 'آنلاین' },
];

export const initialGroups: Group[] = [
  { id: 'g1', name: 'تیم توسعه ابزار', membersCount: 14, description: 'تبادل ابزارها و برنامه‌های کاربردی' },
  { id: 'g2', name: 'کانون بازی‌سازان', membersCount: 28, description: 'اشتراک‌گذاری مینی‌گیم‌های هوش مصنوعی' },
  { id: 'g3', name: 'گروه دوستان صمیمی', membersCount: 8, description: 'گروه دوستان و تست بازی‌ها' },
  { id: 'g4', name: 'انجمن کدنویسی فارسی', membersCount: 45, description: 'برنامه‌ها و اسکریپت‌های مستقل وب' },
];

export const initialConversations: Conversation[] = [
  {
    id: 'conv_1',
    title: 'سارا احمدی',
    subtitle: 'سلام! بازی جدیدی ساختی؟',
    type: 'pv',
    timestamp: '۱۰:۲۴',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'other',
        senderName: 'سارا احمدی',
        text: 'سلام! بازی جدیدی ساختی؟',
        timestamp: '۱۰:۲۴',
      },
    ],
  },
  {
    id: 'conv_2',
    title: 'تیم توسعه ابزار',
    subtitle: 'علی: ماشین‌حساب جدید رو براتون فرستادم',
    type: 'group',
    timestamp: 'دیروز',
    messages: [
      {
        id: 'm2',
        sender: 'other',
        senderName: 'علی',
        text: 'ماشین‌حساب جدید رو براتون فرستادم',
        timestamp: 'دیروز',
      },
    ],
  },
  {
    id: 'conv_3',
    title: 'کانون بازی‌سازان',
    subtitle: 'مهدی: نسخه جدید بازی دوز آماده شد',
    type: 'group',
    timestamp: '۲ روز پیش',
    messages: [
      {
        id: 'm3',
        sender: 'other',
        senderName: 'مهدی',
        text: 'نسخه جدید بازی دوز آماده شد',
        timestamp: '۲ روز پیش',
      },
    ],
  },
  {
    id: 'conv_4',
    title: 'نیما کاظمی',
    subtitle: 'کارت ابزار شمارنده رو دیدم، عالیه',
    type: 'pv',
    timestamp: '۳ روز پیش',
    messages: [
      {
        id: 'm4',
        sender: 'other',
        senderName: 'نیما کاظمی',
        text: 'کارت ابزار شمارنده رو دیدم، عالیه',
        timestamp: '۳ روز پیش',
      },
    ],
  },
];

/**
 * Filter creations based on search query and category
 */
export function filterCreations(
  creations: GeneratedApp[],
  query: string,
  category: AppCategory
): GeneratedApp[] {
  const cleanQuery = query.trim().toLowerCase();
  return creations.filter((app) => {
    const matchesCategory =
      category === 'همه'
        ? true
        : category === 'علاقه‌مندی‌ها'
        ? Boolean(app.isFavorite)
        : app.category === category;
    const matchesQuery =
      !cleanQuery ||
      app.title.toLowerCase().includes(cleanQuery) ||
      app.description.toLowerCase().includes(cleanQuery);
    return matchesCategory && matchesQuery;
  });
}

/**
 * Helper to add a message to a conversation
 */
export function appendMessage(
  conversations: Conversation[],
  conversationId: string,
  text?: string,
  attachedApp?: GeneratedApp
): Conversation[] {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const newMessage: ChatMessage = {
    id: 'msg_' + Date.now(),
    sender: 'user',
    text: text || undefined,
    attachedApp,
    timestamp: timeStr,
  };

  const previewSnippet = attachedApp ? `کارت: ${attachedApp.title}` : (text || '');

  return conversations.map((conv) => {
    if (conv.id === conversationId) {
      return {
        ...conv,
        subtitle: previewSnippet,
        timestamp: timeStr,
        messages: [...conv.messages, newMessage],
      };
    }
    return conv;
  });
}

/**
 * Helper to share an app with selected contacts or groups
 */
export function shareAppWithSelected(
  conversations: Conversation[],
  app: GeneratedApp,
  type: 'pv' | 'group',
  targetIds: string[],
  contactsList: Contact[],
  groupsList: Group[]
): Conversation[] {
  let updatedConversations = [...conversations];

  targetIds.forEach((targetId) => {
    // Find or create conversation for this target
    let targetConv = updatedConversations.find(
      (c) => c.type === type && (c.id === `conv_${targetId}` || c.title === (type === 'pv' ? contactsList.find(x => x.id === targetId)?.name : groupsList.find(x => x.id === targetId)?.name))
    );

    if (!targetConv) {
      const name = type === 'pv'
        ? contactsList.find((x) => x.id === targetId)?.name || 'مخاطب'
        : groupsList.find((x) => x.id === targetId)?.name || 'گروه';

      targetConv = {
        id: `conv_${targetId}`,
        title: name,
        subtitle: `کارت: ${app.title}`,
        type,
        timestamp: 'الان',
        messages: [],
      };
      updatedConversations = [targetConv, ...updatedConversations];
    }

    updatedConversations = appendMessage(updatedConversations, targetConv.id, undefined, app);
  });

  return updatedConversations;
}
