import { BaseReplyChainManagerByMessageSearchKeysResult, BaseReplyChainMessage } from "../shared/types";

export async function createReplyChainManagerConnection(tid: string, oid: string): Promise<IDBDatabase> {
  const dbName = makeReplyChainManagerDbName(tid, oid);
  const request = indexedDB.open(dbName, 1);

  return new Promise((resolve, reject) => {
    request.onsuccess = event => {
      const db = (event.target as any).result as IDBDatabase;
      resolve(db);
    }
    request.onerror = _event => {
      reject();
    }
  });
}

export function makeReplyChainManagerDbName(tid: string, oid: string): string {
  return `Teams:replychain-manager:${tid}:${oid}`;
}


export async function queryReplyChainMessages(db: IDBDatabase, threadId: string, replyChainId: string): Promise<BaseReplyChainMessage[]> {
  const objectStoreIndexKey = makeObjectStoreIndexKey(threadId, replyChainId);

  const transaction = db.transaction('replychains');
  const objectStore = transaction.objectStore('replychains');
  const index = objectStore.index('byMessageSearchKeys');
  const request = index.get(objectStoreIndexKey);

  return new Promise((resolve, reject) => {
    request.onsuccess = event => {
      const result = (event.target as any).result as BaseReplyChainManagerByMessageSearchKeysResult;
      resolve(Object.values(result.messageMap));
    }
    request.onerror = _event => {
      reject();
    }
  });
}

export function makeObjectStoreIndexKey(threadId: string, replyChainId: string) {
  return `${threadId}_${replyChainId}`;
}
