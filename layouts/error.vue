<template>
  <v-app>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md5 class="text-center">
        <v-icon x-large class="mb-4" color="warning">mdi-alert-outline</v-icon>
        <h1 class="headline warning--text">
          <template v-if="error.statusCode === 404"
            >Halaman Tidak Ditemukan</template
          >
          <template v-else-if="error.statusCode === 403"
            >Anda tidak memiliki hak akses</template
          >
          <template v-else-if="error.statusCode === 400"
            >Parameter request salah</template
          >
          <template v-else>Gagal membuka halaman</template>
        </h1>
      </v-flex>
    </v-layout>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({
  layout: 'blank'
})
/**
 * Nuxt Error page
 */
export default class NuxtError extends Vue {
  scrollToTop = true;
  @Prop({ default: { statusCode: null }, type: Object }) error;
}
</script>
