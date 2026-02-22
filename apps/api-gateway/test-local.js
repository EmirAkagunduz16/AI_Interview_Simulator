const path = require('path');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');

const PROTO_PATH = path.join(__dirname, '../../packages/grpc/src/proto/auth.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const authProto = grpc.loadPackageDefinition(packageDefinition).auth;
const client = new authProto.AuthService('localhost:50051', grpc.credentials.createInsecure());

client.ValidateToken({ accessToken: 'test-token' }, (err, response) => {
  if (err) console.error("Error with accessToken:", err);
  else console.log("Response with accessToken:", response);

  client.ValidateToken({ access_token: 'test-token' }, (err, response) => {
    if (err) console.error("Error with access_token:", err);
    else console.log("Response with access_token:", response);
    process.exit(0);
  });
});
