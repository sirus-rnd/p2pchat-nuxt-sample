import * as LocalForage from 'localforage';
import { grpc } from '@improbable-eng/grpc-web';
import { ProtobufMessage } from '@improbable-eng/grpc-web/dist/typings/message';
import { Observable, merge, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Consola } from 'consola';
import { map, flatMap } from 'rxjs/operators';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { IConversationStateManager } from './conversation-state';
import { IMessenger, FileInfo, mapConversationFromState } from './messaging';
import {
  IChatClient,
  User,
  Room,
  UserInRoomEventPayload,
  Conversation,
  ConversationStatus,
  Message,
  MessageType,
  FileContent
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
  ICECredentialType,
  ICEParam,
  ICEOffer,
  OnlineStatus,
  GetUserParam,
  Heartbeat
} from '~/protos/signalling_pb';

export const ACCESS_KEY = 'access-token';

export class ChatClient implements IChatClient {
  profile: User;
  private iceServers: RTCIceServer[] = [];
  private channels: { [userID: string]: UserChannel } = {};
  private rooms: Rooms;
  // channel events
  onUserConnected: Observable<string> = new Observable(); // user id
  onUserDisconnected: Observable<string> = new Observable(); // user id
  // messaging events
  onMessageReceived: Observable<Conversation> = new Observable();
  onMessageRead: Observable<Conversation> = new Observable();
  onReceiveMessage: Observable<Conversation> = new Observable();
  onUserTyping: Observable<UserInRoomEventPayload> = new Observable();
  onFileTransferStart: Observable<FileContent> = new Observable();
  onReceiveFileChunk: Observable<FileContent> = new Observable();
  onFileTransferEnd: Observable<FileContent> = new Observable();
  // signalling request handler
  private sdpCommandSub: grpc.Request;
  private iceOfferSub: grpc.Request;
  private onlineStatusClient: grpc.Client<ProtobufMessage, ProtobufMessage>;
  private heartbeatTimeout: NodeJS.Timeout;
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
    private conversationManager: IConversationStateManager,
    private messenger: IMessenger,
    private logger: Consola
  ) {}

  async authenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) {
      return false;
    }
    return true;
  }

  async login(token: string): Promise<User> {
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

    // set our current profile
    return {
      id: profile.getId(),
      name: profile.getName(),
      photo: profile.getPhoto(),
      online: false
    } as User;
  }

  async reconnect(): Promise<void> {
    const userIds = Object.keys(this.channels);
    // reconnect signalling channel
    if (this.sdpCommandSub) {
      this.sdpCommandSub.close();
    }
    if (this.iceOfferSub) {
      this.iceOfferSub.close();
    }
    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
    }
    if (this.onlineStatusClient) {
      this.onlineStatusClient.finishSend();
    }
    await this.initSDPSignal();
    await this.initICEOfferSignal();
    await this.initOnlineStatus();

    // reconn to each channels
    this.profile.online = false;
    await Promise.all(
      userIds.map(async (id) => {
        await this.disconnectToChannel(id);
        this.connectToChannel(id);
      })
    );
    // set profile to online
    this.profile.online = true;
  }

  async connect(): Promise<void> {
    const token = await this.getAccessToken();
    // get signalling profile
    const profile = await new Promise<Profile>((resolve, reject) => {
      this.signaling.getProfile(new Empty(), { token }, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });

    this.profile = {
      id: profile.getId(),
      name: profile.getName(),
      photo: profile.getPhoto(),
      online: false
    } as User;

    // set ICE server resolvers
    this.iceServers = profile.getServersList().map((raw) => {
      const server = raw.toObject();
      const ice = {
        urls: server.url
      } as RTCIceServer;
      if (server.credentialtype !== ICECredentialType.NONE) {
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

    // subscribe room event to update user & room state
    await this.handleRoomEvents();

    // make channels & intiate SDP signaling
    await this.initSDPSignal();
    await this.initICEOfferSignal();
    this.makeChannels(this.rooms);
    await this.initOnlineStatus();

    // connect to each user on the rooms
    await Promise.all(
      Object.keys(this.channels).map((id) => {
        if (this.channels[id].online) {
          return this.connectToChannel(id);
        }
      })
    );

    // set our current profile
    this.profile.online = true;
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

  private makeChannels(rooms: Rooms) {
    // get users id from each rooms
    const userIds: string[] = [];
    const users: PBUser[] = [];
    rooms.getRoomsList().forEach((room) => {
      room.getUsersList().forEach((user) => {
        const id = user.getId();
        // skip our own profile
        if (id === this.profile.id) {
          return null;
        }
        if (!userIds.includes(user.getId())) {
          userIds.push(id);
          users.push(user);
        }
      });
    });

    // create channel & handle channel events for each users
    for (const user of users) {
      this.setupUserChannel(user.toObject());
    }
  }

  private getUserbyID(id: string): User {
    let user: User = {
      id,
      name: id,
      photo: null,
      online: false
    };
    if (id === this.profile.id) {
      user = {
        id: this.profile.id,
        name: this.profile.name,
        photo: this.profile.photo,
        online: true
      };
    } else {
      const senderChannel = this.channels[id];
      if (senderChannel) {
        user = {
          id: senderChannel.id,
          name: senderChannel.name,
          photo: senderChannel.photo,
          online: senderChannel.connected
        };
      }
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
    // close signaling channel
    if (this.sdpCommandSub) {
      this.sdpCommandSub.close();
    }
    if (this.iceOfferSub) {
      this.iceOfferSub.close();
    }
    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
    }
    if (this.onlineStatusClient) {
      this.onlineStatusClient.finishSend();
    }
    // remove access token
    await this.storage.removeItem(ACCESS_KEY);
    // clear conversation history
    await this.conversationManager.reset();
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

    return states.map((state) =>
      mapConversationFromState(this.getUserbyID(state.senderID), state)
    );
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

    // when message are file, create file first
    const isBinary =
      message.type === MessageType.FILE || message.type === MessageType.IMAGE;
    if (isBinary) {
      const file = message.content as FileContent;
      const fileState = await this.conversationManager.newFile({
        id: uuid(),
        name: file.name,
        size: file.size,
        type: file.type,
        binary: file.binary
      });
    }

    // create new conversation state
    let content = message.content as string;
    if (isBinary) {
      content = (message.content as FileContent)?.id;
    }
    const convState = await this.conversationManager.sendMessage({
      id: uuid(),
      roomID,
      senderID: this.profile.id,
      content,
      type: message.type,
      participants
    });

    // send message to all participants in room
    await Promise.all(
      participants.map((id) => {
        if (id === this.profile.id) {
          return;
        }
        let file = null;
        let messageContent = message.content as string;
        if (isBinary) {
          const info = message.content as FileContent;
          messageContent = info.id;
          file = {
            name: info.id,
            size: info.size,
            type: info.type
          } as FileInfo;
        }
        return this.messenger.sendMessage(this.channels[id], {
          id: convState.id,
          messageType: message.type,
          messageContent,
          roomID,
          sendAt: convState.sendAt,
          file
        });
      })
    );

    return mapConversationFromState(
      this.getUserbyID(this.profile.id),
      convState
    );
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

    // update read state
    await this.conversationManager.readMessage({
      id: conversationID
    });

    await Promise.all(
      participants.map((id) =>
        this.messenger.readMessage(this.channels[id], {
          id: conversationID
        })
      )
    );
    const convState = await this.conversationManager.getConversation(
      conversationID
    );
    return mapConversationFromState(
      this.getUserbyID(convState.senderID),
      convState
    );
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
      participants.map((id) =>
        this.messenger.typing(this.channels[id], {
          roomID
        })
      )
    );
  }

  async requestFile(
    ownerID: string,
    fileID: string,
    startIndex: number
  ): Promise<void> {
    if (!this.channels[ownerID]) {
      throw new Error('file owner not found');
    }
    if (!this.channels[ownerID].connected) {
      throw new Error('file owner offline');
    }
    await this.messenger.requestFile(this.channels[ownerID], {
      id: fileID,
      startAt: startIndex
    });
  }

  private getAccessToken(): Promise<string> {
    return this.storage.getItem(ACCESS_KEY);
  }

  private async setAccessToken(token: string): Promise<void> {
    await this.storage.setItem(ACCESS_KEY, token);
  }

  private setupUserChannel(user: PBUser.AsObject) {
    const id = user.id;
    this.channels[id] = new UserChannel(id, user.name, user.photo, user.online);

    // add each user connection event to central connection stream
    this.onUserConnected = merge(
      this.onUserConnected,
      this.channels[id].onConnected.pipe(map(() => id))
    );
    this.onUserDisconnected = merge(
      this.onUserDisconnected,
      this.channels[id].onDisconnected.pipe(map(() => id))
    );

    // hookup conversation state change
    this.onMessageReceived = merge(
      this.onMessageReceived,
      this.channels[id].onMessageReceived
    );
    this.onMessageRead = merge(
      this.onMessageRead,
      this.channels[id].onMessageRead
    );
    this.onReceiveMessage = merge(
      this.onReceiveMessage,
      this.channels[id].onReceiveMessage
    );

    // hook up file transfer change
    this.onFileTransferStart = merge(
      this.onFileTransferStart,
      this.channels[id].onFileTransferStart
    );
    this.onFileTransferEnd = merge(
      this.onFileTransferEnd,
      this.channels[id].onFileTransferEnd
    );
    this.onReceiveFileChunk = merge(
      this.onReceiveFileChunk,
      this.channels[id].onReceiveFileChunk
    );

    // user typing event stream
    this.onUserTyping = merge(
      this.onUserTyping,
      this.channels[id].onUserTyping
    );
  }

  private destroyUserChannel(id: string) {
    this.disconnectToChannel(id);
    delete this.channels[id];
  }

  private async initOnlineStatus() {
    this.logger.info('initiate online status signalling');
    const token = await this.getAccessToken();
    this.onlineStatusClient = grpc.client(
      SignalingService.SubscribeOnlineStatus,
      {
        host: this.signaling.hostname_,
        transport: grpc.WebsocketTransport()
      }
    );
    this.onlineStatusClient.onMessage((data: OnlineStatus) => {
      const payload = data.toObject();
      const id = payload.id;
      this.logger.debug('user online status change', payload);
      if (!this.channels[id]) {
        return null;
      }
      // update online status
      this.channels[id].online = payload.online;
      // connect & disconnect based on online state
      try {
        if (payload.online) {
          this.connectToChannel(id);
        } else {
          this.disconnectToChannel(id);
        }
      } catch (err) {
        this.logger.error(err);
      }
    });
    this.onlineStatusClient.onEnd(
      (code: grpc.Code, msg: string | undefined, _: grpc.Metadata) => {
        if (code !== grpc.Code.OK) {
          throw new Error(msg);
        }
      }
    );
    this.onlineStatusClient.start(new grpc.Metadata({ token }));
    this.heartbeatTimeout = setInterval(() => {
      const heartbeat = new Heartbeat();
      heartbeat.setBeat(true);
      this.logger.debug('send heartbeat');
      this.onlineStatusClient.send(heartbeat);
    }, 3000);
  }

  private async initICEOfferSignal() {
    this.logger.info('initiate ICE candidate signalling');
    const token = await this.getAccessToken();
    this.iceOfferSub = grpc.invoke(SignalingService.SubscribeICECandidate, {
      request: new Empty(),
      host: this.signaling.hostname_,
      metadata: { token },
      onMessage: (data: ICEOffer) => {
        const payload = data.toObject();
        const id = payload.senderid;
        const candidate: RTCIceCandidate = JSON.parse(payload.candidate);
        this.logger.debug('receive ICE candidate', candidate);
        if (!this.channels[id]) {
          return null;
        }
        try {
          if (payload.isremote) {
            this.channels[id].localConnection.addIceCandidate(candidate);
          } else {
            this.channels[id].remoteConnection.addIceCandidate(candidate);
          }
        } catch (err) {
          this.logger.error(err);
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

  private async initSDPSignal() {
    this.logger.info('initiate SDP signalling');
    const token = await this.getAccessToken();
    this.sdpCommandSub = grpc.invoke(SignalingService.SubscribeSDPCommand, {
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
            this.logger.debug('receive offer', payload);
            this.channels[id].remoteConnection.setRemoteDescription(offer);

            // create answer
            const answer = await this.channels[
              id
            ].remoteConnection.createAnswer();
            this.logger.debug('send answer', answer);
            this.channels[id].remoteConnection.setLocalDescription(answer);
            const param = new SDPParam();
            param.setUserid(id);
            param.setDescription(answer.sdp);
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
            this.logger.debug('receive answer', payload);
            this.channels[id].localConnection.setRemoteDescription(answer);
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

  private connectToChannel(id: string) {
    if (!this.isChannelExists(id)) {
      throw new Error('channel not exists');
    }
    // create sending channel
    this.channels[id].localConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });
    this.channels[id].sendChannel = this.channels[
      id
    ].localConnection.createDataChannel(uuid());
    this.channels[id].localConnection.onicecandidate = async (
      event: RTCPeerConnectionIceEvent
    ) => {
      if (!event.candidate) {
        return null;
      }
      await this.sendICECandidate(event.candidate, id, false);
    };

    this.channels[id].localConnection.oniceconnectionstatechange = (ev) => {
      this.logger.debug('ice state change', ev);
    };

    this.channels[id].localConnection.onnegotiationneeded = async () => {
      // create SDP offers
      const offer = await this.channels[id].localConnection.createOffer();
      this.channels[id].localConnection.setLocalDescription(offer);
      this.logger.debug('send offer', JSON.stringify(offer.sdp, null, 2));
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
    };

    // update connection status
    this.channels[id].sendChannel.onerror = (err) => {
      this.logger.error('send channel error', id, err);
    };
    this.channels[id].sendChannel.onopen = () => {
      this.logger.debug('sen channel connected');
      this.channels[id].connected = true;
      this.channels[id]._onConnected.next(null);
      // resend pending messages
      this.messenger.resendPendingMessages(this.channels[id]);
    };
    this.channels[id].sendChannel.onclose = () => {
      this.channels[id].connected = false;
      this.channels[id]._onDisconnected.next(null);
    };

    // setup receiving channel
    this.channels[id].remoteConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });
    this.channels[id].remoteConnection.onicecandidate = async (
      event: RTCPeerConnectionIceEvent
    ) => {
      if (!event.candidate) {
        return null;
      }
      await this.sendICECandidate(event.candidate, id, true);
    };

    // when receiving channel established, handle incoming message
    this.channels[id].remoteConnection.ondatachannel = (
      ev: RTCDataChannelEvent
    ) => {
      this.logger.debug('receive data channel request', ev.channel.id);
      this.channels[id].receiveChannel = ev.channel;
      this.channels[id].receiveChannel.onopen = () => {
        this.logger.debug('receive channel opened');
      };
      this.channels[id].receiveChannel.onclose = () => {
        this.logger.debug('receive channel closed');
      };
      // parse message from receive channel
      this.channels[id].receiveChannel.onmessage = (ev: MessageEvent) => {
        this.messenger.handleIncomingMessage(this.channels[id], ev);
      };
      this.channels[id].receiveChannel.onerror = (err) => {
        this.logger.error('receive channel error', err);
      };
    };
  }

  private async sendICECandidate(
    iceCandidate: RTCIceCandidate,
    id: string,
    isRemote: boolean
  ) {
    this.logger.debug('ice candidate', iceCandidate, id, isRemote);
    // send ICE candidate offer
    const param = new ICEParam();
    param.setUserid(id);
    param.setIsremote(isRemote);
    param.setCandidate(JSON.stringify(iceCandidate));
    const token = await this.getAccessToken();
    await new Promise((resolve, reject) => {
      this.signaling.sendICECandidate(param, { token }, (err, response) => {
        if (err) {
          reject(err);
        }
        resolve(response);
      });
    });
  }

  private disconnectToChannel(id: string) {
    if (!this.isChannelExists(id)) {
      return null;
    }
    if (!this.channels[id].connected) {
      return null;
    }
    if (this.channels[id].sendChannel) {
      this.channels[id].sendChannel.close();
    }
    if (this.channels[id].localConnection) {
      this.channels[id].localConnection.close();
    }
    if (!this.channels[id].remoteConnection) {
      this.channels[id].remoteConnection.close();
    }
    if (this.channels[id].receiveChannel) {
      this.channels[id].receiveChannel.close();
    }
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
      onMessage: async (data: RoomEvent) => {
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
              // get user information
              const param = new GetUserParam();
              param.setId(payload.participantid);
              const token = await this.getAccessToken();
              const rawUser = await new Promise<PBUser>((resolve, reject) => {
                this.signaling.getUser(param, { token }, (err, response) => {
                  if (err) {
                    reject(err);
                  }
                  resolve(response);
                });
              });
              const user = rawUser.toObject();
              this.setupUserChannel(user);
              if (user.online) {
                this.connectToChannel(payload.participantid);
              }
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
