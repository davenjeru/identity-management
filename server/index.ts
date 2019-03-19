import fs from 'fs';
import grpc from 'grpc';
import https from 'https';
import { basename, resolve } from 'path';
import env from './config';
import { serverLogger } from './loggers';
import procedures from './procedures';
import grpcServer from './server';

process.once('unhandledRejection', ((reason) => {console.error(reason); process.exit(); }));

const IDENTITY_PROTO = resolve(__dirname, './identity.proto');

const getProtocolBuffer = async () => {
  const {PROTOBUF_URL, PROTOBUF_USER, PROTOBUF_BRANCH } = env;
  const PROTO_PATH = `${PROTOBUF_URL}${PROTOBUF_USER}/proto-broker/${PROTOBUF_BRANCH}/`;
  return new Promise((fulfil, reject) => {
    const PROTO_URL = `${PROTO_PATH}${basename(IDENTITY_PROTO)}`;
    https.get(PROTO_URL, (response) => {
      response.setEncoding('utf-8');
      const writeStream = fs.createWriteStream(IDENTITY_PROTO);
      writeStream.on('close', () => {
        serverLogger(`Successfully retrieved protocol buffers from ${PROTO_URL}`);
        fulfil();
        },
      );
      response.on('error', reject);
      writeStream.on('error', reject);
      // Received the error below when trying to do response.on('end', writeStream.close);
      // TypeError: this.end is not a function
      response.on('end', () => writeStream.close());
      response.pipe(writeStream);
    });
  });
};

process.nextTick(async () => {
  await getProtocolBuffer();
  // tslint:disable-next-line: no-var-requires
  const protoLoader = require('@grpc/proto-loader');
  const identityPackageDefinition = protoLoader.loadSync(
    IDENTITY_PROTO,
    {keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
  const identityDescriptor = grpc.loadPackageDefinition(identityPackageDefinition);
  const { IdentityService }: any = identityDescriptor;

  grpcServer.addService(IdentityService.service, procedures);
  grpcServer.start();
});
