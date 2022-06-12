export type DriveItemUrlMessage = {
  driveItemUrlWithAuthToken: string;
}

export type MRIAndTimestamp = {
  mri: string;
  timestamp: number;
}

interface Emotion {
  name: string;
  users: MRIAndTimestamp[];
}

export interface BaseMessage {
  id: string;
  content: string;
  timestamp: number;
  sender: string;
}

export interface ChatMessage extends BaseMessage {
  emotions: Emotion[];
}

type CountMap = Record<string, number>;
export interface EmotionPluginMetadata {
  emotions: CountMap;
}

type BaseReplyChainMessage = {
  id: string;
  sequenceId: number;
  content: string;
  originalArrivalTime: number;
  imDisplayName: string;
  properties: {
    emotions: {
      key: string;
      users: {
        mri: string;
        time: number;
      }[];
    }[];
    atp: string;
    deletetime: string;
  };
  messageType: string;
  isSentByCurrentUser: boolean;
}

type BaseReplyChainManagerByMessageSearchKeysResult = {
  messageMap: Record<string, BaseReplyChainMessage>;
}

type Modify<T, R> = Omit<T, keyof R> & R;