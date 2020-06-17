const { resolve } = require('path');

const p2pChatModule = function(moduleOptions) {
  const options = Object.assign({}, this.options.p2pchat, moduleOptions);

  /* eslint-disable no-console */
  console.log('p2p chat module config', options);

  // add edge central client plugin
  this.addPlugin({
    options,
    src: resolve(__dirname, './plugin.ts')
  });
};

module.exports = p2pChatModule;
module.exports.default = p2pChatModule;
