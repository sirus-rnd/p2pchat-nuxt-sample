import { IChatClient, P2PChatOptions } from '@sirusdev/p2pchat-browser-sdk';

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
