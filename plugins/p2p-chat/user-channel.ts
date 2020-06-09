import { Observable, Subject } from 'rxjs';
import {
  NewMessagePayload,
  MessageReadPayload,
  TypingPayload,
  MessageReceivedPayload
} from './messaging';

export class UserChannel {
  connected: boolean;
  roomIDs: string[] = [];
  localConnection: RTCPeerConnection;
  remoteConnection: RTCPeerConnection;
  sendChannel: RTCDataChannel;
  receiveChannel: RTCDataChannel;
  _onConnected = new Subject<void>();
  _onDisconnected = new Subject<string>();
  _onMessageSent = new Subject<NewMessagePayload>();
  _onMessageReceived = new Subject<MessageReceivedPayload>();
  _onReceiveMessage = new Subject<NewMessagePayload>();
  _onMessageRead = new Subject<MessageReadPayload>();
  _onUserTyping = new Subject<TypingPayload>();
  onConnected: Observable<void> = this._onConnected.asObservable();
  onDisconnected: Observable<string> = this._onDisconnected.asObservable();
  onMessageSent = this._onMessageSent.asObservable();
  onMessageReceived = this._onMessageReceived.asObservable();
  onMessageRead = this._onMessageRead.asObservable();
  onReceiveMessage = this._onReceiveMessage.asObservable();
  onUserTyping = this._onUserTyping.asObservable();

  constructor(public id: string, public name: string, public photo: string) {}
}
