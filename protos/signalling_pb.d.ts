// package: protos
// file: signalling.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class NewUserParam extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewUserParam.AsObject;
  static toObject(includeInstance: boolean, msg: NewUserParam): NewUserParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewUserParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewUserParam;
  static deserializeBinaryFromReader(message: NewUserParam, reader: jspb.BinaryReader): NewUserParam;
}

export namespace NewUserParam {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
  }
}

export class GetUserParam extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUserParam.AsObject;
  static toObject(includeInstance: boolean, msg: GetUserParam): GetUserParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetUserParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUserParam;
  static deserializeBinaryFromReader(message: GetUserParam, reader: jspb.BinaryReader): GetUserParam;
}

export namespace GetUserParam {
  export type AsObject = {
    id: string,
  }
}

export class User extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): User.AsObject;
  static toObject(includeInstance: boolean, msg: User): User.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): User;
  static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
  }
}

export class Users extends jspb.Message {
  clearUsersList(): void;
  getUsersList(): Array<User>;
  setUsersList(value: Array<User>): void;
  addUsers(value?: User, index?: number): User;

  getCount(): number;
  setCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Users.AsObject;
  static toObject(includeInstance: boolean, msg: Users): Users.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Users, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Users;
  static deserializeBinaryFromReader(message: Users, reader: jspb.BinaryReader): Users;
}

export namespace Users {
  export type AsObject = {
    usersList: Array<User.AsObject>,
    count: number,
  }
}

export class UpdateUserProfileParam extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateUserProfileParam.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateUserProfileParam): UpdateUserProfileParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateUserProfileParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateUserProfileParam;
  static deserializeBinaryFromReader(message: UpdateUserProfileParam, reader: jspb.BinaryReader): UpdateUserProfileParam;
}

export namespace UpdateUserProfileParam {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
  }
}

export class UpdateProfileParam extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateProfileParam.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateProfileParam): UpdateProfileParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateProfileParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateProfileParam;
  static deserializeBinaryFromReader(message: UpdateProfileParam, reader: jspb.BinaryReader): UpdateProfileParam;
}

export namespace UpdateProfileParam {
  export type AsObject = {
    name: string,
    photo: string,
  }
}

export class Profile extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  clearServersList(): void;
  getServersList(): Array<ICEServer>;
  setServersList(value: Array<ICEServer>): void;
  addServers(value?: ICEServer, index?: number): ICEServer;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Profile.AsObject;
  static toObject(includeInstance: boolean, msg: Profile): Profile.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Profile, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Profile;
  static deserializeBinaryFromReader(message: Profile, reader: jspb.BinaryReader): Profile;
}

export namespace Profile {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
    serversList: Array<ICEServer.AsObject>,
  }
}

export class ICEServer extends jspb.Message {
  getUrl(): string;
  setUrl(value: string): void;

  getUsername(): string;
  setUsername(value: string): void;

  getCredentialtype(): ICECredentialTypeMap[keyof ICECredentialTypeMap];
  setCredentialtype(value: ICECredentialTypeMap[keyof ICECredentialTypeMap]): void;

  getPassword(): string;
  setPassword(value: string): void;

  getAccesstoken(): string;
  setAccesstoken(value: string): void;

  getMackey(): string;
  setMackey(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ICEServer.AsObject;
  static toObject(includeInstance: boolean, msg: ICEServer): ICEServer.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ICEServer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ICEServer;
  static deserializeBinaryFromReader(message: ICEServer, reader: jspb.BinaryReader): ICEServer;
}

export namespace ICEServer {
  export type AsObject = {
    url: string,
    username: string,
    credentialtype: ICECredentialTypeMap[keyof ICECredentialTypeMap],
    password: string,
    accesstoken: string,
    mackey: string,
  }
}

export class UserAccessToken extends jspb.Message {
  getToken(): string;
  setToken(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserAccessToken.AsObject;
  static toObject(includeInstance: boolean, msg: UserAccessToken): UserAccessToken.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserAccessToken, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserAccessToken;
  static deserializeBinaryFromReader(message: UserAccessToken, reader: jspb.BinaryReader): UserAccessToken;
}

export namespace UserAccessToken {
  export type AsObject = {
    token: string,
  }
}

export class NewRoomParam extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  getDescription(): string;
  setDescription(value: string): void;

  clearUseridsList(): void;
  getUseridsList(): Array<string>;
  setUseridsList(value: Array<string>): void;
  addUserids(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewRoomParam.AsObject;
  static toObject(includeInstance: boolean, msg: NewRoomParam): NewRoomParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewRoomParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewRoomParam;
  static deserializeBinaryFromReader(message: NewRoomParam, reader: jspb.BinaryReader): NewRoomParam;
}

export namespace NewRoomParam {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
    description: string,
    useridsList: Array<string>,
  }
}

export class Room extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  getDescription(): string;
  setDescription(value: string): void;

  clearUsersList(): void;
  getUsersList(): Array<User>;
  setUsersList(value: Array<User>): void;
  addUsers(value?: User, index?: number): User;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Room.AsObject;
  static toObject(includeInstance: boolean, msg: Room): Room.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Room, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Room;
  static deserializeBinaryFromReader(message: Room, reader: jspb.BinaryReader): Room;
}

export namespace Room {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
    description: string,
    usersList: Array<User.AsObject>,
  }
}

export class UpdateRoomProfileParam extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  getDescription(): string;
  setDescription(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateRoomProfileParam.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateRoomProfileParam): UpdateRoomProfileParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateRoomProfileParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateRoomProfileParam;
  static deserializeBinaryFromReader(message: UpdateRoomProfileParam, reader: jspb.BinaryReader): UpdateRoomProfileParam;
}

export namespace UpdateRoomProfileParam {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
    description: string,
  }
}

export class Rooms extends jspb.Message {
  clearRoomsList(): void;
  getRoomsList(): Array<Room>;
  setRoomsList(value: Array<Room>): void;
  addRooms(value?: Room, index?: number): Room;

  getCount(): number;
  setCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Rooms.AsObject;
  static toObject(includeInstance: boolean, msg: Rooms): Rooms.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Rooms, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Rooms;
  static deserializeBinaryFromReader(message: Rooms, reader: jspb.BinaryReader): Rooms;
}

export namespace Rooms {
  export type AsObject = {
    roomsList: Array<Room.AsObject>,
    count: number,
  }
}

export class UserRoomParam extends jspb.Message {
  getUserid(): string;
  setUserid(value: string): void;

  getRoomid(): string;
  setRoomid(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserRoomParam.AsObject;
  static toObject(includeInstance: boolean, msg: UserRoomParam): UserRoomParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserRoomParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserRoomParam;
  static deserializeBinaryFromReader(message: UserRoomParam, reader: jspb.BinaryReader): UserRoomParam;
}

export namespace UserRoomParam {
  export type AsObject = {
    userid: string,
    roomid: string,
  }
}

export class GetRoomParam extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetRoomParam.AsObject;
  static toObject(includeInstance: boolean, msg: GetRoomParam): GetRoomParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetRoomParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetRoomParam;
  static deserializeBinaryFromReader(message: GetRoomParam, reader: jspb.BinaryReader): GetRoomParam;
}

export namespace GetRoomParam {
  export type AsObject = {
    id: string,
  }
}

export class PaginationParam extends jspb.Message {
  getOffset(): number;
  setOffset(value: number): void;

  getLimit(): number;
  setLimit(value: number): void;

  getKeyword(): string;
  setKeyword(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PaginationParam.AsObject;
  static toObject(includeInstance: boolean, msg: PaginationParam): PaginationParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PaginationParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PaginationParam;
  static deserializeBinaryFromReader(message: PaginationParam, reader: jspb.BinaryReader): PaginationParam;
}

export namespace PaginationParam {
  export type AsObject = {
    offset: number,
    limit: number,
    keyword: string,
  }
}

export class SDPParam extends jspb.Message {
  getDescription(): string;
  setDescription(value: string): void;

  getUserid(): string;
  setUserid(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SDPParam.AsObject;
  static toObject(includeInstance: boolean, msg: SDPParam): SDPParam.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SDPParam, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SDPParam;
  static deserializeBinaryFromReader(message: SDPParam, reader: jspb.BinaryReader): SDPParam;
}

export namespace SDPParam {
  export type AsObject = {
    description: string,
    userid: string,
  }
}

export class SDP extends jspb.Message {
  getType(): SDPTypesMap[keyof SDPTypesMap];
  setType(value: SDPTypesMap[keyof SDPTypesMap]): void;

  getDescription(): string;
  setDescription(value: string): void;

  getSenderid(): string;
  setSenderid(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SDP.AsObject;
  static toObject(includeInstance: boolean, msg: SDP): SDP.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SDP, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SDP;
  static deserializeBinaryFromReader(message: SDP, reader: jspb.BinaryReader): SDP;
}

export namespace SDP {
  export type AsObject = {
    type: SDPTypesMap[keyof SDPTypesMap],
    description: string,
    senderid: string,
  }
}

export class RoomEvent extends jspb.Message {
  getEvent(): RoomEventsMap[keyof RoomEventsMap];
  setEvent(value: RoomEventsMap[keyof RoomEventsMap]): void;

  hasTime(): boolean;
  clearTime(): void;
  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): void;

  hasRoomparticipant(): boolean;
  clearRoomparticipant(): void;
  getRoomparticipant(): RoomParticipantEventPayload | undefined;
  setRoomparticipant(value?: RoomParticipantEventPayload): void;

  hasRoominstance(): boolean;
  clearRoominstance(): void;
  getRoominstance(): RoomInstanceEventPayload | undefined;
  setRoominstance(value?: RoomInstanceEventPayload): void;

  hasUserinstance(): boolean;
  clearUserinstance(): void;
  getUserinstance(): UserInstanceEventPayload | undefined;
  setUserinstance(value?: UserInstanceEventPayload): void;

  getPayloadCase(): RoomEvent.PayloadCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomEvent.AsObject;
  static toObject(includeInstance: boolean, msg: RoomEvent): RoomEvent.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomEvent;
  static deserializeBinaryFromReader(message: RoomEvent, reader: jspb.BinaryReader): RoomEvent;
}

export namespace RoomEvent {
  export type AsObject = {
    event: RoomEventsMap[keyof RoomEventsMap],
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    roomparticipant?: RoomParticipantEventPayload.AsObject,
    roominstance?: RoomInstanceEventPayload.AsObject,
    userinstance?: UserInstanceEventPayload.AsObject,
  }

  export enum PayloadCase {
    PAYLOAD_NOT_SET = 0,
    ROOMPARTICIPANT = 4,
    ROOMINSTANCE = 5,
    USERINSTANCE = 6,
  }
}

export class RoomParticipantEventPayload extends jspb.Message {
  getParticipantid(): string;
  setParticipantid(value: string): void;

  getRoomid(): string;
  setRoomid(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomParticipantEventPayload.AsObject;
  static toObject(includeInstance: boolean, msg: RoomParticipantEventPayload): RoomParticipantEventPayload.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomParticipantEventPayload, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomParticipantEventPayload;
  static deserializeBinaryFromReader(message: RoomParticipantEventPayload, reader: jspb.BinaryReader): RoomParticipantEventPayload;
}

export namespace RoomParticipantEventPayload {
  export type AsObject = {
    participantid: string,
    roomid: string,
  }
}

export class RoomInstanceEventPayload extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  getDescription(): string;
  setDescription(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoomInstanceEventPayload.AsObject;
  static toObject(includeInstance: boolean, msg: RoomInstanceEventPayload): RoomInstanceEventPayload.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoomInstanceEventPayload, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoomInstanceEventPayload;
  static deserializeBinaryFromReader(message: RoomInstanceEventPayload, reader: jspb.BinaryReader): RoomInstanceEventPayload;
}

export namespace RoomInstanceEventPayload {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
    description: string,
  }
}

export class UserInstanceEventPayload extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getName(): string;
  setName(value: string): void;

  getPhoto(): string;
  setPhoto(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserInstanceEventPayload.AsObject;
  static toObject(includeInstance: boolean, msg: UserInstanceEventPayload): UserInstanceEventPayload.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserInstanceEventPayload, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserInstanceEventPayload;
  static deserializeBinaryFromReader(message: UserInstanceEventPayload, reader: jspb.BinaryReader): UserInstanceEventPayload;
}

export namespace UserInstanceEventPayload {
  export type AsObject = {
    id: string,
    name: string,
    photo: string,
  }
}

export interface ICECredentialTypeMap {
  PASSWORD: 0;
  OAUTH: 1;
}

export const ICECredentialType: ICECredentialTypeMap;

export interface SDPTypesMap {
  OFFER: 0;
  ANSWER: 1;
  PRANSWER: 2;
  ROLLBACK: 3;
}

export const SDPTypes: SDPTypesMap;

export interface RoomEventsMap {
  USERLEFTROOM: 0;
  USERJOINEDROOM: 1;
  ROOMCREATED: 2;
  ROOMPROFILEUPDATED: 3;
  ROOMDESTROYED: 4;
  USERREGISTERED: 5;
  USERPROFILEUPDATED: 6;
  USERREMOVED: 7;
}

export const RoomEvents: RoomEventsMap;

