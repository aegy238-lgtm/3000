import React from 'react';
import { FRUIT_MAP, RoundRecord, formatShortCoins } from '../types/game';
import { X } from 'lucide-react';

interface HistoryModalProps {
  records: RoundRecord[];
  balance: number;
  onTopUp: (amount: number) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  records,
  balance,
  onTopUp,
  onClose,
}) => {
  return (
    <div
      className="absolute inset-0 z-40 rounded-[18px] flex flex-col overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, rgba(44, 29, 92, 0.95) 0%, rgba(28, 17, 62, 0.97) 100%)',
        border: '2px solid rgba(188, 174, 240, 0.88)',
        boxShadow: '0 0 26px rgba(118, 86, 215, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-label="السجلات التاريخية"
    >
      {/* Lavender Header Bar matching Screenshot 3 */}
      <div
        className="relative flex items-center justify-center py-2.5 px-4 shrink-0"
        style={{
          background: 'linear-gradient(180deg, #9981d9 0%, #7d64c2 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.28)',
        }}
      >
        <h2 className="text-[18px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          السجلات التاريخية
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #c6b6f5 0%, #9883d8 70%, #7860bd 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.65)',
          }}
          aria-label="إغلاق"
        >
          <X className="w-5 h-5 text-white stroke-[3]" />
        </button>
      </div>

      {/* Column Headers matching Screenshot 3 left-to-right */}
      <div className="grid grid-cols-[1.25fr_1.35fr_0.75fr_0.9fr] items-center text-center py-2 px-2 text-[12px] sm:text-[13px] font-bold text-white/95 border-b border-white/25 shrink-0 bg-[#2b1a5c]/55">
        <span>الرهان على الوقت</span>
        <span>الرهان التفاصيل</span>
        <span>النتائج</span>
        <span>الفوز</span>
      </div>

      {/* Scrollable Round History Rows */}
      <div className="flex-1 overflow-y-auto arcade-scroll px-2 divide-y divide-white/25">
        {records.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-white/65 py-10">
            لا توجد رهانات مسجلة بعد
          </div>
        ) : (
          records.map((rec) => {
            const winFruit = FRUIT_MAP[rec.winningFruit];
            return (
              <div
                key={`${rec.roundNumber}-${rec.timeStr}`}
                className="grid grid-cols-[1.25fr_1.35fr_0.75fr_0.9fr] items-center py-2.5 gap-1"
              >
                {/* Col 1: Date, Time & Round */}
                <div className="flex flex-col items-center text-center leading-tight">
                  <span
                    className="text-[11px] sm:text-[12px] font-bold text-white/95 tabular-nums"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {rec.dateStr}
                  </span>
                  <span
                    className="text-[11px] sm:text-[12px] font-bold text-white/90 tabular-nums mt-0.5"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {rec.timeStr}
                  </span>
                  <span className="text-[11px] sm:text-[12px] font-bold text-white/90 mt-0.5">
                    {rec.roundNumber} الجولة
                  </span>
                </div>

                {/* Col 2: Bet Details List (fruit icon + gold coin + amount) */}
                <div className="flex flex-col gap-1 items-center">
                  {rec.bets.map((b) => {
                    const f = FRUIT_MAP[b.fruitId];
                    return (
                      <div key={b.fruitId} className="flex items-center justify-between w-[96px] gap-1">
                        <img
                          src={f.sprite}
                          alt={f.nameAr}
                          className="w-[21px] h-[21px] object-contain shrink-0"
                          draggable={false}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex items-center gap-1 min-w-[54px]">
                          <img
                            src="/assets/sprites/coin_gold.png"
                            alt=""
                            className="w-[15px] h-[15px] object-contain shrink-0"
                            draggable={false}
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className="text-[12px] font-bold text-white tabular-nums"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                          >
                            {formatShortCoins(b.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Col 3: Winning Fruit */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <img
                    src={winFruit.sprite}
                    alt={winFruit.nameAr}
                    className="w-[24px] h-[24px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                  {rec.bonusLabel && (
                    <span className="text-[9px] font-bold text-[#ffe359] whitespace-nowrap">
                      {rec.bonusLabel}
                    </span>
                  )}
                </div>

                {/* Col 4: Win Payout */}
                <div className="flex items-center justify-center gap-1">
                  <img
                    src="/assets/sprites/coin_gold.png"
                    alt=""
                    className="w-[16px] h-[16px] object-contain shrink-0"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className={`text-[12px] sm:text-[13px] font-extrabold tabular-nums ${
                      rec.totalWin > 0 ? 'text-[#ffe452]' : 'text-white'
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {formatShortCoins(rec.totalWin)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Balance & Instant Free Coin Refill Strip so player can always keep playing */}
      <div
        className="shrink-0 px-3 py-2 flex items-center justify-between gap-2 border-t border-white/20 bg-[#21114a]/85"
        dir="rtl"
      >
        <div className="flex items-center gap-1.5 text-[12px] text-white/90">
          <span className="font-bold">رصيدك:</span>
          <img
            src="/assets/sprites/coin_gold.png"
            alt=""
            className="w-4 h-4 object-contain"
            draggable={false}
            referrerPolicy="no-referrer"
          />
          <span
            className="font-extrabold text-[#ffe452] tabular-nums"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {balance.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onTopUp(100000)}
            className="px-2.5 py-1 rounded-full text-[11px] font-extrabold text-[#2f1300] bg-gradient-to-b from-[#ffe96b] to-[#f4a91d] shadow hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            +100K مجاني
          </button>
          <button
            type="button"
            onClick={() => onTopUp(1000000)}
            className="px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white bg-gradient-to-b from-[#e956ff] to-[#9b24d4] shadow hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            +1M مجاني
          </button>
        </div>
      </div>
    </div>
  );
};
