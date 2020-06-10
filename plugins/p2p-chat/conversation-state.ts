import { schema, Type, Database, Order } from 'lovefield';
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
  participants: string[];
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
  messageText?: string;
  messageBinary?: ArrayBuffer;
  receivers?: string[];
  read?: boolean;
  readBy?: string[];
  receivedBy?: string[];
  errorCode?: number;
  errorMessage?: string;
}

export interface PendingConversation {
  id: string;
  conversationId: string;
  receiverId: string;
}

export interface PendingConversationPayload {
  conversationId: string;
  receiverId: string;
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
  addPendingConversation(payload: PendingConversationPayload): Promise<void>;
  failedToSend(payload: MessageFailedToSendPayload): Promise<ConversationState>;
  receiveMessage(payload: ReceiveMessagePayload): Promise<ConversationState>;
  readMessage(payload: MessageReadPayload): Promise<ConversationState>;
  messageReceived(payload: MessageReceivedPayload): Promise<ConversationState>;
  messageRead(payload: MessageReadPayload): Promise<ConversationState>;
}

export class ConversationManager implements IConversationStateManager {
  private db: Database;

  async init() {
    this.db = await this.connect();
  }

  private connect(): Promise<Database> {
    const builder = schema.create('chat', 1);
    builder
      .createTable('conversations')
      .addColumn('id', Type.STRING)
      .addColumn('isReceiver', Type.BOOLEAN)
      .addColumn('roomID', Type.STRING)
      .addColumn('senderID', Type.STRING)
      .addColumn('sendAt', Type.DATE_TIME)
      .addColumn('messageType', Type.INTEGER)
      .addColumn('messageText', Type.STRING)
      .addColumn('messageBinary', Type.ARRAY_BUFFER)
      .addColumn('receivers', Type.OBJECT)
      .addColumn('read', Type.BOOLEAN)
      .addColumn('readBy', Type.OBJECT)
      .addColumn('receivedBy', Type.OBJECT)
      .addColumn('errorCode', Type.NUMBER)
      .addColumn('errorMessage', Type.STRING)
      .addPrimaryKey(['id'])
      .addIndex('idxSendAt', ['sendAt'], false, Order.DESC)
      .addNullable([
        'messageText',
        'messageBinary',
        'receivers',
        'read',
        'readBy',
        'receivedBy',
        'errorCode',
        'errorMessage'
      ]);

    builder
      .createTable('action')
      .addColumn('time', Type.DATE_TIME)
      .addColumn('type', Type.STRING)
      .addColumn('payload', Type.OBJECT)
      .addIndex('idxTime', ['time'], false, Order.DESC);

    builder
      .createTable('pendingConversation')
      .addColumn('id', Type.STRING)
      .addColumn('conversationId', Type.STRING)
      .addColumn('receiverId', Type.STRING)
      .addPrimaryKey(['id']);

    // connect to database
    return builder.connect();
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }

  async getPendingConversations(userID: string): Promise<ConversationState[]> {
    const pendingTable = this.db.getSchema().table('pendingConversation');
    const pendings = await this.db
      .select()
      .from(pendingTable)
      .where(pendingTable.receiverId.eq(userID))
      .exec();

    const pendingIds = pendings.map(
      (pending: PendingConversation) => pending.conversationId
    );

    // get all conversation
    const convTable = this.db.getSchema().table('conversations');
    const results = await this.db
      .select()
      .from(convTable)
      .where(convTable.id.in(pendingIds))
      .orderBy(convTable.sendAt, Order.DESC)
      .exec();
    return results as ConversationState[];
  }

  async addPendingConversation(payload: PendingConversationPayload) {
    const pendingTable = this.db.getSchema().table('pendingConversation');
    const row = pendingTable.createRow({
      id: `${payload.conversationId}-${payload.receiverId}`,
      receiverId: payload.receiverId,
      conversationId: payload.conversationId
    } as PendingConversation);
    await this.db
      .insertOrReplace()
      .into(pendingTable)
      .values([row])
      .exec();
    return null;
  }

  async getConversations(
    roomID: string,
    limit: number,
    skip: number
  ): Promise<ConversationState[]> {
    const convTable = this.db.getSchema().table('conversations');
    const results = await this.db
      .select()
      .from(convTable)
      .where(convTable.roomID.eq(roomID))
      .orderBy(convTable.sendAt, Order.DESC)
      .skip(skip)
      .limit(limit)
      .exec();
    return results as ConversationState[];
  }

  async getConversation(id: string): Promise<ConversationState> {
    const convTable = this.db.getSchema().table('conversations');
    const results = await this.db
      .select()
      .where(convTable.id.eq(id))
      .limit(1)
      .exec();
    if (results.length > 0) {
      return results[0] as ConversationState;
    }
    return null;
  }

  async sendMessage(payload: MessageSendPayload): Promise<ConversationState> {
    const convTable = this.db.getSchema().table('conversations');
    const convState = {
      id: payload.id,
      isReceiver: false,
      roomID: payload.roomID,
      senderID: payload.senderID,
      sendAt: new Date(),
      messageType: payload.type,
      receivers: payload.participants,
      receivedBy: [],
      readBy: []
    } as ConversationState;
    switch (payload.type) {
      case MessageType.FILE:
      case MessageType.IMAGE:
        convState.messageBinary = payload.content as ArrayBuffer;
        break;
      case MessageType.MESSAGE:
        convState.messageText = payload.content as string;
    }
    const row = convTable.createRow(convState);
    const results = await this.db
      .insertOrReplace()
      .into(convTable)
      .values([row])
      .exec();
    if (results.length > 0) {
      return results[0] as ConversationState;
    }
    return null;
  }

  async failedToSend(
    payload: MessageFailedToSendPayload
  ): Promise<ConversationState> {
    const convTable = this.db.getSchema().table('conversations');
    const results = await this.db
      .update(convTable)
      .set(convTable.errorCode, payload.errorCode)
      .set(convTable.errorMessage, payload.errorMessage)
      .where(convTable.id.eq(payload.id))
      .exec();
    if (results.length > 0) {
      return results[0] as ConversationState;
    }
    return null;
  }

  async receiveMessage(
    payload: ReceiveMessagePayload
  ): Promise<ConversationState> {
    const convTable = this.db.getSchema().table('conversations');
    const convState = {
      id: payload.id,
      isReceiver: true,
      roomID: payload.roomID,
      senderID: payload.senderID,
      sendAt: payload.sentAt,
      messageType: payload.type
    } as ConversationState;
    switch (payload.type) {
      case MessageType.FILE:
      case MessageType.IMAGE:
        convState.messageBinary = payload.content as ArrayBuffer;
        break;
      case MessageType.MESSAGE:
        convState.messageText = payload.content as string;
    }
    const row = convTable.createRow(convState);
    const results = await this.db
      .insertOrReplace()
      .into(convTable)
      .values([row])
      .exec();
    if (results.length > 0) {
      return results[0] as ConversationState;
    }
    return null;
  }

  async readMessage(payload: MessageReadPayload): Promise<ConversationState> {
    const convTable = this.db.getSchema().table('conversations');
    const results = await this.db
      .update(convTable)
      .set(convTable.read, true)
      .where(convTable.id.eq(payload.id))
      .exec();
    if (results.length > 0) {
      return results[0] as ConversationState;
    }
    return null;
  }

  async messageReceived(
    payload: MessageReceivedPayload
  ): Promise<ConversationState> {
    const convTable = this.db.getSchema().table('conversations');
    const convState = await this.getConversation(payload.id);
    const receivedBy = convState.receivedBy || [];
    receivedBy.push(payload.receivedBy);
    const results = await this.db
      .update(convTable)
      .set(convTable.receivedBy, receivedBy)
      .where(convTable.id.eq(payload.id))
      .exec();
    if (results.length > 0) {
      return results[0] as ConversationState;
    }
    return null;
  }

  async messageRead(payload: MessageReadPayload): Promise<ConversationState> {
    const convTable = this.db.getSchema().table('conversations');
    const convState = await this.getConversation(payload.id);
    const readBy = convState.readBy || [];
    readBy.push(payload.readerID);
    const results = await this.db
      .update(convTable)
      .set(convTable.readBy, readBy)
      .where(convTable.id.eq(payload.id))
      .exec();
    if (results.length > 0) {
      return results[0] as ConversationState;
    }
    return null;
  }
}
