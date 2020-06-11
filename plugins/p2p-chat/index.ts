import Vue from 'vue';
import { Store } from 'vuex';
import consola, { FancyReporter, LogLevel } from 'consola';
import { Plugin } from '@nuxt/types';
import { createInstance, INDEXEDDB, LOCALSTORAGE, WEBSQL } from 'localforage';
import { ConversationManager } from './conversation-state';
import { ChatClient } from './client';
import { SignalingServiceClient } from '~/protos/SignallingServiceClientPb';

const p2pChatPlugin: Plugin = async (ctx, inject) => {
  // setup signalling client, storage & conversation manager
  const hostname = 'http://localhost:9012';
  const signaling = new SignalingServiceClient(hostname);
  const storage = createInstance({
    name: 'p2p-chat',
    description: 'p2p chat key-value storage',
    driver: [INDEXEDDB, LOCALSTORAGE, WEBSQL]
  });
  const conversationManager = new ConversationManager();
  await conversationManager.init();
  // setup logger
  consola.level = LogLevel.Debug;

  // create p2p chat client
  const client = new ChatClient(
    signaling,
    storage,
    conversationManager,
    consola
  );
  ctx.$p2pchat = client;
  ctx.app.$p2pchat = client;
  Vue.prototype.$p2pchat = client;
  Store.prototype.$p2pchat = client;

  // inject into vue hooks
  inject('$p2pchat', client);
};

export default p2pChatPlugin;
