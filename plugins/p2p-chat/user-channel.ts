import { Observable, Subject } from 'rxjs';
import { Conversation, UserInRoomEventPayload, FileContent } from './p2p-chat';

export class UserChannel {
  connected: boolean;
  roomIDs: string[] = [];
  localConnection: RTCPeerConnection;
  remoteConnection: RTCPeerConnection;
  sendChannel: RTCDataChannel;
  receiveChannel: RTCDataChannel;
  _onConnected = new Subject<void>();
  _onDisconnected = new Subject<string>();
  _onMessageReceived = new Subject<Conversation>();
  _onReceiveMessage = new Subject<Conversation>();
  _onMessageRead = new Subject<Conversation>();
  _onUserTyping = new Subject<UserInRoomEventPayload>();
  _onFileTransferStart = new Subject<FileContent>();
  _onReceiveFileChunk = new Subject<FileContent>();
  _onFileTransferEnd = new Subject<FileContent>();
  onConnected: Observable<void> = this._onConnected.asObservable();
  onDisconnected: Observable<string> = this._onDisconnected.asObservable();
  onMessageReceived = this._onMessageReceived.asObservable();
  onMessageRead = this._onMessageRead.asObservable();
  onReceiveMessage = this._onReceiveMessage.asObservable();
  onUserTyping = this._onUserTyping.asObservable();
  onFileTransferStart = this._onFileTransferStart.asObservable();
  onReceiveFileChunk = this._onReceiveFileChunk.asObservable();
  onFileTransferEnd = this._onFileTransferEnd.asObservable();

  constructor(
    public id: string,
    public name: string,
    public photo: string,
    public online: boolean
  ) {}
}
