#!/usr/bin/env node

const HyperDHT = require('hyperdht');
const net = require('net');
const argv = require('minimist')(process.argv.slice(2));
const libNet = require('@hyper-cmd/lib-net');
const libUtils = require('@hyper-cmd/lib-utils');
const libKeys = require('@hyper-cmd/lib-keys');
const connPiper = libNet.connPiper;

const helpMsg = 'Usage:\nhyperproxy -i identity.json -s peer_key';

if (argv.help) {
  console.log(helpMsg);
  process.exit(-1);
}

const conf = {};

if (argv.s) {
  conf.peer = libUtils.resolveHostToKey([], argv.s);
}

if (!conf.keepAlive) {
  conf.keepAlive = 5000;
}

const peer = conf.peer;
if (!peer) {
  console.error('Error: peer is invalid');
  process.exit(-1);
}

let keyPair = null;
if (argv.i) {
  keyPair = libUtils.resolveIdentity([], argv.i);

  if (!keyPair) {
    console.error('Error: identity file invalid');
    process.exit(-1);
  }

  keyPair = libKeys.parseKeyPair(keyPair);
}

const dht = new HyperDHT({
  keyPair,
});

const proxy = net.createServer((c) => {
  return connPiper(
    c,
    () => {
      const stream = dht.connect(Buffer.from(peer, 'hex'));
      stream.setKeepAlive(conf.keepAlive);

      return stream;
    },
    {},
    {}
  );
});

proxy.listen(0, function () {
  console.log(proxy.address());

  // const { port } = proxy.address()

  // spawn('ssh', sshArgs(username, port), {
  //   stdio: 'inherit'
  // }).once('exit', function (code) {
  //   process.exit(code)
  // })
});

process.once('SIGINT', () => {
  dht.destroy().then(() => {
    process.exit();
  });
});
