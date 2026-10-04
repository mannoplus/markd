export type TaiwanRegion = 
  | 'taipei' 
  | 'new_taipei' 
  | 'taoyuan' 
  | 'hsinchu' 
  | 'taichung' 
  | 'tainan' 
  | 'kaohsiung' 
  | 'other';

export type TheaterChain = 
  | 'vieshow' 
  | 'showtime' 
  | 'ambassador' 
  | 'shinkong' 
  | 'in89' 
  | 'independent';

export type ScreenFormat = '2D' | '3D' | 'IMAX' | '4DX' | 'Dolby' | 'ScreenX' | 'TITAN';

export type TaiwanAgeRating = '0+' | '6+' | '12+' | '15+' | '18+'; // 普遍級, 保護級, 輔12, 輔15, 限制級

export interface MovieDetail {
  id: string;
  titleZh: string;              // e.g., "阿凡達：水之道"
  titleEn: string;              // e.g., "Avatar: The Way of Water"
  posterUrl: string;
  backdropUrl: string;
  rating: TaiwanAgeRating;
  durationMinutes: number;
  releaseDate: string;          // ISO Date string (YYYY-MM-DD)
  genres: string[];
  synopsis: string;
  trailerYoutubeId?: string;
  director?: string;
  cast?: string[];
  voteAverage?: number;
  voteCount?: number;
}

export interface ShowtimeSlot {
  id: string;
  time: string;                 // e.g., "14:30"
  datetime: string;             // ISO datetime
  hallName: string;             // e.g., "第 2 廳"
  format: ScreenFormat;
  bookingUrl?: string;
  totalSeats: number;
  availableSeats: number;
  occupancyStatus: 'open' | 'filling' | 'almost_full' | 'sold_out';
}

export interface TheaterWithShowtimes {
  theaterId: string;
  theaterNameZh: string;        // e.g., "台北信義威秀影城"
  theaterNameEn: string;
  chain: TheaterChain;
  region: TaiwanRegion;
  address: string;
  distanceKm?: number;
  showtimes: ShowtimeSlot[];
}

export type SeatType = 'standard' | 'vip' | 'wheelchair' | 'couple';
export type SeatState = 'available' | 'occupied' | 'reserved' | 'selected';

export interface SeatItem {
  id: string;
  row: string;
  col: string;
  type: SeatType;
  status: SeatState;
  price?: number;
}

export interface SeatMapLayout {
  screeningId: string;
  movieTitle: string;
  theaterName: string;
  hallName: string;
  format: ScreenFormat;
  showtime: string;
  totalSeats: number;
  availableSeats: number;
  rows: string[];
  cols: string[];
  seats: SeatItem[];
}

export interface ShowtimeFilterState {
  date: string;
  region: TaiwanRegion | 'all';
  chains: TheaterChain[];
  formats: ScreenFormat[];
  query?: string;
}
