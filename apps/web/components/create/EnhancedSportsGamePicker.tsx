'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Game, League, GameQueryOptions } from '../../lib/data/types';
import { sportsDataService, getDateRangePresets, validateDateRange, getGameTimeInfo } from '../../lib/data/sports';

interface FilterChip {
  id: string;
  label: string;
  dateRange?: { startUTC: Date; endUTC: Date };
}

interface EnhancedSportsGamePickerProps {
  league: League;
  selectedGame?: Game;
  onGameSelect: (game: Game) => void;
  onLeagueChange?: (league: League) => void;
}

export function EnhancedSportsGamePicker({ 
  league, 
  selectedGame, 
  onGameSelect, 
  onLeagueChange 
}: EnhancedSportsGamePickerProps) {
  
  // State
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('default');
  const [customDateRange, setCustomDateRange] = useState<{ startUTC: Date; endUTC: Date } | null>(null);
  const [includeLive, setIncludeLive] = useState(false);
  const [includePostponed, setIncludePostponed] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Constants
  const GAMES_PER_PAGE = 50;
  const presets = getDateRangePresets();

  // Filter chips
  const filterChips: FilterChip[] = [
    { id: 'today', label: 'Today', dateRange: presets.today },
    { id: 'tomorrow', label: 'Tomorrow', dateRange: presets.tomorrow },
    { id: 'weekend', label: 'Weekend', dateRange: presets.weekend },
    { id: 'next7d', label: 'Next 7d', dateRange: presets.next7d },
    { id: 'next14d', label: 'Next 14d', dateRange: presets.next14d },
    { id: 'custom', label: 'Custom…' }
  ];

  // Get active date range
  const activeDateRange = useMemo(() => {
    if (activeFilter === 'custom' && customDateRange) {
      return customDateRange;
    }
    const chip = filterChips.find(c => c.id === activeFilter);
    return chip?.dateRange || presets.default;
  }, [activeFilter, customDateRange, presets]);

  // Load games
  const loadGames = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceRefresh) {
        sportsDataService.clearCache();
      }

      const options: GameQueryOptions = {
        ...activeDateRange,
        includeLive,
        includePostponed
      };

      const fetchedGames = await sportsDataService.fetchUpcomingGames(league, options);
      setGames(fetchedGames);
      setCurrentPage(0); // Reset pagination
      
      if (fetchedGames.length === 0) {
        setError(`No ${league} games found for the selected time period.`);
      }
    } catch (err) {
      setError(`Failed to load ${league} games. Please try again.`);
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  }, [league, activeDateRange, includeLive, includePostponed]);

  // Load games on mount and when filters change
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // URL persistence temporarily disabled to avoid SecurityError
  // useEffect(() => {
  //   // Read from URL on mount - disabled
  // }, []);

  // useEffect(() => {
  //   // Update URL when filters change - disabled  
  // }, [league, activeFilter, customDateRange, searchParams]);

  // Filter and paginate games
  const { displayedGames, totalCount, hasMore } = useMemo(() => {
    let filtered = games;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = games.filter(game => 
        game.home.toLowerCase().includes(search) ||
        game.away.toLowerCase().includes(search) ||
        (game.venue && game.venue.toLowerCase().includes(search))
      );
    }
    
    const totalCount = filtered.length;
    const endIndex = (currentPage + 1) * GAMES_PER_PAGE;
    const displayed = filtered.slice(0, endIndex);
    const hasMore = endIndex < totalCount;
    
    return { displayedGames: displayed, totalCount, hasMore };
  }, [games, searchTerm, currentPage]);

  // Custom date picker handlers
  const handleCustomDateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startStr = formData.get('startDate') as string;
    const endStr = formData.get('endDate') as string;
    
    if (!startStr || !endStr) {
      setDateError('Both start and end dates are required');
      return;
    }
    
    const startUTC = new Date(startStr);
    const endUTC = new Date(endStr + 'T23:59:59');
    
    const validation = validateDateRange(startUTC, endUTC);
    if (!validation.isValid) {
      setDateError(validation.error || 'Invalid date range');
      return;
    }
    
    setCustomDateRange({ startUTC, endUTC });
    setActiveFilter('custom');
    setShowCustomDatePicker(false);
    setDateError(null);
  };

  // Format date range for display
  const formatDateRangeDisplay = () => {
    const { startUTC, endUTC } = activeDateRange;
    const start = startUTC.toLocaleDateString();
    const end = endUTC.toLocaleDateString();
    return start === end ? start : `${start} → ${end}`;
  };

  // Game selection handler
  const handleGameSelect = (game: Game) => {
    const timeInfo = getGameTimeInfo(game);
    if (timeInfo.isTooSoon) {
      return; // Disabled games can't be selected
    }
    onGameSelect(game);
  };

  return (
    <div className="space-y-6">
      {/* Header with league selector and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold text-white">Select {league} Game</h3>
          {onLeagueChange && (
            <button
              onClick={() => onLeagueChange(league === 'NBA' ? 'NFL' : 'NBA')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Change league
            </button>
          )}
        </div>
        <button
          onClick={() => loadGames(true)}
          disabled={loading}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center disabled:opacity-50"
        >
          <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Filter chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {filterChips.map(chip => (
            <button
              key={chip.id}
              onClick={() => {
                if (chip.id === 'custom') {
                  setShowCustomDatePicker(true);
                } else {
                  setActiveFilter(chip.id);
                  setCustomDateRange(null);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeFilter === chip.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Custom date picker */}
        {showCustomDatePicker && (
          <form onSubmit={handleCustomDateSubmit} className="bg-gray-800 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>
            </div>
            {dateError && (
              <div className="text-red-400 text-sm">{dateError}</div>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomDatePicker(false);
                  setDateError(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Visibility toggles */}
        <div className="flex items-center space-x-4 text-sm">
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={includeLive}
              onChange={(e) => setIncludeLive(e.target.checked)}
              className="mr-2"
            />
            Include live
          </label>
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={includePostponed}
              onChange={(e) => setIncludePostponed(e.target.checked)}
              className="mr-2"
            />
            Include postponed/cancelled
          </label>
        </div>
      </div>

      {/* Subtitle with count and date range */}
      <div className="text-sm text-gray-400">
        Showing {totalCount} games • {formatDateRangeDisplay()} (UTC shown on cards)
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by team name or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        <svg className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 mt-2">Loading {league} games...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
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
            <button
              onClick={() => {
                setActiveFilter('default');
                setCustomDateRange(null);
                setSearchTerm('');
                setIncludeLive(false);
                setIncludePostponed(false);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && displayedGames.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg">No games found</p>
            <p className="text-sm">Try adjusting your filters or date range</p>
          </div>
          <button
            onClick={() => {
              setActiveFilter('default');
              setCustomDateRange(null);
              setSearchTerm('');
              setIncludeLive(false);
              setIncludePostponed(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Games list */}
      {!loading && !error && displayedGames.length > 0 && (
        <div className="space-y-3">
          {displayedGames.map(game => {
            const timeInfo = getGameTimeInfo(game);
            const isSelected = selectedGame?.id === game.id;
            const isDisabled = timeInfo.isTooSoon || timeInfo.isPast;

            return (
              <div
                key={game.id}
                className={`
                  relative p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : isDisabled
                      ? 'border-gray-600 bg-gray-800/50 opacity-60 cursor-not-allowed'
                      : 'border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-750'
                  }
                `}
                onClick={() => !isDisabled && handleGameSelect(game)}
                title={isDisabled ? `Starts too soon for creation (min lead: ${timeInfo.minLeadHours}h)` : undefined}
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
                    
                    {/* Time info */}
                    <div className="text-sm">
                      <div className="text-white">
                        {new Date(game.startsAt).toLocaleString()}
                      </div>
                      <div className="text-gray-400">
                        {new Date(game.startsAt).toISOString().replace('T', ' ').slice(0, 16)} UTC
                      </div>
                    </div>
                  </div>
                  
                  {/* Badges and status */}
                  <div className="flex flex-col items-end space-y-1">
                    <div className="bg-orange-600 text-orange-100 px-2 py-1 rounded text-xs font-medium">
                      {league}
                    </div>
                    
                    {timeInfo.isSoon && !timeInfo.isTooSoon && (
                      <div className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs font-medium">
                        Soon
                      </div>
                    )}
                    
                    {timeInfo.isTooSoon && (
                      <div className="bg-red-600 text-red-100 px-2 py-1 rounded text-xs font-medium">
                        Too Soon
                      </div>
                    )}
                    
                    {timeInfo.isPast && (
                      <div className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs font-medium">
                        Past Game
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Load more button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Load More ({totalCount - displayedGames.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
