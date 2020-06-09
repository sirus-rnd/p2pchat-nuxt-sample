import * as LocalForage from 'localforage';
import { grpc } from '@improbable-eng/grpc-web';
import { Observable, concat, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { map, flatMap } from 'rxjs/operators';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import {
  IConversationStateManager,
  ConversationState
} from './conversation-state';
import {
  MessagingType,
  NewMessagePayload,
  MessageReadPayload,
  TypingPayload,
  MessagingProtocol
} from './messaging';
import {
  IChatClient,
  User,
  Room,
  UserInRoomEventPayload,
  Conversation,
  ConversationStatus,
  Message
} from './p2p-chat';
import { UserChannel } from './user-channel';
import { SignalingService } from '~/protos/signalling_pb_service';
import { SignalingServiceClient } from '~/protos/SignallingServiceClientPb';
import {
  Profile,
  Rooms,
  User as PBUser,
  RoomEvent,
  RoomEvents,
  SDP,
  SDPTypes,
  SDPParam,
  ICECredentialType
} from '~/protos/signalling_pb';

export const ACCESS_KEY = 'access-token';

export class ChatClient implements IChatClient {
  private profile: User;
  private iceServers: RTCIceServer[] = [];
  private channels: { [userID: string]: UserChannel } = {};
  private rooms: Rooms;
  // channel events
  onUserConnected: Observable<string> = new Observable(); // user id
  onUserDisconnected: Observable<string> = new Observable(); // user id
  // messaging events
  onMessageSent: Observable<Conversation> = new Observable();
  onMessageReceived: Observable<Conversation> = new Observable();
  onMessageRead: Observable<Conversation> = new Observable();
  onReceiveMessage: Observable<Conversation> = new Observable();
  onUserTyping: Observable<UserInRoomEventPayload> = new Observable();
  // signalling events
  private _onRoomCreated = new Subject<Room>();
  private _onRoomUpdated = new Subject<Room>();
  private _onRoomDestroyed = new Subject<Room>();
  private _onUserJoinRoom = new Subject<UserInRoomEventPayload>();
  private _onUserLeftRoom = new Subject<UserInRoomEventPayload>();
  private _onUserProfileUpdated = new Subject<User>();
  private _onUserRemoved = new Subject<User>();
  onRoomCreated: Observable<Room> = this._onRoomCreated.asObservable();
  onRoomUpdated: Observable<Room> = this._onRoomUpdated.asObservable();
  onRoomDestroyed: Observable<Room> = this._onRoomDestroyed.asObservable();
  onUserJoinRoom: Observable<
    UserInRoomEventPayload
  > = this._onUserJoinRoom.asObservable();
  onUserLeftRoom: Observable<
    UserInRoomEventPayload
  > = this._onUserLeftRoom.asObservable();
  onUserProfileUpdated: Observable<
    User
  > = this._onUserProfileUpdated.asObservable();
  onUserRemoved: Observable<User> = this._onUserRemoved.asObservable();

  constructor(
    private signaling: SignalingServiceClient,
    private storage: LocalForage,
    private conversationManager: IConversationStateManager
  ) {}

  async authenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) {
      return false;
    }
    return true;
  }

  async connect(token: string): Promise<User> {
    // persist token
    await this.setAccessToken(token);

    // get signalling profile
    const profile = await new Promise<Profile>((resolve, reject) => {
      this.signaling.getProfile(new Empty(), { token }, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });

    // set ICE server resolvers
    this.iceServers = profile.getServersList().map((raw) => {
      const server = raw.toObject();
      const ice = {
        urls: server.url
      } as RTCIceServer;
      if (
        server.credentialtype !== null &&
        server.credentialtype !== undefined
      ) {
        ice.username = server.username;
        switch (server.credentialtype) {
          case ICECredentialType.OAUTH:
            ice.credentialType = 'oauth';
            ice.credential = {
              macKey: server.mackey,
              accessToken: server.accesstoken
            };
            break;
          case ICECredentialType.PASSWORD:
            ice.credentialType = 'password';
            ice.credential = server.password;
            break;
        }
      }
      return ice;
    });

    // get available rooms
    this.rooms = await new Promise<Rooms>((resolve, reject) => {
      this.signaling.getMyRooms(new Empty(), { token }, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });

    // make channels & intiate SDP signaling
    await this.makeChannels(this.rooms);
    await this.initSDPSignal();

    // return our current profile
    this.profile = {
      id: profile.getId(),
      name: profile.getName(),
      photo: profile.getPhoto(),
      online: true
    } as User;
    return this.profile;
  }

  async myProfile(): Promise<User> {
    // get profile
    const token = await this.getAccessToken();
    const request = new Empty();
    const profile = await new Promise<Profile>((resolve, reject) => {
      this.signaling.getProfile(request, { token }, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });

    // return our current profile
    return {
      id: profile.getId(),
      name: profile.getName(),
      photo: profile.getPhoto(),
      online: true
    } as User;
  }

  private async makeChannels(rooms: Rooms) {
    // get users id from each rooms
    const userIds: string[] = [];
    const users: PBUser[] = [];
    rooms.getRoomsList().forEach((room) => {
      room.getUsersList().forEach((user) => {
        const id = user.getId();
        if (!userIds.includes(user.getId())) {
          userIds.push(id);
          users.push(user);
        }
      });
    });

    // create channel & handle channel events for each users
    for (const user of users) {
      this.createUserChannel(user.toObject());
    }

    // subscribe room event to update user & room state
    await this.handleRoomEvents();

    // connect to each channel
    await Promise.all(
      userIds.map((id) => {
        return this.connectToChannel(id);
      })
    );
  }

  private getUserbyID(id: string): User {
    let user: User = {
      id,
      name: id,
      photo: null,
      online: false
    };
    const senderChannel = this.channels[id];
    if (senderChannel) {
      user = {
        id: senderChannel.id,
        name: senderChannel.name,
        photo: senderChannel.photo,
        online: senderChannel.connected
      };
    }
    return user;
  }

  async disconnect() {
    const userIds = Object.keys(this.channels);
    // disconnect from all channel
    await Promise.all(
      userIds.map((id) => {
        return this.disconnectToChannel(id);
      })
    );
    // remove access token
    await this.storage.removeItem(ACCESS_KEY);
  }

  async getRooms(): Promise<Room[]> {
    // get profile
    const token = await this.getAccessToken();
    const request = new Empty();
    const rooms = await new Promise<Rooms>((resolve, reject) => {
      this.signaling.getMyRooms(request, { token }, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });

    // return our current profile
    return rooms.getRoomsList().map(
      (room) =>
        ({
          id: room.getId(),
          name: room.getName(),
          description: room.getDescription(),
          photo: room.getPhoto(),
          participants: room.getUsersList().map((user) => {
            const id = user.getId();
            const online = this.channels[id]
              ? this.channels[id].connected
              : false;
            return {
              id,
              name: user.getName(),
              photo: user.getPhoto(),
              online
            } as User;
          })
        } as Room)
    );
  }

  async getConversations(
    roomID: string,
    skip: number,
    limit: number
  ): Promise<Conversation[]> {
    const states = await this.conversationManager.getConversations(
      roomID,
      limit,
      skip
    );

    return states.map((state) => this.mapConversationFromState(state));
  }

  private mapConversationFromState(state: ConversationState): Conversation {
    // map user information from channel id
    let sender: User = {
      id: state.senderID,
      name: state.senderID,
      photo: null,
      online: false
    };
    const senderChannel = this.channels[state.senderID];
    if (senderChannel) {
      sender = {
        id: senderChannel.id,
        name: senderChannel.name,
        photo: senderChannel.photo,
        online: senderChannel.connected
      };
    }

    // set conversation status
    let status: ConversationStatus;
    if (!state.isReceiver) {
      if (state.errorCode || state.errorMessage) {
        status = ConversationStatus.FAILED;
      } else if (state.receivedBy?.length > 0) {
        status = ConversationStatus.RECEIVED;
      } else if (state.readBy?.length > 0) {
        status = ConversationStatus.READ;
      } else {
        status = ConversationStatus.SENT;
      }
    }
    if (state.isReceiver) {
      if (state.read) {
        status = ConversationStatus.READ;
      } else {
        status = ConversationStatus.RECEIVED;
      }
    }

    return {
      id: state.id,
      message: {
        type: state.messageType,
        content: state.messageContent
      },
      sendAt: state.sendAt,
      sender,
      status
    } as Conversation;
  }

  async sendMessage(roomID: string, message: Message): Promise<Conversation> {
    // get paricipant on this room id
    const room = this.rooms
      .getRoomsList()
      .find((room) => room.getId() === roomID);
    if (!room) {
      throw new Error('room not found!');
    }
    const participants = room.getUsersList().map((user) => user.getId());

    // create new conversation
    const convState = await this.conversationManager.sendMessage({
      id: uuid(),
      roomID,
      senderID: this.profile.id,
      content: message.content,
      type: message.type
    });

    await Promise.all(
      participants.map((id) => {
        const chan = this.channels[id];
        if (!chan || !chan.connected) {
          return null;
        }
        this.sendChannelMessage(id, {
          type: MessagingType.MessageNew,
          payload: {
            id: convState.id,
            sendAt: convState.sendAt,
            messageType: message.type,
            messageContent: message.content
          } as NewMessagePayload
        });
      })
    );

    return this.mapConversationFromState(convState);
  }

  async readMessage(
    roomID: string,
    conversationID: string
  ): Promise<Conversation> {
    // get paricipant on this room id
    const room = this.rooms
      .getRoomsList()
      .find((room) => room.getId() === roomID);
    if (!room) {
      throw new Error('room not found!');
    }
    const participants = room.getUsersList().map((user) => user.getId());

    await Promise.all(
      participants.map((id) => {
        const chan = this.channels[id];
        if (!chan || !chan.connected) {
          return null;
        }
        this.sendChannelMessage(id, {
          type: MessagingType.MessageRead,
          payload: {
            id: conversationID,
            readBy: this.profile.id
          } as MessageReadPayload
        });
      })
    );

    const convState = await this.conversationManager.getConversation(
      conversationID
    );
    return this.mapConversationFromState(convState);
  }

  async typing(roomID: string): Promise<void> {
    // get paricipant on this room id
    const room = this.rooms
      .getRoomsList()
      .find((room) => room.getId() === roomID);
    if (!room) {
      throw new Error('room not found!');
    }
    const participants = room.getUsersList().map((user) => user.getId());

    await Promise.all(
      participants.map((id) => {
        const chan = this.channels[id];
        if (!chan || !chan.connected) {
          return null;
        }
        this.sendChannelMessage(id, {
          type: MessagingType.Typing,
          payload: {
            roomID,
            userID: this.profile.id
          } as TypingPayload
        });
      })
    );
  }

  private getAccessToken(): Promise<string> {
    return this.storage.getItem(ACCESS_KEY);
  }

  private async setAccessToken(token: string): Promise<void> {
    await this.storage.setItem(ACCESS_KEY, token);
  }

  private createUserChannel(user: PBUser.AsObject): UserChannel {
    const id = user.id;
    this.channels[id] = new UserChannel(id, user.name, user.photo);

    // add each user connection event to central connection stream
    this.onUserConnected = concat(
      this.onUserConnected,
      this.channels[id].onConnected.pipe(map(() => id))
    );
    this.onUserDisconnected = concat(
      this.onUserDisconnected,
      this.channels[id].onDisconnected.pipe(map(() => id))
    );

    // hookup conversation state change
    this.onMessageSent = concat(
      this.onMessageSent,
      this.channels[id].onMessageSent.pipe(
        flatMap((payload) =>
          this.conversationManager.messageSent({
            id: payload.id,
            receiverID: id
          })
        ),
        map((state) => this.mapConversationFromState(state))
      )
    );
    this.onMessageReceived = concat(
      this.onMessageReceived,
      this.channels[id].onMessageReceived.pipe(
        flatMap((payload) =>
          this.conversationManager.messageReceived({
            id: payload.id,
            receivedBy: id
          })
        ),
        map((state) => this.mapConversationFromState(state))
      )
    );
    this.onMessageRead = concat(
      this.onMessageRead,
      this.channels[id].onMessageRead.pipe(
        flatMap((payload) =>
          this.conversationManager.messageRead({
            id: payload.id,
            readerID: id
          })
        ),
        map((state) => this.mapConversationFromState(state))
      )
    );
    this.onReceiveMessage = concat(
      this.onReceiveMessage,
      this.channels[id].onReceiveMessage.pipe(
        flatMap((payload) =>
          this.conversationManager.receiveMessage({
            id: payload.id,
            roomID: payload.roomID,
            senderID: id,
            content: payload.messageContent,
            type: payload.messageType,
            sentAt: payload.sendAt
          })
        ),
        map((state) => this.mapConversationFromState(state))
      )
    );

    // user typing event stream
    this.onUserTyping = concat(
      this.onUserTyping,
      this.channels[id].onUserTyping.pipe(
        map((payload) => {
          return {
            roomID: payload.roomID,
            user: this.getUserbyID(id)
          };
        })
      )
    );

    return this.channels[id];
  }

  private destroyUserChannel(id: string) {
    this.disconnectToChannel(id);
    delete this.channels[id];
  }

  private async initSDPSignal() {
    const token = await this.getAccessToken();
    grpc.invoke(SignalingService.SubscribeSDPCommand, {
      request: new Empty(),
      host: this.signaling.hostname_,
      metadata: { token },
      onMessage: async (data: SDP) => {
        const payload = data.toObject();
        const id = payload.senderid;
        switch (payload.type) {
          case SDPTypes.OFFER: {
            if (!this.channels[id]) {
              return null;
            }
            const offer: RTCSessionDescriptionInit = {
              type: 'offer',
              sdp: payload.description
            };
            this.channels[id].localConnection.setLocalDescription(offer);
            this.channels[id].remoteConnection.setRemoteDescription(offer);

            // create answer
            const answer = await this.channels[
              id
            ].remoteConnection.createAnswer();
            const param = new SDPParam();
            param.setUserid(id);
            param.setDescription(JSON.stringify(answer.sdp));
            const token = await this.getAccessToken();
            await new Promise((resolve, reject) => {
              this.signaling.answerSessionDescription(
                param,
                { token },
                (err, response) => {
                  if (err) {
                    reject(err);
                  }
                  resolve(response);
                }
              );
            });
            break;
          }

          case SDPTypes.ANSWER: {
            if (!this.channels[id]) {
              return null;
            }
            const answer: RTCSessionDescriptionInit = {
              type: 'answer',
              sdp: payload.description
            };
            this.channels[id].localConnection.setRemoteDescription(answer);
            this.channels[id].remoteConnection.setLocalDescription(answer);
            break;
          }
        }
      },
      onEnd: (code: grpc.Code, msg: string | undefined, _: grpc.Metadata) => {
        if (code !== grpc.Code.OK) {
          throw new Error(msg);
        }
      },
      transport: grpc.WebsocketTransport()
    });
  }

  private async connectToChannel(id: string) {
    if (!this.isChannelExists(id)) {
      throw new Error('channel not exists');
    }
    // create sending channel
    this.channels[id].localConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });
    this.channels[id].sendChannel = this.channels[
      id
    ].localConnection.createDataChannel('chat');
    this.channels[id].localConnection.onicecandidate = async (
      event: RTCPeerConnectionIceEvent
    ) => {
      await this.channels[id].remoteConnection.addIceCandidate(event.candidate);
    };

    // create receiving channel
    this.channels[id].remoteConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });
    this.channels[id].remoteConnection.onicecandidate = async (
      event: RTCPeerConnectionIceEvent
    ) => {
      await this.channels[id].localConnection.addIceCandidate(event.candidate);
    };
    this.channels[id].remoteConnection.ondatachannel = (
      ev: RTCDataChannelEvent
    ) => {
      this.channels[id].receiveChannel = ev.channel;
    };

    // create SDP offers
    const offer = await this.channels[id].localConnection.createOffer();
    const param = new SDPParam();
    param.setUserid(id);
    param.setDescription(offer.sdp);
    const token = await this.getAccessToken();
    await new Promise((resolve, reject) => {
      this.signaling.offerSessionDescription(
        param,
        { token },
        (err, response) => {
          if (err) {
            reject(err);
          }
          resolve(response);
        }
      );
    });

    // update connection status
    this.channels[id].sendChannel.onopen = () => {
      this.channels[id].connected = true;
      this.channels[id]._onConnected.next(null);
    };
    this.channels[id].sendChannel.onclose = () => {
      this.channels[id].connected = false;
      this.channels[id]._onDisconnected.next(null);
    };

    // parse message from receive channel
    this.channels[id].receiveChannel.onmessage = (ev: MessageEvent) => {
      const msg: MessagingProtocol = JSON.parse(ev.data);
      switch (msg.type) {
        case MessagingType.MessageNew: {
          const payload = msg.payload as NewMessagePayload;
          this.channels[id]._onReceiveMessage.next(payload);
          break;
        }
        case MessagingType.MessageRead: {
          const payload = msg.payload as MessageReadPayload;
          this.channels[id]._onMessageRead.next(payload);
          break;
        }
        case MessagingType.MessageReceived: {
          const payload = msg.payload as MessageReadPayload;
          this.channels[id]._onMessageReceived.next(payload);
          break;
        }
        case MessagingType.Typing: {
          const payload = msg.payload as TypingPayload;
          this.channels[id]._onUserTyping.next(payload);
          break;
        }
      }
    };
  }

  private disconnectToChannel(id: string) {
    if (!this.isChannelExists(id)) {
      return null;
    }
    if (!this.channels[id].connected) {
      return null;
    }
    this.channels[id].sendChannel.close();
    this.channels[id].receiveChannel.close();
  }

  private sendChannelMessage(id: string, message: MessagingProtocol) {
    if (!this.isChannelExists(id)) {
      throw new Error('channel not exists');
    }
    // send message through send channel
    if (!this.channels[id]?.sendChannel || !this.channels[id].connected) {
      throw new Error(`user ${id} offline`);
    }
    this.channels[id].sendChannel.send(JSON.stringify(message));
  }

  private isChannelExists(id: string): boolean {
    const chan = this.channels[id];
    if (!chan) {
      return false;
    }
    return true;
  }

  async handleRoomEvents() {
    const token = await this.getAccessToken();
    grpc.invoke(SignalingService.SubscribeRoomEvent, {
      request: new Empty(),
      host: this.signaling.hostname_,
      metadata: { token },
      onMessage: (data: RoomEvent) => {
        switch (data.getEvent()) {
          case RoomEvents.ROOMCREATED: {
            const payload = data.getRoominstance().toObject();
            this._onRoomCreated.next({
              id: payload.id,
              name: payload.name,
              description: payload.description,
              photo: payload.photo,
              participants: []
            });
            break;
          }

          case RoomEvents.ROOMPROFILEUPDATED: {
            const payload = data.getRoominstance().toObject();
            this._onRoomUpdated.next({
              id: payload.id,
              name: payload.name,
              description: payload.description,
              photo: payload.photo,
              participants: []
            });
            break;
          }

          case RoomEvents.ROOMDESTROYED: {
            const payload = data.getRoominstance().toObject();
            this._onRoomDestroyed.next({
              id: payload.id,
              name: payload.name,
              description: payload.description,
              photo: payload.photo,
              participants: []
            });
            break;
          }

          case RoomEvents.USERJOINEDROOM: {
            const payload = data.getRoomparticipant().toObject();
            // setup user channel if channel not presents yet
            if (!this.channels[payload.participantid]) {
              this.createUserChannel({
                id: payload.participantid,
                name: payload.participantid,
                photo: ''
              });
              this.connectToChannel(payload.participantid);
            }

            this._onUserJoinRoom.next({
              roomID: payload.roomid,
              user: this.getUserbyID(payload.participantid)
            });
            break;
          }

          case RoomEvents.USERLEFTROOM: {
            const payload = data.getRoomparticipant().toObject();
            const user = this.getUserbyID(payload.participantid);
            // remove channel when user not have any room
            const chan = this.channels[payload.participantid];
            if (
              chan?.roomIDs?.includes(payload.roomid) &&
              chan?.roomIDs?.length === 1
            ) {
              this.destroyUserChannel(payload.participantid);
            }
            this._onUserLeftRoom.next({
              roomID: payload.roomid,
              user
            });
            break;
          }

          case RoomEvents.USERPROFILEUPDATED: {
            const payload = data.getUserinstance().toObject();
            // update user profile data
            if (this.channels[payload.id]) {
              this.channels[payload.id].name = payload.name;
              this.channels[payload.id].photo = payload.photo;
            }
            const user = this.getUserbyID(payload.id);
            this._onUserProfileUpdated.next(user);
            break;
          }

          case RoomEvents.USERREMOVED: {
            const payload = data.getUserinstance().toObject();
            const user = this.getUserbyID(payload.id);
            this._onUserRemoved.next(user);
            // clean up
            if (this.channels[payload.id]) {
              this.destroyUserChannel(payload.id);
            }
            break;
          }
        }
      },
      onEnd: (code: grpc.Code, msg: string | undefined, _: grpc.Metadata) => {
        if (code !== grpc.Code.OK) {
          throw new Error(msg);
        }
      },
      transport: grpc.WebsocketTransport()
    });
  }
}
