import React from 'react';
import ReactDOM from 'react-dom';
import ChatRenderer, { ChatRendererProps } from './ChatRenderer';
import './index.css';


export function render(target: Element, props: ChatRendererProps) {
  ReactDOM.render(
    <React.StrictMode>
      <ChatRenderer {...props} />
    </React.StrictMode >,
    target
  );
}