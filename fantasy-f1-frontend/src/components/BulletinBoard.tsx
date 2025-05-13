import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaTrash } from 'react-icons/fa';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

const TypedFaPlus = FaPlus as unknown as React.FC<{ size?: number; className?: string }>;
const TypedFaTrash = FaTrash as unknown as React.FC<{ size?: number; className?: string }>;

const BulletinBoard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/announcements/active');
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/announcements', { title, content, status: 'published' });
      setTitle('');
      setContent('');
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to post announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    setError('');
    try {
      await api.delete(`/api/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to delete announcement');
    }
  };

  return (
    <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl p-4 border border-white/10 flex flex-col h-64 min-h-[16rem] max-h-96 overflow-y-auto relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">Bulletin Board</h2>
        {user?.isAppAdmin && (
          <button
            className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            onClick={() => setShowForm((v) => !v)}
            title="Add Announcement"
          >
            <TypedFaPlus />
          </button>
        )}
      </div>
      {showForm && user?.isAppAdmin && (
        <form onSubmit={handlePost} className="mb-2 flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="px-2 py-1 rounded bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-red-500 text-xs"
            required
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Announcement..."
            className="px-2 py-1 rounded bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-red-500 text-xs resize-none"
            rows={2}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs">Post</button>
            <button type="button" className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-xs" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      {loading ? (
        <div className="text-white text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : announcements.length === 0 ? (
        <div className="text-white/70 text-center">No announcements yet.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {announcements.map(a => (
            <li key={a._id} className="bg-white/10 rounded p-2 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white text-sm">{a.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">{new Date(a.createdAt).toLocaleString()}</span>
                  {user?.isAppAdmin && (
                    <button
                      className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Delete announcement"
                      onClick={() => handleDelete(a._id)}
                    >
                      <TypedFaTrash size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="text-white/90 text-xs whitespace-pre-line">{a.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BulletinBoard; 