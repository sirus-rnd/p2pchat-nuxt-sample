import { company, random, internet, lorem, date } from 'faker';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Mutation, State, Action } from 'vuex-class';
import { AgoFilter } from '~/filters/ago';
import { RootState } from '~/store';
import { Room, Conversation } from '~/store/room';

@Component({
  middleware: ['authenticated'],
  filters: {
    ago: AgoFilter
  }
})
export default class RoomsPage extends Vue {
  @State((state: RootState) => state?.room?.loadingRoom)
  loadingRoom: boolean;
  @State((state: RootState) => state?.room?.error) error: Error;
  @State((state: RootState) => state?.room?.rooms) rooms: Room[];
  @State((state: RootState) => state?.room?.activeRoom) activeRoom: Room;
  @State((state: RootState) => state?.room?.loadingConversation)
  loadingConversation: boolean;
  @State((state: RootState) => state?.room?.conversations)
  conversations: Conversation[];

  @Action('room/loadRooms') loadRooms;
  @Action('room/selectRoom') selectRoom;
  @Action('room/loadNextConversation') loadNextConversation;
  @Action('room/typeMessage') typeMessage;
  @Action('room/sendMessage') sendMessage;
  @Action('room/readMessage') readMessage;
  @Action('room/subscribeConversationActivity') subscribeConversationActivity;

  drawer = true;
  message: string = '';

  @Watch('conversations')
  onConversationsUpdated() {
    this.$vuetify.goTo(document.body.scrollHeight);
  }

  get couldSendMessage(): boolean {
    return !this.loadingConversation && !this.loadingRoom && !!this.activeRoom;
  }

  async mounted() {
    await this.$p2pchat.connect();
    await this.loadRooms();
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

  uploadFile() {}
}
