import React from 'react';
import { FruitConfig, formatShortCoins } from '../types/game';

interface FruitTileProps {
  fruit: FruitConfig;
  betAmount: number;
  isHighlighted: boolean;
  isWinner: boolean;
  isBonusWinner: boolean;
  canBet: boolean;
  justBetPulse: boolean;
  onBet: (fruitId: FruitConfig['id']) => void;
}

export const FruitTile: React.FC<FruitTileProps> = ({
  fruit,
  betAmount,
  isHighlighted,
  isWinner,
  isBonusWinner,
  canBet,
  justBetPulse,
  onBet,
}) => {
  const activeGlow = isHighlighted || isWinner || isBonusWinner;

  const baseBackground =
    fruit.tone === 'teal'
      ? 'linear-gradient(180deg, #1b2848 0%, #193b52 55%, #12293e 100%)'
      : 'linear-gradient(180deg, #321063 0%, #4a1588 55%, #240d4e 100%)';

  const highlightedBackground =
    'radial-gradient(circle at 50% 44%, #3e8aff 0%, #1d57d8 52%, #0f2f92 100%)';

  return (
    <button
      type="button"
      onClick={() => onBet(fruit.id)}
      disabled={!canBet}
      className={`relative w-full aspect-square rounded-[13px] overflow-hidden flex flex-col items-center justify-between pt-[10%] pb-[7%] px-1 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
        canBet ? 'cursor-pointer active:scale-[0.95] hover:brightness-110' : 'cursor-default'
      } ${isWinner || isBonusWinner ? 'animate-win-tile z-10' : ''}`}
      style={{
        background: activeGlow ? highlightedBackground : baseBackground,
        boxShadow: activeGlow
          ? '0 0 0 2.5px #8cebff, 0 0 18px rgba(72, 198, 255, 0.9), inset 0 0 18px rgba(135, 224, 255, 0.55)'
          : 'inset 0 2px 4px rgba(0, 0, 0, 0.55), inset 0 -1px 2px rgba(255, 255, 255, 0.14), 0 2px 5px rgba(18, 6, 46, 0.5)',
      }}
      aria-label={`الرهان على ${fruit.nameAr} (${fruit.label})`}
    >
      {/* Subtle dark frame inner bevel matching Screenshot 1 */}
      {!activeGlow && (
        <div
          className="pointer-events-none absolute inset-[2px] rounded-[11px] border border-white/10"
          aria-hidden="true"
        />
      )}

      {/* Golden 4-point sparkles when highlighted (exact Cherry aura from Screenshot 1!) */}
      {activeGlow && (
        <>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-[12%] left-[12%] w-4 h-4 text-[#ffe97a] animate-sparkle"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-[22%] right-[11%] w-3.5 h-3.5 text-[#fff09c] animate-sparkle"
            style={{ animationDelay: '0.35s' }}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute bottom-[28%] left-[14%] w-2.5 h-2.5 text-[#ffe678] animate-sparkle"
            style={{ animationDelay: '0.65s' }}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
        </>
      )}

      {/* User's active bet amount badge on this tile */}
      {betAmount > 0 && (
        <div
          className="absolute top-[4px] right-[4px] z-20 flex items-center gap-[3px] px-[5px] py-[1px] rounded-full bg-[#1a0b3a]/90 border border-[#ffcf40]/85 shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
        >
          <img
            src="/assets/sprites/coin_gold.png"
            alt=""
            className="w-[12px] h-[12px] object-contain"
            draggable={false}
            referrerPolicy="no-referrer"
          />
          <span
            className="text-[10px] font-extrabold text-[#ffe44d] leading-none tabular-nums"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {formatShortCoins(betAmount)}
          </span>
        </div>
      )}

      {/* Coin-pop micro feedback animation on click */}
      {justBetPulse && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
          <img
            src="/assets/sprites/coin_gold.png"
            alt=""
            className="w-6 h-6 animate-coin-pop drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Cropped Real Fruit Sprite */}
      <div className="relative flex-1 w-full flex items-center justify-center px-1.5 min-h-0">
        <img
          src={fruit.sprite}
          alt={fruit.nameAr}
          className={`max-h-[82%] max-w-[82%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.55)] transition-transform duration-150 ${
            activeGlow ? 'scale-[1.07]' : ''
          }`}
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Exact white multiplier caption matching Screenshot 1 */}
      <span
        className="relative z-10 text-[13px] sm:text-[15px] font-semibold tracking-tight text-white/95 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] whitespace-nowrap"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {fruit.label}
      </span>
    </button>
  );
};
