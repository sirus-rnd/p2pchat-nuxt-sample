import { MessageType } from './p2p-chat';

export enum ChatAction {
  SendMessage = 'send',
  MessageSent = 'sent',
  MessageFailedToSend = 'failed-to-send',
  ReceiveMessage = 'receive',
  MessageReceived = 'received',
  MessageRead = 'read'
}

export interface ChatActionModel {
  time: Date;
  type: ChatAction;
  payload: any;
}

export interface MessageSendPayload {
  id: string;
  roomID: string;
  senderID: string;
  type: MessageType;
  content: string | ArrayBuffer;
}

export interface MessageSentPayload {
  id: string;
  receiverID: string;
}

export interface MessageFailedToSendPayload {
  id: string;
  errorCode: number;
  errorMessage: string;
}

export interface ReceiveMessagePayload {
  id: string;
  roomID: string;
  senderID: string;
  type: MessageType;
  sentAt: Date;
  content: string | ArrayBuffer;
}

export interface MessageReceivedPayload {
  id: string;
  receivedBy: string;
}

export interface MessageReadPayload {
  id: string;
  readerID: string;
}

export interface ConversationState {
  id: string;
  isReceiver: boolean;
  roomID: string;
  senderID: string;
  sendAt: Date;
  messageType: MessageType;
  messageContent: string | ArrayBuffer;
  receivers?: string[];
  read?: boolean;
  readBy?: string[];
  receivedBy?: string[];
  errorCode?: number;
  errorMessage?: string;
}

export interface IConversationStateManager {
  getPendingConversations(userID: string): Promise<ConversationState[]>;
  getConversations(
    roomID: string,
    limit: number,
    skip: number
  ): Promise<ConversationState[]>;
  getConversation(id: string): Promise<ConversationState>;
  sendMessage(payload: MessageSendPayload): Promise<ConversationState>;
  messageSent(payload: MessageSentPayload): Promise<ConversationState>;
  failedToSend(payload: MessageFailedToSendPayload): Promise<ConversationState>;
  receiveMessage(payload: ReceiveMessagePayload): Promise<ConversationState>;
  messageReceived(payload: MessageReceivedPayload): Promise<ConversationState>;
  messageRead(payload: MessageReadPayload): Promise<ConversationState>;
}
