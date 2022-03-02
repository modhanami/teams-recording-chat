import { ChatMessage, EmotionPluginMetadata } from "../../shared/types";

// most of the these are hardcoded for now
export class ChatMessageRenderer {
  readonly messages: ChatMessage[];
  readonly startTime: number;
  readonly endTime: number;
  readonly timestampExtractor: (message: ChatMessage) => number;
  currentTime: number = 0;
  cursor: number = 0;
  currentMessages: WithMetadata<ChatMessage, Partial<EmotionPluginMetadata>>[] = [];

  constructor(messages: ChatMessage[], startTime: number, endTime: number, timestampExtractor: (message: ChatMessage) => number) {
    this.messages = messages;
    this.startTime = startTime;
    this.endTime = endTime;
    this.timestampExtractor = timestampExtractor;
  }

  seek(currentTime: number) {
    // if new current time is after the current current time, loop through the messages starting from the cursor
    if (currentTime > this.currentTime) {
      for (let i = this.cursor; i < this.messages.length; i++) {
        // shalow copy the message
        const message = { ...this.messages[i] };

        const messageWithMetadata: WithMetadata<ChatMessage, EmotionPluginMetadata> = {
          ...message,
          _metadata: { emotions: {} },
        };

        const timestamp = this.timestampExtractor(message);

        if (timestamp > currentTime) {
          break;
        }

        this.currentMessages.push(messageWithMetadata);
        this.cursor = i + 1;
      }
    }

    // if new current time is before the current current time, loop through current messages backwards and remove messages that are after the current time
    else if (currentTime < this.currentTime) {
      for (let i = this.currentMessages.length - 1; i >= 0; i--) {
        const message = this.currentMessages[i];
        const timestamp = this.timestampExtractor(message);

        if (timestamp <= currentTime) {
          break;
        }

        this.currentMessages.pop();
        this.cursor = i;
      }
    }

    // count emotions
    this.currentMessages.forEach(message => {
      const emotions = message.emotions;

      const couontMap = emotions.reduce((emotionCountMap, emotion) => {
        const emotionName = emotion.name;
        const userEmotions = emotion.users;
        let count = 0;

        for (let i = 0; i < userEmotions.length; i++) {
          const userEmotion = userEmotions[i];

          if (userEmotion.timestamp > currentTime) {
            break;
          }

          count++;
        }

        if (count > 0) {
          emotionCountMap[emotionName] = count;
        }

        return emotionCountMap;
      }, {});

      message._metadata.emotions = couontMap;
    });

    this.currentTime = currentTime;
  }
}

type Metadata<T extends Record<string, any>> = {
  _metadata: T;
}

export type WithMetadata<Original, NewMetadata extends Record<string, any> = {}> = Original extends Metadata<infer OldMetadata>
  ? Original & Metadata<NewMetadata & OldMetadata>
  : Original & Metadata<NewMetadata>;
