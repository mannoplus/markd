import {
  MovieDetail,
  TheaterWithShowtimes,
  SeatMapLayout,
  SeatItem,
  TaiwanRegion,
  TheaterChain,
  ScreenFormat,
} from '@/types/cinema';

// Sample mock movies with rich bilingual metadata and Taiwan age ratings
export const MOCK_MOVIES: Record<string, MovieDetail> = {
  '1': {
    id: '1',
    titleZh: '沙丘：第二部',
    titleEn: 'Dune: Part Two',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    rating: '12+',
    durationMinutes: 166,
    releaseDate: '2024-02-28',
    genres: ['科幻', '冒險', '劇情'],
    synopsis:
      '保羅亞崔迪與荃妮以及弗瑞曼人聯手，對毀滅他家族的陰謀者展開報復。在面對一生摯愛與已知宇宙命運的兩難抉擇中，他必須竭力阻止只有他能預見的可怕未來。全片以 IMAX 特製拍攝，帶來前所未有的視聽震撼。',
    trailerYoutubeId: 'Way9Dexny3w',
    director: '丹尼·維勒納夫 (Denis Villeneuve)',
    cast: ['提摩西·夏勒梅', '辛蒂亞', '蕾貝卡·弗格森', '哈維爾·巴登', '奧斯汀·巴特勒'],
    voteAverage: 8.5,
    voteCount: 4210,
  },
  '2': {
    id: '2',
    titleZh: '荒野機器人',
    titleEn: 'The Wild Robot',
    posterUrl: 'https://image.tmdb.org/t/p/w780/9w0Vh9eizgcCwspIQyoObeeuGMz.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/417tYZ4XUyJrtyZXj7HpvWf1E8f.jpg',
    rating: '0+',
    durationMinutes: 102,
    releaseDate: '2024-10-10',
    genres: ['動畫', '科幻', '家庭'],
    synopsis:
      '夢工廠動畫經典鉅獻。一隻名為「羅茲」的機器人因為船難漂流至無人荒島，她必須學會適應嚴苛的自然環境，逐漸與島上的野生動物建立情感，並意外成為一隻失去母親的小野雁的守護者。',
    trailerYoutubeId: '67vbA5ZJod8',
    director: '克里斯·桑德斯 (Chris Sanders)',
    cast: ['露琵塔·尼詠歐', '佩德羅·帕斯卡', '基特·康納', '比爾·奈伊'],
    voteAverage: 8.4,
    voteCount: 1890,
  },
  '3': {
    id: '3',
    titleZh: '阿凡達：火與灰燼',
    titleEn: 'Avatar: Fire and Ash',
    posterUrl: 'https://image.tmdb.org/t/p/w780/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/vL5LR6WdxWPjCmvGE4ahSnG95ft.jpg',
    rating: '12+',
    durationMinutes: 190,
    releaseDate: '2026-12-19', // Pre-release edge case
    genres: ['科幻', '動作', '冒險'],
    synopsis:
      '詹姆斯卡麥隆執導的潘朵拉史詩第三部章節。傑克蘇里與奈蒂莉將遭遇潘朵拉星球上全新的納美人部落——以火山灰燼為崇拜對象的「灰人族」（Ash People），並面臨前所未有的倫理考驗與存亡戰爭。',
    trailerYoutubeId: 'd9MyW72ELq0',
    director: '詹姆斯·卡麥隆 (James Cameron)',
    cast: ['山姆·沃辛頓', '柔伊·莎達娜', '雪歌妮·薇佛', '楊紫瓊', '烏娜·卓別林'],
    voteAverage: 0,
    voteCount: 0,
  },
};

// Generate realistic mock showtimes across Taiwan theater chains
export function generateMockTheaters(targetDate: string): TheaterWithShowtimes[] {
  return [
    {
      theaterId: 'vs-xinyi',
      theaterNameZh: '台北信義威秀影城',
      theaterNameEn: 'Taipei Xinyi Vie Show Cinemas',
      chain: 'vieshow',
      region: 'taipei',
      address: '台北市信義區松壽路20號',
      distanceKm: 1.2,
      showtimes: [
        {
          id: 'st-101',
          time: '10:40',
          datetime: `${targetDate}T10:40:00+08:00`,
          hallName: 'TITAN 巨幕廳',
          format: 'TITAN',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 391,
          availableSeats: 218,
          occupancyStatus: 'open',
        },
        {
          id: 'st-102',
          time: '13:50',
          datetime: `${targetDate}T13:50:00+08:00`,
          hallName: '4DX 影廳',
          format: '4DX',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 140,
          availableSeats: 32,
          occupancyStatus: 'filling',
        },
        {
          id: 'st-103',
          time: '17:15',
          datetime: `${targetDate}T17:15:00+08:00`,
          hallName: 'TITAN 巨幕廳',
          format: 'TITAN',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 391,
          availableSeats: 18,
          occupancyStatus: 'almost_full',
        },
        {
          id: 'st-104',
          time: '20:30',
          datetime: `${targetDate}T20:30:00+08:00`,
          hallName: '第 2 廳',
          format: '2D',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 220,
          availableSeats: 0,
          occupancyStatus: 'sold_out',
        },
      ],
    },
    {
      theaterId: 'st-dome',
      theaterNameZh: '大巨蛋秀泰影城',
      theaterNameEn: 'Taipei Dome Showtime Cinemas',
      chain: 'showtime',
      region: 'taipei',
      address: '台北市信義區光復南路105號2樓',
      distanceKm: 2.1,
      showtimes: [
        {
          id: 'st-201',
          time: '11:20',
          datetime: `${targetDate}T11:20:00+08:00`,
          hallName: 'ScreenX 旗艦巨幕',
          format: 'ScreenX',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 320,
          availableSeats: 245,
          occupancyStatus: 'open',
        },
        {
          id: 'st-202',
          time: '15:10',
          datetime: `${targetDate}T15:10:00+08:00`,
          hallName: 'ScreenX 旗艦巨幕',
          format: 'ScreenX',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 320,
          availableSeats: 88,
          occupancyStatus: 'filling',
        },
        {
          id: 'st-203',
          time: '18:45',
          datetime: `${targetDate}T18:45:00+08:00`,
          hallName: '第 1 廳',
          format: '2D',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 160,
          availableSeats: 72,
          occupancyStatus: 'open',
        },
        {
          id: 'st-204',
          time: '21:30',
          datetime: `${targetDate}T21:30:00+08:00`,
          hallName: 'ScreenX 旗艦巨幕',
          format: 'ScreenX',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 320,
          availableSeats: 12,
          occupancyStatus: 'almost_full',
        },
      ],
    },
    {
      theaterId: 'st-shinshin',
      theaterNameZh: '台北欣欣秀泰影城',
      theaterNameEn: 'Taipei Shin Shin Showtime Cinemas',
      chain: 'showtime',
      region: 'taipei',
      address: '台北市中山區林森北路247號',
      distanceKm: 3.8,
      showtimes: [
        {
          id: 'st-205',
          time: '12:00',
          datetime: `${targetDate}T12:00:00+08:00`,
          hallName: '第 3 廳',
          format: '2D',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 180,
          availableSeats: 110,
          occupancyStatus: 'open',
        },
        {
          id: 'st-206',
          time: '16:20',
          datetime: `${targetDate}T16:20:00+08:00`,
          hallName: '第 5 廳 (丹普廳)',
          format: '2D',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 64,
          availableSeats: 8,
          occupancyStatus: 'almost_full',
        },
        {
          id: 'st-207',
          time: '19:40',
          datetime: `${targetDate}T19:40:00+08:00`,
          hallName: '第 3 廳',
          format: '2D',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 180,
          availableSeats: 0,
          occupancyStatus: 'sold_out',
        },
      ],
    },
    {
      theaterId: 'amb-changchun',
      theaterNameZh: '台北長春國賓影城',
      theaterNameEn: 'Ambassador Theatres Changchun',
      chain: 'ambassador',
      region: 'taipei',
      address: '台北市中山區長春路176號',
      distanceKm: 4.0,
      showtimes: [
        {
          id: 'st-301',
          time: '13:00',
          datetime: `${targetDate}T13:00:00+08:00`,
          hallName: 'A 廳',
          format: '2D',
          bookingUrl: 'https://www.ambassador.com.tw/',
          totalSeats: 210,
          availableSeats: 135,
          occupancyStatus: 'open',
        },
        {
          id: 'st-302',
          time: '17:40',
          datetime: `${targetDate}T17:40:00+08:00`,
          hallName: 'A 廳',
          format: '2D',
          bookingUrl: 'https://www.ambassador.com.tw/',
          totalSeats: 210,
          availableSeats: 48,
          occupancyStatus: 'filling',
        },
      ],
    },
    {
      theaterId: 'vs-banqiao',
      theaterNameZh: '板橋大遠百威秀影城',
      theaterNameEn: 'Banqiao Mega City Vie Show Cinemas',
      chain: 'vieshow',
      region: 'new_taipei',
      address: '新北市板橋區新站路28號10樓',
      distanceKm: 8.5,
      showtimes: [
        {
          id: 'st-401',
          time: '11:00',
          datetime: `${targetDate}T11:00:00+08:00`,
          hallName: 'IMAX 雷射影廳',
          format: 'IMAX',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 398,
          availableSeats: 270,
          occupancyStatus: 'open',
        },
        {
          id: 'st-402',
          time: '14:20',
          datetime: `${targetDate}T14:20:00+08:00`,
          hallName: 'IMAX 雷射影廳',
          format: 'IMAX',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 398,
          availableSeats: 94,
          occupancyStatus: 'filling',
        },
        {
          id: 'st-403',
          time: '17:40',
          datetime: `${targetDate}T17:40:00+08:00`,
          hallName: 'IMAX 雷射影廳',
          format: 'IMAX',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 398,
          availableSeats: 15,
          occupancyStatus: 'almost_full',
        },
      ],
    },
    {
      theaterId: 'sk-taoyuan',
      theaterNameZh: '桃園青埔新光影城',
      theaterNameEn: 'Taoyuan Qingpu Shin Kong Cinemas',
      chain: 'shinkong',
      region: 'taoyuan',
      address: '桃園市中壢區春德路107號',
      distanceKm: 32.0,
      showtimes: [
        {
          id: 'st-501',
          time: '12:30',
          datetime: `${targetDate}T12:30:00+08:00`,
          hallName: 'Dolby Cinema 杜比影院',
          format: 'Dolby',
          bookingUrl: 'https://www.skcinemas.com/',
          totalSeats: 335,
          availableSeats: 210,
          occupancyStatus: 'open',
        },
        {
          id: 'st-502',
          time: '16:00',
          datetime: `${targetDate}T16:00:00+08:00`,
          hallName: 'Dolby Cinema 杜比影院',
          format: 'Dolby',
          bookingUrl: 'https://www.skcinemas.com/',
          totalSeats: 335,
          availableSeats: 58,
          occupancyStatus: 'filling',
        },
      ],
    },
    {
      theaterId: 'st-taichung',
      theaterNameZh: '台中站前秀泰影城',
      theaterNameEn: 'Taichung Station Showtime Cinemas',
      chain: 'showtime',
      region: 'taichung',
      address: '台中市東區南京路76號',
      distanceKm: 145.0,
      showtimes: [
        {
          id: 'st-601',
          time: '10:30',
          datetime: `${targetDate}T10:30:00+08:00`,
          hallName: '1館 巨幕1廳',
          format: 'ScreenX',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 339,
          availableSeats: 280,
          occupancyStatus: 'open',
        },
        {
          id: 'st-602',
          time: '14:00',
          datetime: `${targetDate}T14:00:00+08:00`,
          hallName: '1館 巨幕1廳',
          format: 'ScreenX',
          bookingUrl: 'https://www.showtimes.com.tw/ticketing',
          totalSeats: 339,
          availableSeats: 42,
          occupancyStatus: 'almost_full',
        },
      ],
    },
    {
      theaterId: 'vs-kaohsiung',
      theaterNameZh: '高雄大遠百威秀影城',
      theaterNameEn: 'Kaohsiung FE21 Vie Show Cinemas',
      chain: 'vieshow',
      region: 'kaohsiung',
      address: '高雄市苓雅區三多四路21號13樓',
      distanceKm: 340.0,
      showtimes: [
        {
          id: 'st-701',
          time: '11:40',
          datetime: `${targetDate}T11:40:00+08:00`,
          hallName: 'IMAX 影廳',
          format: 'IMAX',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 284,
          availableSeats: 195,
          occupancyStatus: 'open',
        },
        {
          id: 'st-702',
          time: '15:20',
          datetime: `${targetDate}T15:20:00+08:00`,
          hallName: '4DX 影廳',
          format: '4DX',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 120,
          availableSeats: 22,
          occupancyStatus: 'almost_full',
        },
        {
          id: 'st-703',
          time: '18:50',
          datetime: `${targetDate}T18:50:00+08:00`,
          hallName: '第 8 廳',
          format: '2D',
          bookingUrl: 'https://www.vscinemas.com.tw/vsTicketing/',
          totalSeats: 195,
          availableSeats: 120,
          occupancyStatus: 'open',
        },
      ],
    },
  ];
}

/**
 * Fetches movie details by ID. Supports mock IDs and TMDB movie details.
 */
export async function getMovieDetail(id: string): Promise<MovieDetail | null> {
  // Check local mock records first
  if (MOCK_MOVIES[id]) {
    return MOCK_MOVIES[id];
  }

  // Fallback: Default to Dune: Part Two if ID is unknown or default
  const defaultMovie = MOCK_MOVIES['1'];
  return {
    ...defaultMovie,
    id: id,
    titleZh: `電影場次詳情 #${id}`,
  };
}

/**
 * Retrieves theater schedules with real-time showtimes filtered by date and criteria.
 */
export async function getMovieShowtimes(
  movieId: string,
  date: string,
  filters?: {
    region?: TaiwanRegion | 'all';
    chains?: TheaterChain[];
    formats?: ScreenFormat[];
  }
): Promise<TheaterWithShowtimes[]> {
  const movie = await getMovieDetail(movieId);
  if (!movie) return [];

  // Check if movie is pre-release (e.g. Avatar: Fire and Ash)
  const todayStr = new Date().toISOString().split('T')[0];
  if (movie.releaseDate > todayStr && movie.id === '3') {
    // Pre-release: no screenings published yet
    return [];
  }

  let theaters = generateMockTheaters(date);

  // Region filtering
  if (filters?.region && filters.region !== 'all') {
    theaters = theaters.filter((t) => t.region === filters.region);
  }

  // Chain filtering
  if (filters?.chains && filters.chains.length > 0) {
    theaters = theaters.filter((t) => filters.chains!.includes(t.chain));
  }

  // Format filtering
  if (filters?.formats && filters.formats.length > 0) {
    theaters = theaters
      .map((t) => ({
        ...t,
        showtimes: t.showtimes.filter((s) => filters.formats!.includes(s.format)),
      }))
      .filter((t) => t.showtimes.length > 0);
  }

  return theaters;
}

/**
 * Synthesizes or retrieves a real-time auditorium seat map layout snapshot.
 */
export async function getSeatMapSnapshot(screeningId: string): Promise<SeatMapLayout> {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
  const cols = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];

  const seats: SeatItem[] = [];
  let availableCount = 0;

  rows.forEach((row, rIdx) => {
    cols.forEach((col, cIdx) => {
      // Create aisles
      if (cIdx === 3 || cIdx === 10) return;

      const isWheelchair = rIdx === rows.length - 1 && (col === '1' || col === '2');
      const isVIP = (row === 'E' || row === 'F') && (parseInt(col) >= 6 && parseInt(col) <= 9);

      // Deterministic seat status based on hash of screeningId + row + col
      const hash = (screeningId.length + rIdx * 17 + cIdx * 31) % 100;
      let status: 'available' | 'occupied' | 'reserved' = 'available';

      if (hash < 35) {
        status = 'occupied';
      } else if (hash < 45) {
        status = 'reserved';
      } else {
        status = 'available';
        availableCount++;
      }

      seats.push({
        id: `${row}-${col}`,
        row,
        col,
        type: isWheelchair ? 'wheelchair' : isVIP ? 'vip' : 'standard',
        status,
        price: isVIP ? 380 : isWheelchair ? 190 : 330,
      });
    });
  });

  return {
    screeningId,
    movieTitle: '沙丘：第二部 (Dune: Part Two)',
    theaterName: '台北信義威秀影城',
    hallName: 'TITAN 巨幕廳',
    format: 'TITAN',
    showtime: '17:15',
    totalSeats: seats.length,
    availableSeats: availableCount,
    rows,
    cols,
    seats,
  };
}
