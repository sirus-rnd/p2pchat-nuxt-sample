import { Middleware } from '@nuxt/types';

const authenticated: Middleware = async (ctx) => {
  const ok = await ctx.$p2pchat.authenticated();
  if (!ok) {
    return ctx.redirect('/login');
  }
};

export default authenticated;
