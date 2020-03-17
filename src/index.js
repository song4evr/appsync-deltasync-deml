"use strict";
/**
* This shows how to use standard Apollo client on Node.js
*/
const fs = require('fs');
const localJsonFile = require('yargs').argv._[0]+'.json';
console.log(localJsonFile)
global.WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');

// Require exports file with endpoint and auth info
const aws_exports = require('./aws-exports').default;

// Require AppSync module
const AUTH_TYPE = require('aws-appsync/lib/link/auth-link').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;

const url = aws_exports.ENDPOINT;
const region = aws_exports.REGION;
const type = AUTH_TYPE.API_KEY;

const getPost = require('./graphql/queries').getPost;

// If you want to use API key-based auth
const apiKey = aws_exports.APIKEY;
// If you want to use a jwtToken from Amazon Cognito identity:
const jwtToken = 'xxxxxxxx';

// If you want to use AWS...
const AWS = require('aws-sdk');
AWS.config.update({
    region: aws_exports.REGION,
    credentials: new AWS.Credentials({
        accessKeyId: aws_exports.AWS_ACCESS_KEY_ID,
        secretAccessKey: aws_exports.AWS_SECRET_ACCESS_KEY
    })
});
const credentials = AWS.config.credentials;

// Import gql helper and craft a GraphQL query
const gql = require('graphql-tag');
const query = gql(`
query SyncPosts($limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
    syncPosts(limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
      items {
        id
        author
        title
        content
        url
        ups
        downs
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`);

// Set up a subscription query
const subquery = gql(`
subscription OnCreatePost {
    onCreatePost {
      id
      author
      title
      content
    }
  }
`);

// Set up Apollo client
const client = new AWSAppSyncClient({
    url: url,
    region: region,
    auth: {
        type: type,
        apiKey: apiKey,
    },
    disableOffline: true      //Uncomment for AWS Lambda
});

let localPosts = {lastSync: null, oldCount:0, newCount: 0, oldData: [], newData:[]}
try {
    localPosts = JSON.parse(fs.readFileSync(localJsonFile));
}
catch(e){console.log(e);}

console.log('local post counts:',localPosts.oldCount+localPosts.newCount);
console.log('last synced at', new Date(localPosts.lastSync).toLocaleString());




client.hydrated().then(function (client) {
    //Now run a query
    client.query({ query: query, variables: {lastSync: localPosts.lastSync}})
    //client.query({ query: query, fetchPolicy: 'network-only' })   //Uncomment for AWS Lambda
        .then(function logData(data) {
            //console.log('results of query: ', data);
            console.log('new sync', new Date(data.data.syncPosts.startedAt).toLocaleString());
            const items = data.data.syncPosts.items;
            console.log('new post counts:', items.length);
            items.forEach(item=>{console.log(item)});
            const jsondata = {
                'lastSync': data.data.syncPosts.startedAt, 
                'oldData': localPosts.oldData.concat(items),
                'newData': items,
                'oldCount': localPosts.oldData.length,
                'newCount': items.length,
        }
            fs.writeFileSync(localJsonFile, JSON.stringify(jsondata));

        })
        .catch(console.error);

    //Now subscribe to results
    const observable = client.subscribe({ query: subquery });

    const realtimeResults = function realtimeResults(data) {
        console.log('realtime data: ', data);
    };

    observable.subscribe({
        next: realtimeResults,
        complete: console.log,
        error: console.log,
    });
});