import { TaiwanRegion, TheaterChain, ScreenFormat, TaiwanAgeRating } from '@/types/cinema';

export interface RegionOption {
  value: TaiwanRegion | 'all';
  labelZh: string;
  labelEn: string;
}

export const TAIWAN_REGIONS: RegionOption[] = [
  { value: 'all', labelZh: '全台灣', labelEn: 'All Taiwan' },
  { value: 'taipei', labelZh: '台北市', labelEn: 'Taipei City' },
  { value: 'new_taipei', labelZh: '新北市', labelEn: 'New Taipei' },
  { value: 'taoyuan', labelZh: '桃園市', labelEn: 'Taoyuan' },
  { value: 'hsinchu', labelZh: '新竹縣市', labelEn: 'Hsinchu' },
  { value: 'taichung', labelZh: '台中市', labelEn: 'Taichung' },
  { value: 'tainan', labelZh: '台南市', labelEn: 'Tainan' },
  { value: 'kaohsiung', labelZh: '高雄市', labelEn: 'Kaohsiung' },
  { value: 'other', labelZh: '其他地區', labelEn: 'Other' },
];

export interface ChainOption {
  value: TheaterChain;
  labelZh: string;
  labelEn: string;
  shortLabel: string;
  color: string;
}

export const THEATER_CHAINS: ChainOption[] = [
  {
    value: 'vieshow',
    labelZh: '威秀影城',
    labelEn: 'Vie Show Cinemas',
    shortLabel: '威秀',
    color: '#0284c7', // Sky Blue
  },
  {
    value: 'showtime',
    labelZh: '秀泰影城',
    labelEn: 'Showtime Cinemas',
    shortLabel: '秀泰',
    color: '#f43f5e', // Rose
  },
  {
    value: 'ambassador',
    labelZh: '國賓影城',
    labelEn: 'Ambassador Theatres',
    shortLabel: '國賓',
    color: '#d97706', // Amber
  },
  {
    value: 'shinkong',
    labelZh: '新光影城',
    labelEn: 'Shin Kong Cinemas',
    shortLabel: '新光',
    color: '#0d9488', // Teal
  },
  {
    value: 'in89',
    labelZh: 'in89 豪華影城',
    labelEn: 'in89 Cinemax',
    shortLabel: 'in89',
    color: '#8b5cf6', // Purple
  },
  {
    value: 'independent',
    labelZh: '獨立 / 其他影城',
    labelEn: 'Independent Cinemas',
    shortLabel: '獨立',
    color: '#64748b', // Slate
  },
];

export interface FormatOption {
  value: ScreenFormat;
  label: string;
  description: string;
  badgeStyle: string;
}

export const SCREEN_FORMATS: FormatOption[] = [
  {
    value: '2D',
    label: '數位 2D',
    description: '標準數位版本',
    badgeStyle: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },
  {
    value: 'IMAX',
    label: 'IMAX',
    description: '巨幕沉浸視效體驗',
    badgeStyle: 'bg-blue-950/80 text-blue-400 border-blue-800/80 shadow-[0_0_12px_rgba(59,130,246,0.25)]',
  },
  {
    value: '4DX',
    label: '4DX',
    description: '動態體感座椅與環境特效',
    badgeStyle: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  },
  {
    value: 'Dolby',
    label: 'Dolby Cinema',
    description: '杜比視界 HDR 與全景聲',
    badgeStyle: 'bg-amber-950/80 text-amber-400 border-amber-800/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  },
  {
    value: 'ScreenX',
    label: 'ScreenX',
    description: '270度三面環繞銀幕',
    badgeStyle: 'bg-purple-950/80 text-purple-400 border-purple-800/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
  },
  {
    value: 'TITAN',
    label: 'TITAN 巨幕',
    description: '威秀巨幕廳旗艦音畫',
    badgeStyle: 'bg-rose-950/80 text-rose-400 border-rose-800/80 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
  },
  {
    value: '3D',
    label: '數位 3D',
    description: '立體眼鏡觀影',
    badgeStyle: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80',
  },
];

export interface RatingBadgeMeta {
  code: TaiwanAgeRating;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const TAIWAN_AGE_RATINGS: Record<TaiwanAgeRating, RatingBadgeMeta> = {
  '0+': {
    code: '0+',
    nameZh: '普遍級',
    nameEn: 'General',
    descriptionZh: '一般觀眾皆可觀賞',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
  },
  '6+': {
    code: '6+',
    nameZh: '保護級',
    nameEn: 'Protected',
    descriptionZh: '未滿6歲不得觀賞，6歲以上12歲未滿需父母陪同',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/30',
  },
  '12+': {
    code: '12+',
    nameZh: '輔12級',
    nameEn: 'PG-12',
    descriptionZh: '未滿12歲不得觀賞',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  '15+': {
    code: '15+',
    nameZh: '輔15級',
    nameEn: 'PG-15',
    descriptionZh: '未滿15歲不得觀賞',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
  },
  '18+': {
    code: '18+',
    nameZh: '限制級',
    nameEn: 'Restricted',
    descriptionZh: '未滿18歲不得觀賞',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
  },
};
