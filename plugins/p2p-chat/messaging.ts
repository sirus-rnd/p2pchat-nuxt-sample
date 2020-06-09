import { MessageType } from './p2p-chat';

export enum MessagingType {
  MessageNew = 'message:new',
  Typing = 'user:typing',
  MessageReceived = 'message:received',
  MessageRead = 'message:read'
}

export interface NewMessagePayload {
  id: string;
  roomID: string;
  sendAt: Date;
  messageType: MessageType;
  messageContent: string | ArrayBuffer;
}

export interface TypingPayload {
  roomID: string;
}

export interface MessageReadPayload {
  id: string;
}

export interface MessageReceivedPayload {
  id: string;
}

export interface MessagingProtocol {
  type: MessagingType;
  payload:
    | NewMessagePayload
    | TypingPayload
    | MessageReadPayload
    | MessageReceivedPayload;
}
