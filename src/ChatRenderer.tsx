
import React, { useEffect, useRef } from "react"; // esbuild-loader somehow requires React to be imported
import { ChatMessageRenderer } from "./lib/chat-renderer/chat-renderer";

export interface ChatRendererProps {
  messages: any;
  currentTime: number;
  startTime: number;
  endTime: number;
  timestampExtractor: (message: any) => number;
}

function ChatRenderer({ messages, currentTime, startTime, timestampExtractor }: ChatRendererProps) {
  const lastCountRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const _renderer = useRef<ChatMessageRenderer>(new ChatMessageRenderer(messages, timestampExtractor));
  const renderer = _renderer.current;

  const currentTimestamp = startTime + currentTime;
  renderer.seek(currentTimestamp);

  const messagesToRender = renderer.getMessages();

  useEffect(() => {
    if (messagesToRender.length === lastCountRef.current) {
      return;
    }

    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
    lastCountRef.current = messagesToRender.length;
  })

  return (
    <div ref={containerRef} className="h-full overflow-y-scroll flex flex-col bg-neutral-800">
      {messagesToRender.map((message) => {
        return (
          <div className='message-item text-sm text-white relative first:mt-auto hover:bg-white/[.04] p-2' key={message.id}>
            <div className='font-semibold'>{message.sender}</div>
            <div className="top-2 right-4 absolute flex flex-col">
              {message.emotions.map((emotion) => {
                const count = emotion.users.getItems().length;

                if (count === 0) {
                  return null;
                };

                return (
                  <div key={emotion.name} className='text-xs text-gray-400'>
                    {emotion.name}: {count}
                  </div>
                )
              })}
            </div>
            <div className="w-12/12" dangerouslySetInnerHTML={{ __html: message.content }} />
          </div>
        )
      })}
      <div className="text-white absolute top-4 right-8">{currentTime}</div>
    </div>
  )
}

export default ChatRenderer;
