'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

import ChatPanel from './components/ChatPanel';
import PreviewFrame from './components/PreviewFrame';
import CodeTabs from './components/CodeTabs';

type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

type SessionType = {
  _id: string;
  chat: ChatTurn[];
  jsxCode: string;
  cssCode: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function PlaygroundPage() {
  const router = useRouter();
  const { id } = useParams();
  const [session, setSession] = useState<SessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchSession = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSession({
        _id: data.session._id,
        chat: data.chat.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message,
        })),
        jsxCode: data.session.jsxCode,
        cssCode: data.session.cssCode,
        createdAt: data.session.createdAt,
        updatedAt: data.session.updatedAt,
      });
    } catch (err) {
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchSession();
  }, [id]);

  const handleCodeUpdate = (jsxCode: string, cssCode: string) => {
    if (!session) return;
    setSession((prev) => prev ? { ...prev, jsxCode, cssCode } : prev);
  };

  if (loading) return <p className="p-4">Loading session...</p>;
  if (!session) return <p className="p-4 text-red-500">Session not found.</p>;

  return (
    <div className="grid grid-cols-4 h-screen">
      {/* Left Sidebar */}
      <div className="col-span-1 border-r overflow-y-auto">
        <ChatPanel sessionId={id as string} initialChat={session.chat} onUpdateCode={handleCodeUpdate} />
      </div>

      {/* Main Editor & Preview */}
      <div className="col-span-3 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Live Preview</h2>
        <PreviewFrame jsxCode={session.jsxCode} cssCode={session.cssCode} />
        <CodeTabs jsxCode={session.jsxCode} cssCode={session.cssCode} sessionId={id as string} />
      </div>
    </div>
  );
}
