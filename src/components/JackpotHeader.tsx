import React from 'react';
import { formatJackpotNumber } from '../types/game';

interface JackpotHeaderProps {
  jackpotPool: number;
  reelsSpinning: boolean;
  leverPulled: boolean;
  bonusBadgeText: string | null;
}

export const JackpotHeader: React.FC<JackpotHeaderProps> = ({
  jackpotPool,
  reelsSpinning,
  leverPulled,
  bonusBadgeText,
}) => {
  return (
    <div className="relative w-full flex flex-col items-center pointer-events-none select-none z-20">
      {/* Exact cropped JACKPOT 3D gold crown, coins, ribbons & neon arrows */}
      <div className="relative w-[84%] max-w-[385px]">
        <img
          src="/assets/sprites/jackpot_header.png"
          alt="JACKPOT"
          className="w-full h-auto block drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          draggable={false}
          referrerPolicy="no-referrer"
        />

        {/* Live Jackpot Number positioned accurately inside the purple gold-bordered box */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: '23.6%',
            width: '46.6%',
            top: '66.5%',
            height: '29.5%',
          }}
        >
          <span
            className="font-black tracking-wide tabular-nums leading-none text-center"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(17px, 4.7vw, 24px)',
              color: '#ffe838',
              textShadow: '0 2px 0 #8a3a00, 0 0 10px rgba(255, 210, 40, 0.45)',
            }}
          >
            {formatJackpotNumber(jackpotPool)}
          </span>
        </div>
      </div>

      {/* 3-Reel Mini JJ Slot Machine + Red Lever directly beneath the Jackpot box */}
      <div className="relative -mt-[2px] flex items-center justify-center w-[46.5%] max-w-[214px]">
        {/* Outer gold metallic slot bezel */}
        <div
          className="relative w-full rounded-[7px] p-[3.5px] z-10"
          style={{
            background:
              'linear-gradient(180deg, #fff4a3 0%, #f5b924 22%, #b56806 55%, #f7ca44 82%, #8e4c00 100%)',
            boxShadow: '0 5px 14px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.7)',
          }}
        >
          <div className="grid grid-cols-3 gap-[2.5px] bg-[#2a1746] rounded-[4px] overflow-hidden">
            {[0, 1, 2].map((reelIdx) => (
              <div
                key={reelIdx}
                className="relative aspect-[96/104] overflow-hidden bg-gradient-to-b from-[#9c82c4] via-[#f1ebf9] to-[#876bb3]"
              >
                {reelsSpinning ? (
                  <div
                    className="w-full flex flex-col animate-reel-spin"
                    style={{ animationDelay: `${reelIdx * 0.06}s` }}
                  >
                    <img
                      src="/assets/sprites/reel_jj.png"
                      alt="JJ"
                      className="w-full h-auto block"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                    <img
                      src="/assets/sprites/reel_jj.png"
                      alt="JJ"
                      className="w-full h-auto block"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <img
                    src="/assets/sprites/reel_jj.png"
                    alt="JJ"
                    className="w-full h-full object-cover block"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* Subtle cylinder sheen */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(25,10,50,0.34) 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0) 55%, rgba(25,10,50,0.38) 100%)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bonus banner flash when Lucky Bonus / Jackpot hits */}
          {bonusBadgeText && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px] rounded-[5px]">
              <span
                className="px-2 py-0.5 text-xs font-black tracking-wide text-[#fff36e] drop-shadow-[0_1px_4px_rgba(255,110,0,0.95)]"
                style={{ fontFamily: "'Cairo', 'Outfit', sans-serif" }}
              >
                {bonusBadgeText}
              </span>
            </div>
          )}
        </div>

        {/* 3D Mechanical Red Lever on the right side of the 3-reel box */}
        <div className="absolute -right-[20px] top-1/2 -translate-y-1/2 flex items-center z-0">
          {/* Metallic mount socket */}
          <div
            className="w-[14px] h-[22px] rounded-r-[5px]"
            style={{
              background: 'linear-gradient(180deg, #f3edf8 0%, #86779e 45%, #3f3454 100%)',
              boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.6), 0 2px 5px rgba(0,0,0,0.55)',
            }}
          />
          {/* Lever arm + glossy red ball knob */}
          <div
            className="relative -ml-[5px] origin-bottom transition-transform duration-300 ease-out"
            style={{
              transform: leverPulled ? 'rotate(138deg) translateY(4px)' : 'rotate(22deg) translateY(-10px)',
            }}
          >
            <div
              className="w-[4.5px] h-[26px] rounded-full"
              style={{
                background: 'linear-gradient(90deg, #ffffff 0%, #9b95aa 60%, #4e4760 100%)',
              }}
            />
            <div
              className="w-[14px] h-[14px] rounded-full -ml-[4.8px] -mt-[34px]"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #ff937d 0%, #ef231b 55%, #8c0909 100%)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.55)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
