import { makeObjectStoreIndexKey, makeReplyChainManagerDbName } from "./replychain-manager";

describe('replychain manager', () => {
  it('makes a corrent database name from tid and oid', () => {
    const tid = 'ba37ec55-8c34-406a-a1c3-9e03a5dbaa84';
    const oid = '2bc4d201-d903-46cc-9ccc-98d2daba6e5e';
    
    const dbName = makeReplyChainManagerDbName(tid, oid);

    expect(dbName).toBe(`Teams:replychain-manager:${tid}:${oid}`);
  });

  it('makes a correct index key from thread id and reply chain id', () => {
    const threadId = '27:64c27a40f2754439bb4327d78b381b38';
    const replyChainId = 'thread.tacv2_1627272763717';

    const indexKey = makeObjectStoreIndexKey(threadId, replyChainId);

    expect(indexKey).toBe(`${threadId}_${replyChainId}`);
  });
})