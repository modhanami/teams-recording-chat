import { ChatMessageRenderer } from "./chat-renderer";

describe('Chat Message Reconciler', () => {
  const startTime = 100;
  const endTime = 300;
  const messages = [
    {
      time: 105,
      message: 'hello',
      properties: {
        emotions: [
          {
            key: 'laugh',
            users: [
              { time: 106 },
              { time: 107 },
              { time: 108 }
            ]
          },
          {
            key: 'sad',
            users: [
              { time: 108 },
              { time: 109 },
            ]
          }
        ]
      }
    },
    {
      time: 120,
      message: 'world',
      properties: {
        emotions: [
          {
            key: 'laugh',
            users: [
              { time: 121 },
              { time: 122 },
              { time: 123 }
            ]
          }
        ]
      }
    },
    {
      time: 150,
      message: 'cxz'
    },
    {
      time: 200,
      message: 'def'
    },
    {
      time: 270,
      message: 'asd'
    }
  ];

  const timeExtractor = (message: any) => message.time;
  let reconciler: ChatMessageRenderer<Record<string, any>>;

  beforeEach(() => {
    reconciler = new ChatMessageRenderer(messages, startTime, endTime, timeExtractor);
  });

  describe('when the current time progresses', () => {

    it('should return the messages that are before or equal to the current time', () => {
      const currentTime = 149;
      const expected = messages.filter(message => message.time <= currentTime);

      reconciler.seek(currentTime);

      expect(reconciler.currentMessages).toEqual(expected);
    });

    it('should filter out messages that are after the current time', () => {
      const currentTime = 200;
      const expected = messages.filter(message => message.time <= currentTime);
      const currentTime2 = 150;
      const expected2 = messages.filter(message => message.time <= currentTime2);

      reconciler.seek(currentTime);

      expect(reconciler.currentMessages).toEqual(expected);

      reconciler.seek(currentTime2);

      expect(reconciler.currentMessages).toEqual(expected2);
    });


  })

  // describe('emotions plugin', () => {
  //   it('should show emotions for each message up to the current time', () => {
  //     reconciler.registerPlugin(new EmotionsPlugin({
  //       reducer: (message: any, currentTime: number) => {
  //         const emotions = message.emotions;
  //         return emotions.reduce((emotionCountMap, emotion) => {
  //           const emotionName = emotion.name;
  //           let count = 0;
  //           const userEmotions = emotion.users;
  //           for (let i = 0; i < userEmotions.length; i++) {
  //             const userEmotion = userEmotions[i];

  //             if (userEmotion.timestamp > currentTime) {
  //               break;
  //             }
  //             count++;
  //           }

  //           if (count > 0) {
  //             emotionCountMap[emotionName] = count;
  //           }

  //           return emotionCountMap;
  //         }, {});
  //       }
  //     }));

  //     const currentTime = 121;
  //     const expected = messages.filter(message => message.time <= currentTime);
  //     // filter out emotions that are after the current time

  //     reconciler.seek(currentTime);

  //     console.dir(reconciler.currentMessages, { depth: null });
  //     expect(reconciler.currentMessages).toEqual(expected);

  //   });
  // });
});