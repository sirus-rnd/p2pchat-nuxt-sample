import { Observable, Subject } from 'rxjs';
import { Conversation, UserInRoomEventPayload } from './p2p-chat';

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
  onConnected: Observable<void> = this._onConnected.asObservable();
  onDisconnected: Observable<string> = this._onDisconnected.asObservable();
  onMessageReceived = this._onMessageReceived.asObservable();
  onMessageRead = this._onMessageRead.asObservable();
  onReceiveMessage = this._onReceiveMessage.asObservable();
  onUserTyping = this._onUserTyping.asObservable();

  constructor(public id: string, public name: string, public photo: string) {}
}
