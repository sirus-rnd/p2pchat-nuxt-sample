import { Component, Vue } from 'vue-property-decorator';

@Component
export default class LoginPage extends Vue {
  loading = false;
  valid = false;
  userid = '';
  useridRules = [(v: string) => (v && v?.length) || 'userid is mandatory'];

  login() {
    this.$router.push({ path: '/rooms' });
  }
}
