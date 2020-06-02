import colors from 'vuetify/es5/util/colors';

export default {
  breakpoint: {},
  icons: {},
  lang: {},
  rtl: false,
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: colors.teal.accent4,
        accent: colors.grey.base,
        secondary: colors.grey.darken4,
        info: colors.teal.accent3,
        warning: colors.amber.darken2,
        error: colors.red.accent2,
        success: colors.green.accent3
      },
      light: {
        primary: colors.teal.darken2,
        accent: colors.grey.base,
        secondary: colors.grey.darken4,
        info: colors.teal.accent3,
        warning: colors.amber.base,
        error: colors.red.accent2,
        success: colors.green.accent3
      }
    }
  }
};
