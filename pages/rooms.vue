<template>
  <v-app dark>
    <v-navigation-drawer app clipped width="300px">
      <v-list two-line dense>
        <template v-for="(room, index) in rooms">
          <v-list-item :key="room.id" @click="openRoom(room)">
            <v-list-item-avatar>
              <v-img :src="room.photo"></v-img>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                {{ room.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-icon class="mr-1" x-small>mdi-check-all</v-icon>
                {{ room.description }}
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
      <v-list-item>
        <v-list-item-avatar>
          <v-img :src="activeRoom.photo"></v-img>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>
            {{ activeRoom.name }}
          </v-list-item-title>
          <v-list-item-subtitle>
            typings...
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-btn icon>
        <v-icon>mdi-phone</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <v-list dense>
        <div v-for="conversation in conversations" :key="conversation.id">
          <template v-if="conversation.receive">
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
                <v-icon v-else x-small>
                  mdi-check
                </v-icon>
              </div>
            </v-sheet>
          </template>
        </div>
      </v-list>
    </v-content>

    <v-footer app fixed inset paddless>
      <v-textarea
        rows="1"
        autofocus
        draggable
        append-outer-icon="mdi-send"
        prepend-icon="mdi-paperclip"
        label="write some message"
        name="message"
        required
        @click:append-outer="sendMessage"
        @click:prepend="uploadFile"
      />
    </v-footer>
  </v-app>
</template>

<script lang="ts" src="./rooms.ts"></script>
