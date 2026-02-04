/**
 * Frontend types: re-export shared types and add UI-specific types
 */
export {
  UserRole,
  type Product,
  type ServiceProfile,
  type ServiceRequest,
  type ProductCategory,
  type ProfessionType,
  type RequestStatus,
} from '@fixit/shared-types';

import type { ChatMessage as SharedChatMessage } from '@fixit/shared-types';

/** ChatMessage for UI: extends shared type with optional sessionId/timestamp (for local messages) and isThinking */
export interface ChatMessage extends Omit<SharedChatMessage, 'sessionId' | 'timestamp'> {
  sessionId?: string;
  timestamp?: string;
  isThinking?: boolean;
}

export enum View {
  HOME = 'HOME',
  STORE = 'STORE',
  SERVICES = 'SERVICES',
  DASHBOARD = 'DASHBOARD',
  AI_HELPER = 'AI_HELPER',
}
