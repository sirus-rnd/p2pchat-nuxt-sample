<template>
  <v-app dark>
    <v-navigation-drawer v-model="drawer" app width="300px">
      <v-list two-line dense>
        <v-progress-linear
          v-if="loadingProfile"
          indeterminate
        ></v-progress-linear>
        <v-list-item v-if="profile">
          <v-list-item-avatar>
            <v-img :src="profile.photo"></v-img>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              {{ profile.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              @{{ profile.id }} {{ profile.online ? 'online' : 'offline' }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-subheader>room list</v-subheader>
        <v-progress-linear v-if="loadingRoom" indeterminate></v-progress-linear>
        <template v-for="(room, index) in rooms">
          <v-list-item :key="room.id" @click="selectRoom(room.id)">
            <v-list-item-avatar>
              <v-img :src="room.photo"></v-img>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                {{ room.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <template v-if="room.typings.length > 0">
                  <span v-for="typer in room.typings" :key="typer">
                    {{ typer }}
                  </span>
                  typings...
                </template>
                <template v-else-if="room.lastConversation.length > 0">
                  {{ room.lastConversation }}
                </template>
                <template v-else>
                  {{ room.description }}
                </template>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-divider :key="index" :inset="index < rooms.length - 1" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary">
      <v-btn icon @click="drawer = !drawer">
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
      <template v-if="activeRoom">
        <v-list-item>
          <v-list-item-avatar>
            <v-img :src="activeRoom.photo"></v-img>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              {{ activeRoom.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              <template v-if="activeRoom.typings.length > 0">
                <span v-for="typer in activeRoom.typings" :key="typer">
                  {{ typer }}
                </span>
                typings...
              </template>
              <template v-else-if="activeRoom.lastConversation.length > 0">
                {{ activeRoom.lastConversation }}
              </template>
              <template v-else>
                {{ activeRoom.description }}
              </template>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-btn icon disabled>
          <v-icon>mdi-phone</v-icon>
        </v-btn>
      </template>
      <v-spacer></v-spacer>
      <v-btn icon @click="reconnect()">
        <v-icon>mdi-reload</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <v-progress-linear
        v-if="loadingConversation"
        indeterminate
      ></v-progress-linear>
      <v-list dense>
        <div v-for="conversation in conversations" :key="conversation.id">
          <template v-if="conversation.receive">
            <v-sheet
              elevation="2"
              class="ma-4 mr-12 pa-2"
              @click.stop="readConversation(conversation)"
            >
              <div class="caption primary--text">{{ conversation.sender }}</div>
              <div v-if="conversation.type === 0" class="body-2">
                {{ conversation.message }}
              </div>
              <template v-else>
                <div class="body-2">
                  {{ conversation.message.name }} <br />
                  ({{ conversation.message.size }} bytes) <br />
                </div>
                <template v-if="conversation.message.downloaded >= 1">
                  <template v-if="conversation.type === 1">
                    <img
                      width="100%"
                      :src="blobToImage(conversation.message.binary)"
                    />
                  </template>
                  <template v-else-if="conversation.type === 2">
                    <a
                      :download="conversation.message.name"
                      :href="blobToUrl(conversation.message.binary)"
                    >
                      download
                    </a>
                  </template>
                </template>
                <div v-else class="d-flex align-start">
                  <v-progress-linear
                    class="my-3 mr-2 flex-grow-1"
                    rounded
                    color="primary"
                    :value="100 * conversation.message.downloaded"
                  ></v-progress-linear>
                  <v-btn
                    icon
                    small
                    @click.stop="requestFileTransfer(conversation.message.id)"
                  >
                    <v-icon small>mdi-download</v-icon>
                  </v-btn>
                </div>
              </template>
              <div class="caption">{{ conversation.sentAt | ago }}</div>
            </v-sheet>
          </template>
          <template v-else>
            <v-sheet color="secondary" elevation="2" class="ma-4 ml-12 pa-2">
              <div v-if="conversation.type === 0" class="body-2">
                {{ conversation.message }}
              </div>
              <template v-else>
                <div class="body-2">
                  {{ conversation.message.name }} <br />
                  ({{ conversation.message.size }} bytes) <br />
                </div>
                <template v-if="conversation.type === 1">
                  <img
                    width="100%"
                    :src="blobToImage(conversation.message.binary)"
                  />
                </template>
                <template v-else-if="conversation.type === 2">
                  <a
                    :download="conversation.message.name"
                    :href="blobToUrl(conversation.message.binary)"
                  >
                    download
                  </a>
                </template>
              </template>
              <div class="d-flex caption">
                <span>{{ conversation.sentAt | ago }}</span>
                <v-spacer />
                <v-icon v-if="conversation.read" x-small color="success">
                  mdi-check-all
                </v-icon>
                <v-icon v-else-if="conversation.received" x-small>
                  mdi-check
                </v-icon>
                <v-icon v-else-if="conversation.failed" x-small>
                  mdi-alert
                </v-icon>
              </div>
            </v-sheet>
          </template>
        </div>
      </v-list>
    </v-content>

    <v-footer app fixed inset paddless>
      <v-file-input
        v-model="messageFile"
        :disabled="!couldSendMessage"
        hide-input
        :clearable="false"
      />
      <v-text-field
        v-model="message"
        :disabled="!couldSendMessage"
        autofocus
        draggable
        append-outer-icon="mdi-send"
        label="write some message"
        name="message"
        autocomplete="off"
        required
        @keyup="typing()"
        @keyup.enter="send(message)"
        @click:append-outer="send(message)"
      />
    </v-footer>
  </v-app>
</template>

<script lang="ts" src="./rooms.ts"></script>
