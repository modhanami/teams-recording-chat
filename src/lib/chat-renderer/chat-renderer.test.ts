import { ChatMessage } from "../../shared/types";
import { ChatMessageRenderer } from "./chat-renderer";

describe('Chat Message Renderer', () => {
  const messages: ChatMessage[] = [
    {
      id: '111',
      timestamp: 105,
      content: 'hello',
      sender: '111',
      emotions: [
        {
          name: 'laugh',
          users: [
            { timestamp: 121, mri: '106:mri' },
            { timestamp: 134, mri: '107:mri' },
            { timestamp: 199, mri: '108:mri' },
          ]
        },
        {
          name: 'sad',
          users: [
            { timestamp: 140, mri: '108:mri' },
            { timestamp: 172, mri: '109:mri' },
          ]
        }
      ]
    },
    {
      id: '112',
      timestamp: 120,
      content: 'world',
      sender: '112',
      emotions: [
        {
          name: 'laugh',
          users: [
            { timestamp: 121, mri: '121:mri' },
            { timestamp: 150, mri: '122:mri' },
            { timestamp: 210, mri: '123:mri' },
          ]
        }
      ]
    },
    {
      id: '113',
      timestamp: 150,
      content: 'cxz',
      sender: '113',
      emotions: [],
    },
    {
      id: '114',
      timestamp: 200,
      content: 'def',
      sender: '114',
      emotions: [],
    },
    {
      id: '115',
      timestamp: 270,
      content: 'asd',
      sender: '115',
      emotions: []
    }
  ];

  const timeExtractor = (item: any) => item.timestamp;
  let renderer: ChatMessageRenderer;

  beforeEach(() => {
    renderer = new ChatMessageRenderer(messages, timeExtractor);
  });

  describe('when the time progresses', () => {
    // messages
    it('should return the messages that come before or equal to the current time', () => {
      const currentTime = 149;
      const expected = messages.filter(message => message.timestamp <= currentTime);

      renderer.seek(currentTime);

      expect(renderer.getMessages().length).toBe(expected.length);
    });

    it('should filter out messages that come after the current time', () => {
      const currentTime = 200;
      const expected = messages.filter(message => message.timestamp <= currentTime);

      renderer.seek(currentTime);

      expect(renderer.getMessages().length).toBe(expected.length);
    });

    // emotions
    it('should return the emotions that come before or equal to the current time', () => {
      const currentTime = 149;

      renderer.seek(currentTime);

      const emotions = renderer.getMessages().flatMap((message) => message.emotions);
      for (const emotion of emotions) {
        for (const user of emotion.users.getItems()) {
          expect(user.timestamp).toBeLessThanOrEqual(currentTime);
        }
      }
    });

    it('should filter out emotions that come after the current time', () => {
      const currentTime = 200;

      renderer.seek(currentTime);

      const emotions = renderer.getMessages().flatMap((message) => message.emotions);
      for (const emotion of emotions) {
        for (const user of emotion.users.getItems()) {
          expect(user.timestamp).toBeLessThanOrEqual(currentTime);
        }
      }
    });

  });

});
