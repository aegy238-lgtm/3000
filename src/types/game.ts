export type FruitId =
  | 'lemon'
  | 'raspberry'
  | 'kiwi'
  | 'plum'
  | 'strawberry'
  | 'banana'
  | 'watermelon'
  | 'cherry';

export interface FruitConfig {
  id: FruitId;
  nameAr: string;
  multiplier: number;
  label: string;
  sprite: string;
  /** Clockwise index around the 3x3 perimeter (0..7) */
  ringIndex: number;
  /** Visual tile row/col position in 3x3 grid (0..8, excluding center 4) */
  gridSlot: number;
  /** Tile color family matching Screenshot 1 (teal-navy for 5x, deep purple for 10x/20x/40x) */
  tone: 'teal' | 'purple';
  /** Weight for weighted random selection so probabilities feel authentic */
  weight: number;
}

/**
 * Clockwise perimeter order around the center LED timer:
 * 0: Lemon (top-left) -> 1: Raspberry (top-mid) -> 2: Kiwi (top-right)
 * -> 3: Plum (mid-right) -> 4: Strawberry (bot-right) -> 5: Banana (bot-mid)
 * -> 6: Watermelon (bot-left) -> 7: Cherry (mid-left)
 */
export const FRUITS: FruitConfig[] = [
  {
    id: 'lemon',
    nameAr: 'ليمون',
    multiplier: 5,
    label: '5 times',
    sprite: '/assets/sprites/fruit_lemon.png',
    ringIndex: 0,
    gridSlot: 0,
    tone: 'teal',
    weight: 20,
  },
  {
    id: 'raspberry',
    nameAr: 'توت',
    multiplier: 5,
    label: '5 times',
    sprite: '/assets/sprites/fruit_raspberry.png',
    ringIndex: 1,
    gridSlot: 1,
    tone: 'teal',
    weight: 20,
  },
  {
    id: 'kiwi',
    nameAr: 'كيوي',
    multiplier: 5,
    label: '5 times',
    sprite: '/assets/sprites/fruit_kiwi.png',
    ringIndex: 2,
    gridSlot: 2,
    tone: 'teal',
    weight: 20,
  },
  {
    id: 'plum',
    nameAr: 'برقوق',
    multiplier: 5,
    label: '5 times',
    sprite: '/assets/sprites/fruit_plum.png',
    ringIndex: 3,
    gridSlot: 5,
    tone: 'teal',
    weight: 20,
  },
  {
    id: 'strawberry',
    nameAr: 'فراولة',
    multiplier: 10,
    label: '10 times',
    sprite: '/assets/sprites/fruit_strawberry.png',
    ringIndex: 4,
    gridSlot: 8,
    tone: 'purple',
    weight: 10,
  },
  {
    id: 'banana',
    nameAr: 'موز',
    multiplier: 10,
    label: '10 times',
    sprite: '/assets/sprites/fruit_banana.png',
    ringIndex: 5,
    gridSlot: 7,
    tone: 'purple',
    weight: 10,
  },
  {
    id: 'watermelon',
    nameAr: 'بطيخ',
    multiplier: 20,
    label: '20 times',
    sprite: '/assets/sprites/fruit_watermelon.png',
    ringIndex: 6,
    gridSlot: 6,
    tone: 'purple',
    weight: 5,
  },
  {
    id: 'cherry',
    nameAr: 'كرز',
    multiplier: 40,
    label: '40 times',
    sprite: '/assets/sprites/fruit_cherry.png',
    ringIndex: 7,
    gridSlot: 3,
    tone: 'purple',
    weight: 2.5,
  },
];

export const FRUIT_MAP: Record<FruitId, FruitConfig> = FRUITS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<FruitId, FruitConfig>,
);

export interface ChipConfig {
  id: string;
  label: string;
  value: number;
  sprite: string;
}

export const CHIPS: ChipConfig[] = [
  { id: '1k', label: '1K', value: 1000, sprite: '/assets/sprites/chip_1k.png' },
  { id: '10k', label: '10K', value: 10000, sprite: '/assets/sprites/chip_10k.png' },
  { id: '100k', label: '100K', value: 100000, sprite: '/assets/sprites/chip_100k.png' },
  { id: '1m', label: '1M', value: 1000000, sprite: '/assets/sprites/chip_1m.png' },
];

export type GamePhase = 'BETTING' | 'SPINNING' | 'RESULT';

export type BonusType = 'NONE' | 'EXTRA_1' | 'EXTRA_2' | 'MULT_2' | 'MULT_3' | 'JACKPOT';

export interface BetEntry {
  fruitId: FruitId;
  amount: number;
}

export interface RoundRecord {
  roundNumber: number;
  dateStr: string;
  timeStr: string;
  bets: BetEntry[];
  winningFruit: FruitId;
  bonusFruits?: FruitId[];
  bonusLabel?: string;
  totalBet: number;
  totalWin: number;
}

export interface RoundRankPlayer {
  rank: number;
  name: string;
  win: number;
  isMe?: boolean;
}

/** Initial 8 recent fruits matching Screenshot 1 (leftmost is newest with NEW badge) */
export const INITIAL_HISTORY_STRIP: FruitId[] = [
  'lemon',
  'plum',
  'raspberry',
  'plum',
  'kiwi',
  'kiwi',
  'kiwi',
  'strawberry',
];

/** Initial historical records matching Screenshot 3 (rounds 936 & 935) */
export const INITIAL_RECORDS: RoundRecord[] = [
  {
    roundNumber: 936,
    dateStr: '2026-10-11',
    timeStr: '03:33:24',
    bets: [
      { fruitId: 'cherry', amount: 10000 },
      { fruitId: 'watermelon', amount: 10000 },
      { fruitId: 'banana', amount: 10000 },
      { fruitId: 'strawberry', amount: 10000 },
      { fruitId: 'plum', amount: 20000 },
      { fruitId: 'kiwi', amount: 20000 },
    ],
    winningFruit: 'kiwi',
    totalBet: 80000,
    totalWin: 100000,
  },
  {
    roundNumber: 935,
    dateStr: '2026-10-11',
    timeStr: '03:32:52',
    bets: [
      { fruitId: 'cherry', amount: 10000 },
      { fruitId: 'watermelon', amount: 10000 },
      { fruitId: 'banana', amount: 10000 },
      { fruitId: 'strawberry', amount: 20000 },
      { fruitId: 'plum', amount: 40000 },
      { fruitId: 'kiwi', amount: 30000 },
    ],
    winningFruit: 'raspberry',
    totalBet: 120000,
    totalWin: 0,
  },
];

export function formatShortCoins(amount: number): string {
  if (amount === 0) return '0';
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `${Number.isInteger(val) ? val : val.toFixed(1)}M`;
  }
  if (amount >= 10_000) {
    const val = amount / 1_000;
    return `${Number.isInteger(val) ? val : val.toFixed(1)}K`;
  }
  if (amount >= 1_000 && amount % 1_000 === 0) {
    return `${amount / 1_000}K`;
  }
  return amount.toLocaleString('en-US');
}

export function formatJackpotNumber(num: number): string {
  return Math.floor(num).toLocaleString('en-US');
}
