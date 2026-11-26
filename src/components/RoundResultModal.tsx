import React from 'react';
import { FRUIT_MAP, FruitId, RoundRankPlayer, formatShortCoins } from '../types/game';

interface RoundResultModalProps {
  roundNumber: number;
  winningFruit: FruitId;
  bonusFruits: FruitId[];
  bonusLabel: string | null;
  roundWin: number;
  roundBet: number;
  countdown: number;
  rankings: RoundRankPlayer[];
  onClose: () => void;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  roundNumber,
  winningFruit,
  bonusFruits,
  bonusLabel,
  roundWin,
  roundBet,
  countdown,
  rankings,
  onClose,
}) => {
  const fruit = FRUIT_MAP[winningFruit];

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 rounded-[18px] flex flex-col justify-between px-5 py-4 cursor-pointer select-none"
      style={{
        background: 'linear-gradient(180deg, rgba(44, 28, 92, 0.92) 0%, rgba(30, 18, 66, 0.94) 100%)',
        border: '2px solid rgba(188, 174, 240, 0.85)',
        boxShadow: '0 0 24px rgba(130, 95, 225, 0.55), inset 0 0 26px rgba(162, 134, 245, 0.16)',
        backdropFilter: 'blur(3px)',
      }}
      role="dialog"
      aria-label={`نتائج الجولة ${roundNumber}`}
    >
      {/* Top-right (3s) countdown badge matching Screenshot 2 */}
      <div className="flex justify-end items-center">
        <span
          className="text-[16px] font-extrabold text-[#ffd45c] tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          ({countdown}s)
        </span>
      </div>

      {/* Main Result Rows (Exact layout from Screenshot 2) */}
      <div className="flex flex-col items-center gap-3.5 my-1">
        {/* Row 1: Winning Fruit */}
        <div className="flex items-center justify-center gap-3.5">
          <span className="text-[16px] sm:text-[18px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            : نتائج الجولة {roundNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <img
              src={fruit.sprite}
              alt={fruit.nameAr}
              className="w-[46px] h-[46px] object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]"
              draggable={false}
              referrerPolicy="no-referrer"
            />
            {bonusFruits.map((bf, idx) => (
              <img
                key={`${bf}-${idx}`}
                src={FRUIT_MAP[bf].sprite}
                alt={FRUIT_MAP[bf].nameAr}
                className="w-[34px] h-[34px] object-contain drop-shadow-[0_2px_6px_rgba(255,215,0,0.65)]"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>

        {/* Lucky Bonus / Jackpot Banner if triggered */}
        {bonusLabel && (
          <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-[#3c1200] text-[13px] font-black shadow-[0_0_12px_rgba(255,208,45,0.8)]">
            {bonusLabel}
          </div>
        )}

        {/* Row 2: Round Winnings */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-[15px] sm:text-[16px] font-semibold text-white/95">
            : أرباح هذه الجولة
          </span>
          <div className="flex items-center gap-1.5 min-w-[64px]">
            <img
              src="/assets/sprites/coin_gold.png"
              alt=""
              className="w-[21px] h-[21px] object-contain"
              draggable={false}
              referrerPolicy="no-referrer"
            />
            <span
              className={`text-[16px] font-extrabold tabular-nums ${
                roundWin > 0 ? 'text-[#ffe34d]' : 'text-white'
              }`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {roundWin > 0 ? formatShortCoins(roundWin) : '0'}
            </span>
          </div>
        </div>

        {/* Row 3: Round Bets */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-[15px] sm:text-[16px] font-semibold text-white/95">
            : رهانات هذه الجولة
          </span>
          <div className="flex items-center gap-1.5 min-w-[64px]">
            <img
              src="/assets/sprites/coin_gold.png"
              alt=""
              className="w-[21px] h-[21px] object-contain"
              draggable={false}
              referrerPolicy="no-referrer"
            />
            <span
              className="text-[16px] font-extrabold text-white tabular-nums"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {roundBet > 0 ? formatShortCoins(roundBet) : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Dotted Gold Divider + Round Ranking Header matching Screenshot 2 */}
      <div className="mt-2 mb-auto">
        <div className="flex items-center justify-center gap-3 my-2">
          <div className="flex-1 border-b-2 border-dotted border-[#e7b23c]/80" />
          <span className="text-[15px] font-bold text-[#f7be44] whitespace-nowrap">
            :ترتيب هذه الجولة
          </span>
          <div className="flex-1 border-b-2 border-dotted border-[#e7b23c]/80" />
        </div>

        {/* Top Winners for the Round */}
        <div className="mt-2.5 flex flex-col gap-1.5">
          {rankings.map((player) => (
            <div
              key={`${player.rank}-${player.name}`}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] ${
                player.isMe
                  ? 'bg-[#ffe44d]/18 border border-[#ffe44d]/50'
                  : 'bg-white/6'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <img
                  src="/assets/sprites/coin_gold.png"
                  alt=""
                  className="w-[16px] h-[16px] object-contain"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
                <span
                  className="font-bold text-[#ffe359] tabular-nums"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {formatShortCoins(player.win)}
                </span>
              </div>
              <div className="flex items-center gap-2" dir="rtl">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    player.rank === 1
                      ? 'bg-[#ffca28] text-[#421f00]'
                      : player.rank === 2
                      ? 'bg-[#dce4f0] text-[#1f2937]'
                      : 'bg-[#d98a4e] text-[#3a1700]'
                  }`}
                >
                  {player.rank}
                </span>
                <span className="font-bold text-white/95 truncate max-w-[130px]">
                  {player.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
