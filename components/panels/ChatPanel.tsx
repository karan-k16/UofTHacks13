'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/state/store';
import type { ChatMessage } from '@/lib/ai/types';

// Format timestamp as relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Message component
function Message({ message }: { message: ChatMessage }) {
  const isUser = message.from === 'user';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : isError
              ? 'bg-red-900 text-red-100'
              : 'bg-gray-800 text-gray-100'
          } ${isSending ? 'opacity-60' : ''}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-gray-500">
            {formatRelativeTime(message.timestamp)}
          </span>
          {isSending && (
            <span className="text-xs text-gray-500">Sending...</span>
          )}
          {isError && (
            <span className="text-xs text-red-500">Failed</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-gray-800 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-400">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [inputText, setInputText] = useState('');
  const [textareaRows, setTextareaRows] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    chat,
  } = useStore();

  const { messages, isPending, selectedModel, lastAICommandId } = chat;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea based on content
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    // Calculate rows (max 5)
    const lineCount = e.target.value.split('\n').length;
    const newRows = Math.min(lineCount, 5);
    setTextareaRows(newRows);
  };

  // Handle sending messages (placeholder for Phase 4)
  const handleSend = () => {
    if (!inputText.trim() || isPending) return;

    // Add user message
    chat.addMessage('user', inputText.trim());
    setInputText('');
    setTextareaRows(1);

    // TODO Phase 4: Make API call
    // For now, just add a placeholder response
    setTimeout(() => {
      chat.addMessage('agent', 'Phase 4: API integration pending. Your command will be processed here.');
    }, 500);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle model selection
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    chat.setModel(e.target.value as 'gemini' | 'fallback');
  };

  // Handle clear chat
  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (confirm('Clear all chat history?')) {
      chat.clearHistory();
    }
  };

  // Handle undo (placeholder for Phase 4)
  const handleUndo = () => {
    // TODO Phase 4: Implement undo functionality
    console.log('Undo last AI action');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="text-sm font-semibold">AI Assistant</h2>
        </div>

        {/* Model Selector */}
        <select
          value={selectedModel}
          onChange={handleModelChange}
          disabled={isPending}
          className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          title="Select AI model"
        >
          <option value="gemini">Gemini</option>
          <option value="fallback">Fallback</option>
        </select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 text-gray-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-center mb-2">Ask me to help with your track...</p>
            <p className="text-xs text-gray-600 text-center max-w-[200px]">
              Try: &quot;Add a kick drum pattern&quot; or &quot;Set BPM to 128&quot;
            </p>
          </div>
        ) : (
          // Messages
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isPending && <LoadingSpinner />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-800">
        <button
          onClick={handleUndo}
          disabled={!lastAICommandId || isPending}
          className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          title="Undo last AI action"
        >
          Undo
        </button>
        <button
          onClick={handleClearChat}
          disabled={messages.length === 0 || isPending}
          className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          title="Clear chat history"
        >
          Clear
        </button>
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your project..."
            disabled={isPending}
            rows={textareaRows}
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 placeholder-gray-500"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            title="Send message (Enter)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400 ml-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
