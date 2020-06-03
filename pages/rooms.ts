import { company, random, internet, lorem, date } from 'faker';
import { Component, Vue } from 'vue-property-decorator';
import { Room } from '~/protos/signalling_pb';
import { AgoFilter } from '~/filters/ago';

interface Conversation {
  id: string;
  receive?: boolean;
  message: string;
  sentAt: Date;
  read?: boolean;
  sent?: boolean;
}

@Component({
  filters: {
    ago: AgoFilter
  }
})
export default class RoomsPage extends Vue {
  rooms: Room.AsObject[] = [];
  conversations: Conversation[] = [];
  activeRoom: Room.AsObject = {
    id: '',
    name: '',
    photo: '',
    description: '',
    usersList: []
  };

  mounted() {
    this.rooms = this.fakeRooms(22);
    this.activeRoom = random.arrayElement(this.rooms);
  }

  sendMessage() {}
  uploadFile() {}

  openRoom(room: Room.AsObject) {
    this.conversations = this.fakeConversations(54);
    this.activeRoom = room;
  }

  fakeRooms(n: number = 20): Room.AsObject[] {
    const rooms: Room.AsObject[] = [];
    for (let i = 0; i < n; i++) {
      rooms.push({
        id: random.alphaNumeric(12),
        name: company.companyName(),
        photo: internet.avatar(),
        description: lorem.sentence(10),
        usersList: []
      });
    }
    return rooms;
  }

  fakeConversations(n: number = 20): Conversation[] {
    const conversations: Conversation[] = [];
    for (let i = 0; i < n; i++) {
      const receive = random.boolean();
      const sent = random.boolean();
      conversations.push({
        id: random.alphaNumeric(12),
        receive,
        message: lorem.sentence(10),
        sentAt: date.recent(),
        read: sent ? random.boolean() : false,
        sent
      });
    }
    return conversations;
  }
}
