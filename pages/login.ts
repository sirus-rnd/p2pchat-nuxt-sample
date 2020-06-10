import { Component, Vue } from 'vue-property-decorator';

@Component
export default class LoginPage extends Vue {
  loading = false;
  valid = false;
  errorToast = false;
  errorMessage = '';
  token = '';
  tokenRules = [
    (v: string) => (!!v && v?.length > 0) || 'access token is mandatory'
  ];

  async connect() {
    this.loading = true;
    try {
      await this.$p2pchat.connect(this.token);
      this.$router.push({ path: '/rooms' });
    } catch (err) {
      this.errorToast = true;
      this.errorMessage = err.message || err.toString();
    }
    this.loading = false;
  }
}
