export type DriveItemUrlMessage = {
  driveItemUrlWithAuthToken: string;
}

interface ChatMessageUserAndTimestamp {
  mri: string;
  timestamp: number;
}

interface Emotion {
  name: string;
  users: ChatMessageUserAndTimestamp[];
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