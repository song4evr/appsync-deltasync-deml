/* eslint-disable */
// this is an auto generated file. This will be overwritten

const getPost = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
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
  }
`;
const syncPosts = /* GraphQL */ `
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
`;

exports.getPost = getPost
exports.syncPosts = syncPosts