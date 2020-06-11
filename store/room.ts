import { MutationTree, ActionTree } from 'vuex/types/index';
import { v4 as uuid } from 'uuid';
import { RootState } from './index';
import { ConversationStatus, MessageType } from '~/plugins/p2p-chat/p2p-chat';

export interface Room {
  id: string;
  name: string;
  photo: string;
  description: string;
  lastConversation: string;
  typings: string[];
}

export interface RoomProfile {
  id: string;
  name: string;
  photo: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  photo: string;
  online: boolean;
}

export interface Conversation {
  id: string;
  receive: boolean;
  message: string;
  sentAt: Date;
  read?: boolean;
  received?: boolean;
  failed?: boolean;
}

export interface SentMessage {
  id: string;
  message: string;
  sentAt: Date;
}

export interface SentConversation {
  tempId: string;
  conversation: Conversation;
}

export interface Participant {
  userID: string;
  roomID: string;
}

export interface RoomState {
  loadingRoom: boolean;
  error: Error;
  rooms: Room[];
  activeRoom: Room;
  loadingConversation: boolean;
  conversations: Conversation[];
}

export function state(): RoomState {
  return {
    loadingRoom: false,
    error: null,
    rooms: [],
    activeRoom: null,
    loadingConversation: false,
    conversations: []
  };
}

export const mutations: MutationTree<RoomState> = {
  loadRooms(state) {
    state.error = null;
    state.loadingRoom = true;
  },
  roomsLoaded(state, rooms: Room[]) {
    state.loadingRoom = false;
    state.rooms = rooms;
  },
  errorLoadRoom(state, error: Error) {
    state.loadingRoom = false;
    state.error = error;
  },
  setActiveRoom(state, roomID: string) {
    state.conversations = [];
    const room = state.rooms.find((r) => r.id === roomID);
    if (room) {
      state.activeRoom = room;
    }
  },
  loadConversations(state) {
    state.error = null;
    state.conversations = [];
    state.loadingConversation = true;
  },
  conversationLoaded(state, conversations: Conversation[]) {
    state.conversations = conversations;
    state.loadingConversation = false;
  },
  loadNextConversations(state) {
    state.error = null;
    state.loadingConversation = true;
  },
  nextConversationLoaded(state, conversations: Conversation[]) {
    state.conversations = conversations.concat(state.conversations);
    state.loadingConversation = false;
  },
  errorLoadConversation(state, error: Error) {
    state.error = error;
    state.loadingConversation = false;
  },
  sendingMessage(state, message: SentMessage) {
    state.conversations.push({
      id: message.id,
      message: message.message,
      receive: false,
      sentAt: message.sentAt
    });
  },
  sendingMessageFailed(state, tempID: string) {
    // replace optimist conv. with error one
    const idx = state.conversations.findIndex((conv) => conv.id === tempID);
    if (idx > -1) {
      state.conversations[idx].failed = true;
    }
  },
  messageSent(state, sentConv: SentConversation) {
    // replace optimist conv. with comitted one
    const idx = state.conversations.findIndex(
      (conv) => conv.id === sentConv.tempId
    );
    if (idx > -1) {
      state.conversations[idx] = sentConv.conversation;
    }
  },
  messageRead(state, conversationID: string) {
    const idx = state.conversations.findIndex(
      (conv) => conv.id === conversationID
    );
    if (idx > -1) {
      state.conversations[idx].read = true;
    }
  },
  messageReceived(state, conversationID: string) {
    const idx = state.conversations.findIndex(
      (conv) => conv.id === conversationID
    );
    if (idx > -1) {
      state.conversations[idx].received = true;
    }
  },
  readMessage(state, conversationID: string) {
    const idx = state.conversations.findIndex(
      (conv) => conv.id === conversationID
    );
    if (idx > -1) {
      state.conversations[idx].read = true;
    }
  },
  receiveMessage(state, conv: Conversation) {
    state.conversations.push(conv);
  },
  userTyping(state, participant: Participant) {
    const idx = state.rooms.findIndex((room) => room.id === participant.roomID);
    if (idx > -1) {
      if (!state.rooms[idx].typings.includes(participant.userID)) {
        state.rooms[idx].typings.push(participant.userID);
      }
    }
    if (state.activeRoom.id === participant.roomID) {
      if (!state.activeRoom.typings.includes(participant.userID)) {
        state.activeRoom.typings.push(participant.userID);
      }
    }
  },
  finishTyping(state, participant: Participant) {
    const idx = state.rooms.findIndex((room) => room.id === participant.roomID);
    if (idx === -1) {
      return null;
    }
    const id = state.rooms[idx].typings.indexOf(participant.userID);
    if (id > -1) {
      state.rooms[idx].typings.splice(id, 1);
    }
  },
  joinRoom(state, room: Room) {
    const idx = state.rooms.findIndex((r) => r.id === room.id);
    if (idx > -1) {
      state.rooms.unshift(room);
    }
  },
  leftRoom(state, roomID: string) {
    const idx = state.rooms.findIndex((r) => r.id === roomID);
    if (idx === -1) {
      state.rooms.splice(idx, 1);
    }
  },
  roomProfileUpdated(state, roomProfile: RoomProfile) {
    const idx = state.rooms.findIndex((r) => r.id === roomProfile.id);
    if (idx === -1) {
      state.rooms[idx].name = roomProfile.name;
      state.rooms[idx].photo = roomProfile.photo;
      state.rooms[idx].description = roomProfile.description;
    }
  }
};

export const actions: ActionTree<RoomState, RootState> = {
  async loadRooms({ commit }) {
    commit('loadRooms');
    try {
      const myRooms = await this.$p2pchat.getRooms();
      const rooms: Room[] = [];
      for (const r of myRooms) {
        const convos = await this.$p2pchat.getConversations(r.id, 0, 1);
        rooms.push({
          id: r.id,
          name: r.name,
          description: r.description,
          photo: r.photo,
          lastConversation: (convos[0]?.message.content as string) || '',
          typings: []
        });
      }
      commit('roomsLoaded', rooms);
    } catch (err) {
      commit('errorLoadRoom', err);
    }
  },
  async selectRoom({ commit }, roomID: string) {
    commit('setActiveRoom', roomID);
    commit('loadConversations');
    try {
      const convos = await this.$p2pchat.getConversations(roomID, 0, 20);
      commit(
        'conversationLoaded',
        convos
          .map(
            (c) =>
              ({
                id: c.id,
                message: c.message.content as string,
                receive: c.isReceiver,
                sentAt: c.sendAt,
                failed: c.status === ConversationStatus.FAILED,
                read: c.status === ConversationStatus.READ,
                received: c.status === ConversationStatus.RECEIVED
              } as Conversation)
          )
          .reverse()
      );
    } catch (err) {
      commit('errorLoadConversation', err);
    }
  },
  async loadNextConversation({ commit, state }) {
    commit('loadNextConversations');
    try {
      const convos = await this.$p2pchat.getConversations(
        state.activeRoom?.id,
        state.conversations?.length,
        20
      );
      commit(
        'nextConversationLoaded',
        convos
          .map(
            (c) =>
              ({
                id: c.id,
                message: c.message.content as string,
                receive: c.isReceiver,
                sentAt: c.sendAt,
                failed: c.status === ConversationStatus.FAILED,
                read: c.status === ConversationStatus.READ,
                received: c.status === ConversationStatus.RECEIVED
              } as Conversation)
          )
          .reverse()
      );
    } catch (err) {
      commit('errorLoadConversation', err);
    }
  },
  typeMessage({ state }) {
    return this.$p2pchat.typing(state.activeRoom?.id);
  },
  async sendMessage({ commit, state }, message: string) {
    const tempId = uuid();
    commit('sendingMessage', {
      id: tempId,
      message,
      sentAt: new Date()
    } as SentMessage);
    try {
      const c = await this.$p2pchat.sendMessage(state.activeRoom?.id, {
        type: MessageType.MESSAGE,
        content: message
      });
      commit('messageSent', {
        tempId,
        conversation: {
          id: c.id,
          message: c.message.content as string,
          receive: c.isReceiver,
          sentAt: c.sendAt,
          failed: c.status === ConversationStatus.FAILED,
          read: c.status === ConversationStatus.READ,
          received: c.status === ConversationStatus.RECEIVED
        }
      } as SentConversation);
    } catch (err) {
      commit('sendingMessageFailed', tempId);
    }
  },
  async readMessage({ commit, state }, conversationID: string) {
    const idx = state.conversations.findIndex((c) => c.id === conversationID);
    if (idx === -1) {
      return null;
    }
    if (!state.conversations[idx].read) {
      await this.$p2pchat.readMessage(state.activeRoom?.id, conversationID);
      commit('readMessage', conversationID);
    }
  },
  subscribeConversationActivity({ commit, dispatch, state }) {
    this.$p2pchat.onMessageRead.subscribe((conv) => {
      if (conv.roomID === state.activeRoom?.id) {
        commit('messageRead', conv.id);
      }
    });
    this.$p2pchat.onMessageReceived.subscribe((conv) => {
      if (conv.roomID === state.activeRoom?.id) {
        commit('messageReceived', conv.id);
      }
    });
    this.$p2pchat.onUserTyping.subscribe((participant) => {
      const p = {
        roomID: participant.roomID,
        userID: participant.user?.id
      } as Participant;
      commit('userTyping', p);
      setTimeout(() => {
        commit('finishTyping', p);
      }, 1000);
    });
    this.$p2pchat.onReceiveMessage.subscribe((c) => {
      if (c.roomID === state.activeRoom?.id) {
        commit('receiveMessage', {
          id: c.id,
          message: c.message.content as string,
          receive: c.isReceiver,
          sentAt: c.sendAt,
          failed: c.status === ConversationStatus.FAILED,
          read: c.status === ConversationStatus.READ,
          received: c.status === ConversationStatus.RECEIVED
        });
      }
    });
    this.$p2pchat.onRoomDestroyed.subscribe((r) => {
      commit('leftRoom', r.id);
    });
    this.$p2pchat.onRoomUpdated.subscribe((r) => {
      commit('roomProfileUpdated', {
        id: r.id,
        name: r.name,
        description: r.description,
        photo: r.photo
      } as RoomProfile);
    });
    this.$p2pchat.onRoomCreated.subscribe((r) => {
      if (r.participants.map((p) => p.id).includes(this.$p2pchat.profile.id)) {
        commit('joinRoom', {
          id: r.id,
          name: r.name,
          description: r.description,
          photo: r.photo,
          lastConversation: '',
          typings: []
        } as Room);
      }
    });
    this.$p2pchat.onUserJoinRoom.subscribe((r) => {
      // reload room list
      dispatch('loadRooms');
    });
    this.$p2pchat.onUserLeftRoom.subscribe((r) => {
      if (r.user?.id === this.$p2pchat.profile.id) {
        commit('leftRoom', r.roomID);
      }
    });
  }
};
