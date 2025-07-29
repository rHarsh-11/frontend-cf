'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchSessions = async () => {
      try {
        const { data } = await axios.get(`${baseURL}/api/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSessions(data);
      } catch (error) {
        console.error('Failed to fetch sessions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [token]);

  const handleNewSession = async () => {
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/sessions/new',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data?._id) {
        router.push(`/playground/${data._id}`);
      }
    } catch (error) {
      console.error('Failed to create new session', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </header>

      <section className="w-full max-w-4xl bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Your Sessions</h2>
          <button
            onClick={handleNewSession}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            + New Session
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500">No sessions yet. Create one to get started!</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session: any) => (
              <li
                key={session._id}
                onClick={() => router.push(`/playground/${session._id}`)}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition"
              >
                <div className="font-medium text-gray-800">{session.title || 'Untitled Session'}</div>
                <div className="text-sm text-gray-500">{new Date(session.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
