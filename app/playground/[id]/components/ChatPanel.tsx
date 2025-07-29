'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  sessionId: string;
  initialChat: ChatTurn[];
  onUpdateCode: (jsx: string, css: string) => void;
}

export default function ChatPanel({ sessionId, initialChat, onUpdateCode }: ChatPanelProps) {
  const [chat, setChat] = useState<ChatTurn[]>(initialChat);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setChat(initialChat);
  }, [initialChat]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatTurn = { role: 'user', content: input };
    const updatedChat = [...chat, userMessage];
    setChat(updatedChat);
    setInput('');
    setLoading(true);

    try {
      // 🔁 Get AI response
      const { data } = await axios.post(
        `${baseURL}/api/sessions/${sessionId}/prompt`,
        { prompt: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { jsx, css } = data;

      const aiReply: ChatTurn = {
        role: 'assistant',
        content: `JSX:\n${jsx}\n\nCSS:\n${css}`
      };

      setChat([...updatedChat, aiReply]);

      // 💾 Save chat turn
      await axios.post(
        `${baseURL}/api/sessions/${sessionId}/chat`,
        {
          sender: 'ai',
          message: aiReply.content,
          type: 'response',
          codeSnippet: jsx,
          cssSnippet: css
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 📡 Push new code to parent
      onUpdateCode(jsx, css);
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-md whitespace-pre-wrap text-sm ${
              msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="border p-2 rounded w-full"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a prompt..."
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
