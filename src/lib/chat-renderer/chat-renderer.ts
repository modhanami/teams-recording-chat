import { ChatMessage, Emotion, Modify as Amend, MRIAndTimestamp } from "../../shared/types";

interface Seeker {
  seek(currentTime: number): void;
}

export class SeekableItems<T> implements Seeker {
  private currentTime: number = 0;
  private nextCursor: number = 0;
  private items: T[];

  constructor(
    private originalItems: T[],
    private timestampExtractor: (message: T) => number,
  ) {
    this.originalItems = originalItems;
    this.timestampExtractor = timestampExtractor;
    this.items = [];
  }

  seek(targetTime: number) {
    if (targetTime > this.currentTime) {
      this.seekForward(targetTime);
    } else if (targetTime < this.currentTime) {
      this.seekBackward(targetTime);
    }

    this.currentTime = targetTime;
  }

  private seekForward(targetTime: number) {
    for (let i = this.nextCursor; i < this.originalItems.length; i++) {
      const element = this.originalItems[i];

      const timestamp = this.timestampExtractor(element);
      if (timestamp > targetTime) {
        break;
      }

      this.items.push(element);
      this.nextCursor = i + 1;
    }
  }

  private seekBackward(targetTime: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const element = this.items[i];

      const timestamp = this.timestampExtractor(element);
      if (timestamp > targetTime) {
        this.items.pop();
        this.nextCursor = i;
      }
    }
  }

  getItems() {
    return this.items;
  }
}

type ChatMessageWithSeekableEmotionsUser = Amend<ChatMessage, {
  emotions: Amend<Emotion, {
    users: SeekableItems<MRIAndTimestamp>;
  }>[];
}>;


export class ChatMessageRenderer {
  private seekableMessages: SeekableItems<ChatMessageWithSeekableEmotionsUser>;

  constructor(
    messages: ChatMessage[],
    timestampExtractor: (message: any) => number,
  ) {
    const newMessages = messages.map((message) => {
      return {
        ...message,
        emotions: message.emotions.map((emotion) => {
          return {
            ...emotion,
            users: new SeekableItems(emotion.users, (user) => user.timestamp),
          };
        })
      };
    });

    this.seekableMessages = new SeekableItems(newMessages, timestampExtractor);
  }

  seek(targetTime: number) {
    this.seekableMessages.seek(targetTime);

    for (const message of this.seekableMessages.getItems()) {
      for (const emotion of message.emotions) {
        emotion.users.seek(targetTime);
      }
    }
  }

  getMessages() {
    return this.seekableMessages.getItems();
  }
}
