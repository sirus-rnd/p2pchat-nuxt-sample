import { Component, Vue } from 'vue-property-decorator';

@Component
/**
 * This page use as default routes
 *
 * @export
 * @class IndexPage
 * @extends {Vue}
 */
export default class IndexPage extends Vue {
  mounted() {
    this.$router.push({ path: '/rooms' });
  }
}
