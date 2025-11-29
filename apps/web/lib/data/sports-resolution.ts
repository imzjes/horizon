// Sports game resolution utilities with status checking

import { Game, League } from './types';

export interface GameStatus {
  gameId: string;
  status: 'scheduled' | 'in-progress' | 'final' | 'postponed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  lastUpdated: string;
  source: string;
}

export interface ResolutionWindow {
  targetTime: Date;
  maxDeadline: Date;
  canResolve: boolean;
  reason?: string;
}

/**
 * Check if a game can be resolved based on timing and status
 */
export function getResolutionWindow(game: Game, currentTime: Date = new Date()): ResolutionWindow {
  const gameStart = new Date(game.startsAt);
  const targetHours = game.league === 'NBA' ? 3.5 : 4.5;
  const maxHours = game.league === 'NBA' ? 8 : 12;
  
  const targetTime = new Date(gameStart.getTime() + targetHours * 60 * 60 * 1000);
  const maxDeadline = new Date(gameStart.getTime() + maxHours * 60 * 60 * 1000);
  
  // Can resolve if we're past target time but before deadline
  const pastTarget = currentTime >= targetTime;
  const beforeDeadline = currentTime <= maxDeadline;
  
  let canResolve = false;
  let reason: string | undefined;
  
  if (!pastTarget) {
    reason = `Wait until target time: ${targetTime.toLocaleString()}`;
  } else if (!beforeDeadline) {
    canResolve = true; // Force resolve past deadline
    reason = `Past deadline - must resolve`;
  } else {
    canResolve = true;
    reason = `Within resolution window`;
  }
  
  return {
    targetTime,
    maxDeadline,
    canResolve,
    reason
  };
}

/**
 * Fetch live game status from ESPN API
 */
export async function fetchGameStatus(game: Game): Promise<GameStatus | null> {
  try {
    const leagueEndpoint = game.league === 'NBA' ? 'basketball/nba' : 'football/nfl';
    const url = `https://site.api.espn.com/apis/site/v2/sports/${leagueEndpoint}/scoreboard`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.events) return null;
    
    // Find the specific game by matching teams
    const event = data.events.find((event: any) => {
      const competition = event.competitions[0];
      const competitors = competition.competitors;
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
      
      return (
        homeTeam?.team?.displayName === game.home &&
        awayTeam?.team?.displayName === game.away
      );
    });
    
    if (!event) return null;
    
    const competition = event.competitions[0];
    const competitors = competition.competitors;
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
    
    // Map ESPN status to our status
    let status: GameStatus['status'] = 'scheduled';
    if (competition.status.type.name === 'STATUS_FINAL') {
      status = 'final';
    } else if (competition.status.type.name === 'STATUS_IN_PROGRESS') {
      status = 'in-progress';  
    } else if (competition.status.type.name === 'STATUS_POSTPONED') {
      status = 'postponed';
    } else if (competition.status.type.name === 'STATUS_CANCELLED') {
      status = 'cancelled';
    }
    
    return {
      gameId: game.id,
      status,
      homeScore: parseInt(homeTeam?.score || '0'),
      awayScore: parseInt(awayTeam?.score || '0'),
      lastUpdated: new Date().toISOString(),
      source: 'ESPN API'
    };
    
  } catch (error) {
    console.warn('Failed to fetch game status:', error);
    return null;
  }
}

/**
 * Determine if a game can be resolved and get the winner
 */
export function resolveGame(gameStatus: GameStatus, game: Game): {
  canResolve: boolean;
  homeWins?: boolean;
  reason: string;
} {
  if (gameStatus.status !== 'final') {
    return {
      canResolve: false,
      reason: `Game status is "${gameStatus.status}", not "final"`
    };
  }
  
  if (gameStatus.homeScore === undefined || gameStatus.awayScore === undefined) {
    return {
      canResolve: false,
      reason: 'Final scores not available'
    };
  }
  
  if (gameStatus.homeScore === gameStatus.awayScore) {
    return {
      canResolve: false,
      reason: 'Game ended in a tie - unusual for NBA/NFL'
    };
  }
  
  const homeWins = gameStatus.homeScore > gameStatus.awayScore;
  
  return {
    canResolve: true,
    homeWins,
    reason: `${game.home}: ${gameStatus.homeScore}, ${game.away}: ${gameStatus.awayScore} - ${homeWins ? game.home : game.away} wins`
  };
}

/**
 * Get comprehensive resolution info for a game
 */
export async function getGameResolutionInfo(game: Game): Promise<{
  window: ResolutionWindow;
  status: GameStatus | null;
  resolution: ReturnType<typeof resolveGame> | null;
}> {
  const window = getResolutionWindow(game);
  const status = await fetchGameStatus(game);
  const resolution = status ? resolveGame(status, game) : null;
  
  return {
    window,
    status,
    resolution
  };
}

/**
 * Format resolution rules for market description
 */
export function formatResolutionRules(game: Game): string {
  const targetHours = game.league === 'NBA' ? '3-4' : '4-5';
  const maxHours = game.league === 'NBA' ? '8' : '12';
  
  return `**Resolution Requirements:**
• Game must show "Final" status on ESPN
• Target resolution: ${targetHours} hours after tip-off
• Hard deadline: ${maxHours} hours after tip-off
• Includes overtime periods
• Accounts for delays and official reporting lag
• Evidence: Screenshot of ESPN final score + game recap link`;
}
