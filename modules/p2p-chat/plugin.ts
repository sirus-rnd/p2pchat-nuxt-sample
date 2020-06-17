import Vue from 'vue';
import { Store } from 'vuex';
import { Plugin } from '@nuxt/types';
import { createNewClient, P2PLogLevel } from '@sirusdev/p2pchat-browser-sdk';

const p2pChatPlugin: Plugin = async (ctx, inject) => {
  // setup signalling client, storage & conversation manager
  const signalingUrl = '<%= options.signalingUrl %>';
  const logLevel = '<%= options.logLevel %>' as P2PLogLevel;

  // create p2p chat client
  const client = await createNewClient({
    signalingUrl,
    logLevel
  });
  ctx.$p2pchat = client;
  ctx.app.$p2pchat = client;
  Vue.prototype.$p2pchat = client;
  Store.prototype.$p2pchat = client;

  // inject into vue hooks
  inject('$p2pchat', client);
};

export default p2pChatPlugin;
