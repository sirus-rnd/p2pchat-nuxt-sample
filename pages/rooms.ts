import { company, random, internet, lorem, date } from 'faker';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Mutation, State, Action } from 'vuex-class';
import { AgoFilter } from '~/filters/ago';
import { RootState } from '~/store';
import { Room, Conversation, ContentType, User } from '~/store/room';
import { MessagingType } from '~/plugins/p2p-chat/messaging';
import { MessageType } from '~/plugins/p2p-chat/p2p-chat';

@Component({
  middleware: ['authenticated'],
  filters: {
    ago: AgoFilter
  }
})
export default class RoomsPage extends Vue {
  @State((state: RootState) => state?.room?.loadingProfile)
  loadingProfile: boolean;
  @State((state: RootState) => state?.room?.loadingRoom)
  loadingRoom: boolean;
  @State((state: RootState) => state?.room?.error) error: Error;
  @State((state: RootState) => state?.room?.profile) profile: User;
  @State((state: RootState) => state?.room?.rooms) rooms: Room[];
  @State((state: RootState) => state?.room?.activeRoom) activeRoom: Room;
  @State((state: RootState) => state?.room?.loadingConversation)
  loadingConversation: boolean;
  @State((state: RootState) => state?.room?.conversations)
  conversations: Conversation[];

  @Action('room/loadProfile') loadProfile;
  @Action('room/loadRooms') loadRooms;
  @Action('room/selectRoom') selectRoom;
  @Action('room/loadNextConversation') loadNextConversation;
  @Action('room/typeMessage') typeMessage;
  @Action('room/sendMessage') sendMessage;
  @Action('room/sendFile') sendFile;
  @Action('room/requestFile') requestFile;
  @Action('room/readMessage') readMessage;
  @Action('room/subscribeConversationActivity') subscribeConversationActivity;

  drawer = true;
  message: string = '';
  messageFile: File = new File([], '');

  @Watch('conversations')
  onConversationsUpdated() {
    this.$vuetify.goTo(document.body.scrollHeight);
  }

  @Watch('messageFile')
  onMessageFileChange(file: File) {
    if (!file?.size) {
      return null;
    }
    this.uploadFile(file);
  }

  get couldSendMessage(): boolean {
    return !this.loadingConversation && !this.loadingRoom && !!this.activeRoom;
  }

  async mounted() {
    await this.$p2pchat.connect();
    await this.loadRooms();
    await this.loadProfile();
    this.subscribeConversationActivity();
  }

  typeTimer: NodeJS.Timeout;
  typing() {
    if (this.typeTimer) {
      clearTimeout(this.typeTimer);
      this.typeTimer = null;
    }
    this.typeTimer = setTimeout(() => {
      this.typeMessage();
    }, 800);
  }

  async send(msg: string) {
    await this.sendMessage(msg);
    this.message = '';
  }

  async reconnect() {
    await this.$p2pchat.reconnect();
  }

  async readConversation(conv: Conversation) {
    if (conv.read) {
      return null;
    }
    await this.readMessage(conv.id);
  }

  blobToImage(blob: Blob): string {
    if (!blob) {
      return;
    }
    try {
      return window.URL.createObjectURL(blob);
    } catch (err) {}
  }

  blobToUrl(blob: Blob): string {
    if (!blob) {
      return;
    }
    try {
      const download = new Blob([blob], { type: 'octet/stream' });
      return window.URL.createObjectURL(download);
    } catch (err) {}
  }

  isFile(fileType: ContentType): boolean {
    return fileType === ContentType.FILE || fileType === ContentType.IMAGE;
  }

  uploadFile(file: File) {
    this.sendFile(file);
  }

  async requestFileTransfer(id: string) {
    if (!id) {
      return;
    }
    try {
      await this.requestFile(id);
    } catch (err) {}
  }
}
