'use client';

import { useState, useEffect } from 'react';
import { Game, League } from '../../lib/data/types';
import { sportsDataService } from '../../lib/data/sports';

interface SportsGamePickerProps {
  league: League;
  onSelect: (game: Game) => void;
  selectedGame?: Game;
}

export function SportsGamePicker({ league, onSelect, selectedGame }: SportsGamePickerProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadGames();
  }, [league]);

  const loadGames = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedGames = forceRefresh 
        ? await sportsDataService.forceRefreshGames(league)
        : await sportsDataService.fetchUpcomingGames(league);
      setGames(fetchedGames);
      
      if (fetchedGames.length === 0) {
        setError(`No upcoming ${league} games found. Data is sourced live from ESPN and official ${league} APIs.`);
      }
    } catch (err) {
      setError(`Failed to load live ${league} games. Please check your internet connection and try again.`);
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      game.home.toLowerCase().includes(search) ||
      game.away.toLowerCase().includes(search) ||
      game.venue?.toLowerCase().includes(search)
    );
  });

  const formatGameTime = (isoString: string) => {
    const date = new Date(isoString);
    const localTime = date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    const utcTime = date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    return { localTime, utcTime };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading {league} games...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <div className="space-x-2">
          <button
            onClick={() => loadGames(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => loadGames(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Force Refresh
          </button>
        </div>
      </div>
    );
  }

  if (games.length === 0 && !loading && !error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No upcoming {league} games found from live APIs.</p>
        <div className="space-x-2">
          <button
            onClick={() => loadGames(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => loadGames(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Force Refresh
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Data sourced live from ESPN and official {league} APIs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Live data from ESPN and official {league} APIs
        </div>
        <button
          onClick={() => loadGames(true)}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
          disabled={loading}
        >
          <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by team name or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Games List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredGames.map((game) => {
          const { localTime, utcTime } = formatGameTime(game.startsAt);
          const isSelected = selectedGame?.id === game.id;
          
          return (
            <div
              key={game.id}
              onClick={() => onSelect(game)}
              className={`
                cursor-pointer rounded-2xl p-5 border transition-all
                ${isSelected 
                  ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/25'
                  : 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-750'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Matchup */}
                  <div className="text-lg font-semibold text-white mb-2">
                    <span className="text-gray-300">{game.away}</span>
                    <span className="text-blue-400 mx-2">vs</span>
                    <span className="text-white">{game.home}</span>
                  </div>
                  
                  {/* Venue */}
                  {game.venue && (
                    <div className="text-sm text-gray-400 mb-2">
                      📍 {game.venue}
                    </div>
                  )}
                  
                  {/* Time */}
                  <div className="text-sm">
                    <div className="text-white">{localTime}</div>
                    <div className="text-gray-400">{utcTime}</div>
                  </div>
                </div>
                
                {/* League Badge */}
                <div className="ml-4">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${league === 'NBA' 
                      ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30'
                      : 'bg-green-600/20 text-green-400 border border-green-600/30'
                    }
                  `}>
                    {league}
                  </span>
                </div>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="mt-3 flex items-center text-blue-400 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Selected
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {filteredGames.length === 0 && searchTerm && (
        <div className="text-center py-4">
          <p className="text-gray-400">No games found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
