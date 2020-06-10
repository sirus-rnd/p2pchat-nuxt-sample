import { IChatClient } from '~/plugins/p2p-chat/p2p-chat';

interface P2PChatOptions {
  signallingHost: string;
}

declare module 'vue/types/vue' {
  interface Vue {
    $p2pchat: IChatClient;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $p2pchat: IChatClient;
  }
}

declare module '@nuxt/types' {
  interface Context {
    $p2pchat: IChatClient;
  }
  interface Configuration {
    p2pchat: P2PChatOptions;
  }
}
