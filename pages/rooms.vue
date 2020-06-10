<template>
  <v-app dark>
    <v-navigation-drawer app clipped width="300px">
      <v-progress-linear v-if="loadingRoom" indeterminate></v-progress-linear>
      <v-list two-line dense>
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
          <v-divider :key="index" inset />
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-left color="primary">
      <div style="width:300px" class="mr-2">
        <v-text-field
          placeholder="Search..."
          single-line
          append-icon="mdi-magnify"
          hide-details
        ></v-text-field>
      </div>
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
          <template
            v-if="conversation.receive"
            @focus="readConversation(conversation)"
          >
            <v-sheet elevation="2" class="ma-4 mr-12 pa-2">
              <div class="caption primary--text">{{ activeRoom.name }}</div>
              <div class="body-2">{{ conversation.message }}</div>
              <div class="caption">{{ conversation.sentAt | ago }}</div>
            </v-sheet>
          </template>
          <template v-else>
            <v-sheet color="secondary" elevation="2" class="ma-4 ml-12 pa-2">
              <div class="body-2">{{ conversation.message }}</div>
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
      <v-text-field
        v-model="message"
        :disabled="!couldSendMessage"
        autofocus
        draggable
        append-outer-icon="mdi-send"
        prepend-icon="mdi-paperclip"
        label="write some message"
        name="message"
        autocomplete="off"
        required
        @keyup="typing()"
        @keyup.enter="send(message)"
        @click:append-outer="send(message)"
        @click:prepend="uploadFile"
      />
    </v-footer>
  </v-app>
</template>

<script lang="ts" src="./rooms.ts"></script>
