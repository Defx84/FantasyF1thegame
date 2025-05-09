import React, { useState } from 'react';
import StatisticsSummary from './components/StatisticsSummary';
import StatisticsTable from './components/StatisticsTable';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const { leagueId } = useParams<{ leagueId: string }>();
  const [activeTab, setActiveTab] = useState<'summary' | 'table'>('summary');

  return (
    <div
      className="min-h-screen w-full fixed inset-0 overflow-y-auto"
      style={{
        backgroundImage: 'url(/Stats.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Glassmorphic Header */}
      <div className="flex flex-col items-center pt-16">
        <div className="w-full max-w-3xl px-8 py-6 rounded-2xl shadow-xl bg-transparent backdrop-blur-lg border border-white/5 mb-10">
          <h1 className="text-4xl font-bold text-red-600 drop-shadow mb-1">Statistics</h1>
          {user?.username && (
            <p className="text-lg text-white font-medium drop-shadow">for {user.username}</p>
          )}
        </div>
      </div>
      {/* Glassmorphic Statistics Container */}
      <div className="max-w-4xl mx-auto px-4 py-10 pt-4 rounded-2xl shadow-xl bg-transparent backdrop-blur-lg border border-white/5 mb-10">
        {/* Pill-shaped Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-white/10 p-1 border border-white/20">
            <button
              className={`px-6 py-2 rounded-full font-semibold focus:outline-none transition-colors duration-200 text-sm md:text-base ${
                activeTab === 'summary'
                  ? 'bg-red-600 text-white shadow border border-red-700'
                  : 'bg-transparent text-red-600 hover:bg-red-100/20 border border-transparent'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`px-6 py-2 rounded-full font-semibold focus:outline-none transition-colors duration-200 text-sm md:text-base ${
                activeTab === 'table'
                  ? 'bg-red-600 text-white shadow border border-red-700'
                  : 'bg-transparent text-red-600 hover:bg-red-100/20 border border-transparent'
              }`}
              onClick={() => setActiveTab('table')}
            >
              Table View
            </button>
          </div>
        </div>
        {/* Content Area */}
        <div>
          {activeTab === 'summary' && <StatisticsSummary userId={user?.id} leagueId={leagueId} glassShade="bg-white/20" />}
          {activeTab === 'table' && <StatisticsTable userId={user?.id} leagueId={leagueId} glassShade="bg-white/20" />}
        </div>
      </div>
    </div>
  );
};

export default Statistics; 