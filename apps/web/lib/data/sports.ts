// Sports data providers with fallbacks
// Version: 2025-01-09-15-25 - Enhanced with time filters and caching

import { Game, League, SportsProvider, GameQueryOptions } from './types';
import { dataCache } from './cache';

// Environment configuration
const MIN_LEAD_HOURS = parseInt(process.env.NEXT_PUBLIC_MIN_LEAD_HOURS || '2');
const DEFAULT_QUERY_DAYS = 10;
const MAX_QUERY_DAYS = 30;

// Utility functions are now defined inline within the functions that use them
// to avoid hoisting and scope issues

// Fallback provider using local JSON
class LocalSportsProvider implements SportsProvider {
  async fetchUpcomingGames(league: League, options?: GameQueryOptions): Promise<Game[]> {
    try {
      const response = await fetch('/data/sports-fixtures.json');
      const data = await response.json();
      const games = data.games || [];
      
      const now = new Date();
      const startUTC = options?.startUTC || now;
      const endUTC = options?.endUTC || new Date(now.getTime() + DEFAULT_QUERY_DAYS * 24 * 60 * 60 * 1000);
      
      return games
        .filter((game: Game) => {
          if (game.league !== league) return false;
          
          const gameDate = new Date(game.startsAt);
          return gameDate >= startUTC && gameDate <= endUTC;
        })
        .sort((a: Game, b: Game) => 
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
    } catch (error) {
      console.warn('Failed to load local sports fixtures:', error);
      return [];
    }
  }
}

// ESPN API provider (free, no key required)
class ESPNProvider implements SportsProvider {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';

  async fetchUpcomingGames(league: League, options?: GameQueryOptions): Promise<Game[]> {
    try {
      const endpoints: Record<League, string> = {
        NBA: 'basketball/nba',
        NFL: 'football/nfl',
        MLS: 'soccer/usa.1',
        NHL: 'hockey/nhl',
      };
      const leagueEndpoint = endpoints[league];
      if (!leagueEndpoint) return [];
      // Build date range query supported by ESPN: YYYYMMDD or YYYYMMDD-YYYYMMDD
      const now = new Date();
      const startUTC = options?.startUTC || now;
      const endUTC = options?.endUTC || new Date(now.getTime() + DEFAULT_QUERY_DAYS * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
      const dateParam = `${fmt(startUTC)}-${fmt(endUTC)}`;
      const url = `${this.baseUrl}/${leagueEndpoint}/scoreboard?dates=${dateParam}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.events) return [];
      
      return data.events
        .filter((event: any) => {
          const gameDate = new Date(event.date);
          return gameDate >= startUTC && gameDate <= endUTC;
        })
        .map((event: any) => {
          const competition = event.competitions[0];
          const competitors = competition.competitors;
          
          // Find home and away teams
          const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
          const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
          
          return {
            id: `${league.toLowerCase()}_${event.id}`,
            league,
            startsAt: event.date,
            home: homeTeam?.team?.displayName || 'Home Team',
            away: awayTeam?.team?.displayName || 'Away Team',
            venue: competition.venue?.fullName,
            sourceUrl: `https://www.espn.com/${league.toLowerCase()}/game/_/gameId/${event.id}`,
            allowsDraw: league === 'MLS' || league === 'NHL' // MLS/NHL can have draws in regulation
          };
        })
        .sort((a: Game, b: Game) => 
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
    } catch (error) {
      console.warn('ESPN API failed:', error);
      throw error;
    }
  }
}

// NBA API provider (official NBA stats API, no key required)
class NBAAPIProvider implements SportsProvider {
  private baseUrl = 'https://stats.nba.com/stats';

  async fetchUpcomingGames(league: League, options?: GameQueryOptions): Promise<Game[]> {
    if (league !== 'NBA') {
      throw new Error('NBA API only supports NBA');
    }

    try {
      // Use NBA's schedule endpoint
      const today = new Date();
      const season = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear(); // NBA season spans years
      
      const url = `${this.baseUrl}/scheduleleaguev2?LeagueID=00&Season=${season - 1}-${season.toString().slice(-2)}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const data = await response.json();
      
      if (!data.resultSets || !data.resultSets[0]) return [];
      
      const games = data.resultSets[0].rowSet;
      const headers = data.resultSets[0].headers;
      
      const gameTimeIndex = headers.indexOf('GAME_DATE_EST');
      const homeTeamIndex = headers.indexOf('HOME_TEAM_NAME');
      const awayTeamIndex = headers.indexOf('VISITOR_TEAM_NAME');
      const gameIdIndex = headers.indexOf('GAME_ID');
      
      return games
        .filter((game: any) => {
          const gameDate = new Date(game[gameTimeIndex]);
          return gameDate >= (options?.startUTC || new Date()) && gameDate <= (options?.endUTC || new Date(Date.now() + DEFAULT_QUERY_DAYS * 24 * 60 * 60 * 1000));
        })
        .map((game: any) => ({
          id: `nba_${game[gameIdIndex]}`,
          league: 'NBA' as League,
          startsAt: new Date(game[gameTimeIndex]).toISOString(),
          home: game[homeTeamIndex],
          away: game[awayTeamIndex],
          venue: undefined,
          sourceUrl: `https://www.nba.com/game/${game[gameIdIndex]}`,
          allowsDraw: false // NBA games go to OT, no draws
        }))
        .sort((a: Game, b: Game) => 
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
    } catch (error) {
      console.warn('NBA API failed:', error);
      throw error;
    }
  }
}

// Main sports data service with provider fallback chain
class SportsDataService {
  private providers: SportsProvider[] = [];
  private localProvider = new LocalSportsProvider();

  constructor() {
    // Setup provider chain - live APIs first, fallback last
    // ESPN API works for both NBA and NFL
    this.providers.push(new ESPNProvider());
    
    // NBA-specific API as secondary option for NBA games
    this.providers.push(new NBAAPIProvider());
    
    // Local fallback data as last resort
    this.providers.push(this.localProvider);
  }

  async fetchUpcomingGames(league: League, options?: GameQueryOptions): Promise<Game[]> {
    const now = new Date();
    const startUTC = options?.startUTC || now;
    const endUTC = options?.endUTC || new Date(now.getTime() + DEFAULT_QUERY_DAYS * 24 * 60 * 60 * 1000);
    
    // Create cache key based on league and time range (rounded to nearest hour for better cache hit rate)
    const startKey = Math.floor(startUTC.getTime() / (60 * 60 * 1000));
    const endKey = Math.floor(endUTC.getTime() / (60 * 60 * 1000));
    const cacheKey = `sports_${league}_${startKey}_${endKey}`;
    
    // Check cache first
    const cached = dataCache.get<Game[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Try providers in order until one succeeds
    for (const provider of this.providers) {
      try {
        const games = await provider.fetchUpcomingGames(league, options);
        if (games.length > 0) {
          dataCache.set(cacheKey, games);
          return games;
        }
      } catch (error) {
        console.warn(`Sports provider failed, trying next:`, error);
        continue;
      }
    }

    // If all providers fail, return empty array
    console.warn('All sports providers failed');
    return [];
  }

  clearCache(): void {
    dataCache.clear();
  }

  // Force refresh data (bypasses cache)
  async forceRefreshGames(league: League): Promise<Game[]> {
    const cacheKey = `sports_${league}`;
    dataCache.clear(); // Clear entire cache to force fresh data
    
    return this.fetchUpcomingGames(league);
  }
}

export const sportsDataService = new SportsDataService();

// Date utility functions for filtering
export function getDateRangePresets() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  // Weekend (next Saturday-Sunday)
  const daysUntilSaturday = (6 - now.getDay()) % 7;
  const nextSaturday = new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
  const nextSunday = new Date(nextSaturday.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    today: { startUTC: today, endUTC: new Date(tomorrow.getTime() - 1) },
    tomorrow: { startUTC: tomorrow, endUTC: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1) },
    weekend: { startUTC: nextSaturday, endUTC: new Date(nextSunday.getTime() + 24 * 60 * 60 * 1000 - 1) },
    next7d: { startUTC: now, endUTC: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    next14d: { startUTC: now, endUTC: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
    default: { startUTC: now, endUTC: new Date(now.getTime() + DEFAULT_QUERY_DAYS * 24 * 60 * 60 * 1000) }
  };
}

export function validateDateRange(startUTC: Date, endUTC: Date): { isValid: boolean; error?: string } {
  if (startUTC >= endUTC) {
    return { isValid: false, error: 'Start date must be before end date' };
  }
  
  const maxRange = MAX_QUERY_DAYS * 24 * 60 * 60 * 1000;
  if (endUTC.getTime() - startUTC.getTime() > maxRange) {
    return { isValid: false, error: `Date range cannot exceed ${MAX_QUERY_DAYS} days` };
  }
  
  return { isValid: true };
}

export function isGameTooSoon(game: Game): boolean {
  const now = new Date();
  const gameStart = new Date(game.startsAt);
  const leadTimeMs = MIN_LEAD_HOURS * 60 * 60 * 1000;
  return gameStart.getTime() - now.getTime() < leadTimeMs;
}

export function getGameTimeInfo(game: Game) {
  const now = new Date();
  const gameStart = new Date(game.startsAt);
  const hoursUntilGame = (gameStart.getTime() - now.getTime()) / (60 * 60 * 1000);
  
  return {
    isTooSoon: hoursUntilGame < MIN_LEAD_HOURS,
    isSoon: hoursUntilGame < 6 && hoursUntilGame >= MIN_LEAD_HOURS,
    isPast: hoursUntilGame < 0,
    hoursUntilGame: Math.max(0, hoursUntilGame),
    minLeadHours: MIN_LEAD_HOURS
  };
}

// Utility functions for sports templates
export function generateSportsTitle(game: Game): string {
  // Card style: "Home vs Away: Who wins?"
  return `${game.home} vs ${game.away}: Who wins?`;
}

export function generateSportsDescription(game: Game): string {
  // Local utility functions to avoid hoisting issues
  const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });
  
  const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const date = formatDate(game.startsAt);
  const time = formatTime(game.startsAt);
  const targetHours = game.league === 'NBA' ? '3-4' : '4-5';
  const maxHours = game.league === 'NBA' ? '8' : '12';
  
  if (game.allowsDraw) {
    return `Match date/time: ${date} at ${time}

Outcomes
- ${game.home} (home win)
- Draw (after regulation)
- ${game.away} (away win)

Rules & Resolution Criteria
- Resolves only when ESPN or the official ${game.league} source shows "Final"
- Target resolve window: ${targetHours} hours after kickoff/puck drop
- Hard deadline: ${maxHours} hours after start time
- Uses regulation-time result (pre-shootout if applicable)
- Accounts for delays and official reporting lag
- If postponed/cancelled, market may be voided
- Evidence required: screenshot of final score + recap link

Game Link: ${game.sourceUrl || 'Official league schedule'}`;
  } else {
    return `Game date/time: ${date} at ${time}

Outcomes (buttons use team names)
- ${game.home} (home team wins; includes overtime if applicable)
- ${game.away} (away team wins, or the game is cancelled/forfeited)

Rules & Resolution Criteria
- Resolves only when ESPN or the official ${game.league} source shows "Final"
- Target resolve window: ${targetHours} hours after tip-off
- Hard deadline: ${maxHours} hours after tip-off
- Includes overtime and accounts for delays
- Evidence required: screenshot of final score + recap link

Game Link: ${game.sourceUrl || 'Official league schedule'}`;
  }
}

export function calculateSportsResolveAt(game: Game): Date {
  const gameStart = new Date(game.startsAt);
  // Use the target buffer time (middle of the range)
  const targetHours = game.league === 'NBA' ? 3.5 : 4.5; // 3.5h for NBA, 4.5h for NFL
  return new Date(gameStart.getTime() + targetHours * 60 * 60 * 1000);
}

export function calculateSportsMaxDeadline(game: Game): Date {
  const gameStart = new Date(game.startsAt);
  // Hard deadline - must resolve by this time regardless
  const maxHours = game.league === 'NBA' ? 8 : 12; // 8h for NBA, 12h for NFL
  return new Date(gameStart.getTime() + maxHours * 60 * 60 * 1000);
}

export function getSportsResolutionRules(game: Game): string {
  const targetHours = game.league === 'NBA' ? '3-4' : '4-5';
  const maxHours = game.league === 'NBA' ? '8' : '12';
  
  return `Resolution timing:
• Target: ${targetHours} hours after tip-off
• Hard deadline: ${maxHours} hours after tip-off
• Only when official source shows "Final" status
• Accounts for OT, delays, and reporting lag`;
}
