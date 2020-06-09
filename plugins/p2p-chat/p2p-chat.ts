import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  photo: string;
  online: boolean;
}

export interface Room {
  id: string;
  name: string;
  photo: string;
  description: string;
  participants: User[];
}

export interface Conversation {
  id: string;
  roomID: string;
  sendAt: Date;
  message: Message;
  status: ConversationStatus;
  sender: User;
}

export interface Message {
  type: MessageType;
  content: string | ArrayBuffer;
}

export enum ConversationStatus {
  SENT,
  RECEIVED,
  READ,
  FAILED
}

export enum MessageType {
  MESSAGE,
  FILE,
  IMAGE
}

export interface UserInRoomEventPayload {
  roomID: string;
  user: User;
}

export interface IChatClient {
  authenticated(): Promise<boolean>;
  connect(token: string): Promise<User>;
  disconnect(): Promise<void>;
  myProfile(): Promise<User>;
  getRooms(): Promise<Room[]>;
  getConversations(
    roomID: string,
    skip: number,
    limit: number
  ): Promise<Conversation[]>;
  sendMessage(roomID: string, message: Message): Promise<Conversation>;
  readMessage(roomID: string, messageID: string): Promise<Conversation>;
  typing(roomID: string): Promise<void>;
  onUserConnected: Observable<string>; // user id
  onUserDisconnected: Observable<string>; // user id
  onMessageReceived: Observable<Conversation>;
  onMessageRead: Observable<Conversation>;
  onReceiveMessage: Observable<Conversation>;
  onUserTyping: Observable<UserInRoomEventPayload>;
  onRoomCreated: Observable<Room>;
  onRoomUpdated: Observable<Room>;
  onRoomDestroyed: Observable<Room>;
  onUserJoinRoom: Observable<UserInRoomEventPayload>;
  onUserLeftRoom: Observable<UserInRoomEventPayload>;
  onUserProfileUpdated: Observable<User>;
  onUserRemoved: Observable<User>;
}