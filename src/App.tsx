import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lightbulb, Power, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import {
  BetEntry,
  BonusType,
  CHIPS,
  FRUITS,
  FRUIT_MAP,
  FruitId,
  GamePhase,
  INITIAL_HISTORY_STRIP,
  INITIAL_RECORDS,
  RoundRankPlayer,
  RoundRecord,
} from './types/game';
import { arcadeSound } from './utils/sound';
import { JackpotHeader } from './components/JackpotHeader';
import { SevenSegmentDisplay } from './components/SevenSegmentDisplay';
import { FruitTile } from './components/FruitTile';
import { RoundResultModal } from './components/RoundResultModal';
import { HistoryModal } from './components/HistoryModal';
import { RulesModal } from './components/RulesModal';

const ROUND_DURATION_SECONDS = 15;
const STORAGE_KEY = 'fruit_jackpot_arcade_v1';

const BOT_NAMES = [
  'الأسطورة',
  'ملك الحظ',
  'أبو فهد',
  'نور القمر',
  'الذئب الذهبي',
  'سارة VIP',
  'فارس الليل',
  'سلطان',
  'ليلى',
  'الزعيم',
];

function pickWeightedFruit(): FruitId {
  const totalWeight = FRUITS.reduce((sum, f) => sum + f.weight, 0);
  let r = Math.random() * totalWeight;
  for (const f of FRUITS) {
    r -= f.weight;
    if (r <= 0) return f.id;
  }
  return FRUITS[0].id;
}

function getJackpotPercent(totalBet: number): number {
  if (totalBet >= 1_000_000) return 1.0;
  if (totalBet >= 100_000) return 0.5;
  if (totalBet >= 10_000) return 0.25;
  if (totalBet >= 1_000) return 0.1;
  return 0;
}

function formatNowParts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    dateStr: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    timeStr: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  };
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      balance?: number;
      todayWins?: number;
      roundNumber?: number;
      jackpotPool?: number;
      historyStrip?: FruitId[];
      records?: RoundRecord[];
    };
  } catch {
    return null;
  }
}

/** 3x3 grid slot mapping: indices 0..8 where 4 is the center LED countdown */
const GRID_SLOTS: Array<FruitId | 'CENTER'> = [
  'lemon',
  'raspberry',
  'kiwi',
  'cherry',
  'CENTER',
  'plum',
  'watermelon',
  'banana',
  'strawberry',
];

const SIDE_BULB_COUNT = 12;

export default function App() {
  const saved = loadSavedState();

  const [balance, setBalance] = useState<number>(saved?.balance ?? 250000);
  const [todayWins, setTodayWins] = useState<number>(saved?.todayWins ?? 0);
  const [roundNumber, setRoundNumber] = useState<number>(saved?.roundNumber ?? 937);
  const [jackpotPool, setJackpotPool] = useState<number>(saved?.jackpotPool ?? 2893571);
  const [historyStrip, setHistoryStrip] = useState<FruitId[]>(
    saved?.historyStrip?.length ? saved.historyStrip.slice(0, 8) : INITIAL_HISTORY_STRIP,
  );
  const [records, setRecords] = useState<RoundRecord[]>(
    saved?.records?.length ? saved.records : INITIAL_RECORDS,
  );

  const [selectedChipIndex, setSelectedChipIndex] = useState<number>(0);
  const [bets, setBets] = useState<Partial<Record<FruitId, number>>>({});
  const [lastRoundBets, setLastRoundBets] = useState<Partial<Record<FruitId, number>>>({});
  const [autoBet, setAutoBet] = useState<boolean>(false);

  const [phase, setPhase] = useState<GamePhase>('BETTING');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(ROUND_DURATION_SECONDS);

  // Highlighted clockwise index (0..7); starts at 7 (Cherry) matching Screenshot 1!
  const [activeRingIndex, setActiveRingIndex] = useState<number>(7);
  const [winningFruit, setWinningFruit] = useState<FruitId | null>(null);
  const [bonusFruits, setBonusFruits] = useState<FruitId[]>([]);
  const [bonusBadgeText, setBonusBadgeText] = useState<string | null>(null);

  // Slot machine reel & lever animation
  const [reelsSpinning, setReelsSpinning] = useState<boolean>(false);
  const [leverPulled, setLeverPulled] = useState<boolean>(false);

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [resultCountdown, setResultCountdown] = useState<number>(3);
  const [lastResultSummary, setLastResultSummary] = useState<{
    roundNumber: number;
    winningFruit: FruitId;
    bonusFruits: FruitId[];
    bonusLabel: string | null;
    roundWin: number;
    roundBet: number;
    rankings: RoundRankPlayer[];
  } | null>(null);

  // Visual feedback
  const [pulseFruit, setPulseFruit] = useState<FruitId | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs for clean async access inside spin/timer loops
  const balanceRef = useRef(balance);
  const betsRef = useRef(bets);
  const lastRoundBetsRef = useRef(lastRoundBets);
  const autoBetRef = useRef(autoBet);
  const roundNumberRef = useRef(roundNumber);
  const jackpotPoolRef = useRef(jackpotPool);
  const activeRingRef = useRef(activeRingIndex);
  const spinTimeoutsRef = useRef<number[]>([]);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  useEffect(() => {
    betsRef.current = bets;
  }, [bets]);
  useEffect(() => {
    lastRoundBetsRef.current = lastRoundBets;
  }, [lastRoundBets]);
  useEffect(() => {
    autoBetRef.current = autoBet;
  }, [autoBet]);
  useEffect(() => {
    roundNumberRef.current = roundNumber;
  }, [roundNumber]);
  useEffect(() => {
    jackpotPoolRef.current = jackpotPool;
  }, [jackpotPool]);
  useEffect(() => {
    activeRingRef.current = activeRingIndex;
  }, [activeRingIndex]);

  // Persist user progress in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance,
          todayWins,
          roundNumber,
          jackpotPool,
          historyStrip,
          records: records.slice(0, 30),
        }),
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [balance, todayWins, roundNumber, jackpotPool, historyStrip, records]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      spinTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    spinTimeoutsRef.current.push(id);
    return id;
  }, []);

  // Gentle organic Jackpot pool tick simulating other room participants
  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(() => {
      setJackpotPool((prev) => prev + Math.floor(Math.random() * 18 + 3));
    }, 2400);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  const startNextRound = useCallback(() => {
    setShowResultModal(false);
    setWinningFruit(null);
    setBonusFruits([]);
    setBonusBadgeText(null);
    setRoundNumber((r) => r + 1);
    setCountdown(ROUND_DURATION_SECONDS);
    setPhase('BETTING');

    // Auto-bet repeats previous round's bet pattern if enabled and affordable
    if (autoBetRef.current) {
      const template = lastRoundBetsRef.current;
      const entries = Object.entries(template) as Array<[FruitId, number]>;
      const totalNeeded = entries.reduce((sum, [, amt]) => sum + (amt || 0), 0);
      if (totalNeeded > 0 && balanceRef.current >= totalNeeded) {
        setBalance((b) => b - totalNeeded);
        setBets({ ...template });
        setJackpotPool((jp) => jp + Math.max(50, Math.floor(totalNeeded * 0.03)));
        arcadeSound.playBetCoin();
      } else {
        setBets({});
        if (totalNeeded > 0 && balanceRef.current < totalNeeded) {
          setAutoBet(false);
          showToast('تم إيقاف التشغيل التلقائي لعدم كفاية الرصيد');
        }
      }
    } else {
      setBets({});
    }
  }, [showToast]);

  // Resolve spin outcome, Lucky Bonus / Jackpot 3-reel trigger, payouts, & result modal
  const finalizeRound = useCallback(
    (winnerId: FruitId) => {
      const currentBets = betsRef.current;
      const betEntries: BetEntry[] = FRUITS.map((f) => ({
        fruitId: f.id,
        amount: currentBets[f.id] ?? 0,
      })).filter((b) => b.amount > 0);

      const totalBet = betEntries.reduce((sum, b) => sum + b.amount, 0);
      if (totalBet > 0) {
        setLastRoundBets({ ...currentBets });
      }

      // Roll for Lucky Bonus / Jackpot event (triggers 3-reel JJ machine!)
      const roll = Math.random();
      let bonusType: BonusType = 'NONE';
      if (roll < 0.025 && totalBet >= 1000) {
        bonusType = 'JACKPOT';
      } else if (roll < 0.07) {
        bonusType = 'MULT_3';
      } else if (roll < 0.14) {
        bonusType = 'MULT_2';
      } else if (roll < 0.21) {
        bonusType = 'EXTRA_1';
      }

      const executePayout = (extraFruits: FruitId[], bonusMultiplier: number, jackpotHit: boolean, bonusLabel: string | null) => {
        const allWinningFruits: FruitId[] = [winnerId, ...extraFruits];
        let totalWin = 0;

        for (const fId of allWinningFruits) {
          const betOnFruit = currentBets[fId] ?? 0;
          if (betOnFruit > 0) {
            totalWin += betOnFruit * FRUIT_MAP[fId].multiplier * bonusMultiplier;
          }
        }

        let jackpotShare = 0;
        if (jackpotHit && totalWin > 0) {
          const pct = getJackpotPercent(totalBet);
          jackpotShare = Math.floor(jackpotPoolRef.current * pct);
          totalWin += jackpotShare;
          setJackpotPool((jp) => Math.max(1_500_000, jp - jackpotShare + 150_000));
        }

        setWinningFruit(winnerId);
        setBonusFruits(extraFruits);
        setBonusBadgeText(bonusLabel);

        if (totalWin > 0) {
          setBalance((b) => b + totalWin);
          setTodayWins((w) => w + totalWin);
          if (jackpotHit || bonusMultiplier > 1) {
            arcadeSound.playJackpotFanfare();
          } else {
            arcadeSound.playLanded(true);
          }
        } else {
          arcadeSound.playLanded(false);
        }

        // Update 8-icon history strip (newest on the left under NEW badge)
        setHistoryStrip((prev) => [winnerId, ...prev].slice(0, 8));

        // Append to Historical Records if user placed any bets this round
        const curRound = roundNumberRef.current;
        if (totalBet > 0) {
          const { dateStr, timeStr } = formatNowParts();
          const newRecord: RoundRecord = {
            roundNumber: curRound,
            dateStr,
            timeStr,
            bets: betEntries,
            winningFruit: winnerId,
            bonusFruits: extraFruits.length ? extraFruits : undefined,
            bonusLabel: bonusLabel ?? undefined,
            totalBet,
            totalWin,
          };
          setRecords((prev) => [newRecord, ...prev].slice(0, 40));
        }

        // Generate authentic room leaderboard rankings for this round
        const shuffledBots = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, 3);
        const mult = FRUIT_MAP[winnerId].multiplier;
        const rawRanks: Array<{ name: string; win: number; isMe?: boolean }> = shuffledBots.map(
          (name, idx) => ({
            name,
            win: [10000, 20000, 50000, 100000][Math.floor(Math.random() * 4)] * mult * (idx === 0 ? 1 : 1),
          }),
        );
        if (totalWin > 0) {
          rawRanks.push({ name: 'أنا (أنت)', win: totalWin, isMe: true });
        }
        rawRanks.sort((a, b) => b.win - a.win);
        const rankings: RoundRankPlayer[] = rawRanks.slice(0, 3).map((item, idx) => ({
          rank: idx + 1,
          name: item.name,
          win: item.win,
          isMe: item.isMe,
        }));

        setLastResultSummary({
          roundNumber: curRound,
          winningFruit: winnerId,
          bonusFruits: extraFruits,
          bonusLabel,
          roundWin: totalWin,
          roundBet: totalBet,
          rankings,
        });

        // Pause briefly on the glowing winning tile, then show Screenshot 2 Result Modal for 3s
        scheduleTimeout(() => {
          setPhase('RESULT');
          setResultCountdown(3);
          setShowResultModal(true);
        }, 1050);
      };

      if (bonusType !== 'NONE') {
        // Trigger the 3-reel JJ slot machine pull + spin!
        setLeverPulled(true);
        setReelsSpinning(true);
        arcadeSound.playJackpotFanfare();

        scheduleTimeout(() => {
          setLeverPulled(false);
        }, 380);

        scheduleTimeout(() => {
          setReelsSpinning(false);
          if (bonusType === 'EXTRA_1') {
            const otherFruits = FRUITS.map((f) => f.id).filter((id) => id !== winnerId);
            const extra = otherFruits[Math.floor(Math.random() * otherFruits.length)];
            executePayout([extra], 1, false, 'حظ سعيد: فاكهة +1');
          } else if (bonusType === 'MULT_2') {
            executePayout([], 2, false, 'مكافآت مضاعفة x2');
          } else if (bonusType === 'MULT_3') {
            executePayout([], 3, false, 'مكافآت كبرى x3');
          } else {
            executePayout([], 1, true, 'JACKPOT!');
          }
        }, 1250);
      } else {
        executePayout([], 1, false, null);
      }
    },
    [scheduleTimeout],
  );

  // Trigger the realistic clockwise accelerating & decelerating wheel spin
  const startSpinSequence = useCallback(() => {
    setPhase('SPINNING');
    setShowHistoryModal(false);
    setShowRulesModal(false);
    setShowResultModal(false);
    setWinningFruit(null);
    setBonusFruits([]);
    setBonusBadgeText(null);

    const targetFruitId = pickWeightedFruit();
    const targetRingIdx = FRUIT_MAP[targetFruitId].ringIndex;
    const startRingIdx = activeRingRef.current;

    // 3 full laps + exact offset to land on targetRingIdx
    const delta = (targetRingIdx - startRingIdx + 8) % 8;
    const totalSteps = 24 + delta;

    let elapsed = 0;
    for (let step = 1; step <= totalSteps; step++) {
      // Smooth arcade easing curve: quick ramp-up, fast cruise, dramatic slow deceleration at the end
      let delay: number;
      const remaining = totalSteps - step;
      if (step <= 3) {
        delay = 115 - step * 18;
      } else if (remaining > 9) {
        delay = 58;
      } else {
        // Dramatic last-9-steps deceleration
        const decelTable = [440, 355, 285, 225, 175, 140, 115, 95, 80, 68];
        delay = decelTable[remaining] ?? 68;
      }

      elapsed += delay;
      const nextRingIdx = (startRingIdx + step) % 8;
      const isFinalStep = step === totalSteps;

      scheduleTimeout(() => {
        setActiveRingIndex(nextRingIdx);
        arcadeSound.playSpinStep(step);
        if (isFinalStep) {
          finalizeRound(targetFruitId);
        }
      }, elapsed);
    }
  }, [finalizeRound, scheduleTimeout]);

  // Betting Countdown Timer (15 -> 00)
  useEffect(() => {
    if (phase !== 'BETTING' || isPaused) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          arcadeSound.playCountdownTick(true);
          window.setTimeout(() => startSpinSequence(), 120);
          return 0;
        }
        const next = prev - 1;
        if (next <= 3) {
          arcadeSound.playCountdownTick(false);
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, isPaused, startSpinSequence]);

  // Result Modal (3s) auto-close countdown
  useEffect(() => {
    if (phase !== 'RESULT' || !showResultModal || isPaused) return;

    const timer = window.setInterval(() => {
      setResultCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => startNextRound(), 80);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, showResultModal, isPaused, startNextRound]);

  // Handle betting on a fruit tile
  const handleBetFruit = useCallback(
    (fruitId: FruitId) => {
      if (phase !== 'BETTING' || isPaused) return;
      const chip = CHIPS[selectedChipIndex];
      if (balanceRef.current < chip.value) {
        showToast('الرصيد غير كافٍ — اضغط "أنا" للشحن المجاني');
        return;
      }

      setBalance((b) => b - chip.value);
      setBets((prev) => ({
        ...prev,
        [fruitId]: (prev[fruitId] ?? 0) + chip.value,
      }));
      setJackpotPool((jp) => jp + Math.max(25, Math.floor(chip.value * 0.025)));
      setActiveRingIndex(FRUIT_MAP[fruitId].ringIndex);
      setPulseFruit(fruitId);
      window.setTimeout(() => setPulseFruit((curr) => (curr === fruitId ? null : curr)), 420);
      arcadeSound.playBetCoin();
    },
    [phase, isPaused, selectedChipIndex, showToast],
  );

  const handleSelectChip = useCallback((idx: number) => {
    setSelectedChipIndex(idx);
    arcadeSound.playButtonClick();
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      arcadeSound.setMuted(next);
      if (!next) arcadeSound.playButtonClick();
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    arcadeSound.playButtonClick();
    setIsPaused((prev) => {
      const next = !prev;
      showToast(next ? 'تم إيقاف اللعبة مؤقتاً' : 'تم استئناف اللعبة');
      return next;
    });
  }, [showToast]);

  const handleToggleAuto = useCallback(() => {
    arcadeSound.playButtonClick();
    setAutoBet((prev) => {
      const next = !prev;
      if (next) {
        const hasCurrentOrLast =
          Object.values(betsRef.current).some((v) => (v ?? 0) > 0) ||
          Object.values(lastRoundBetsRef.current).some((v) => (v ?? 0) > 0);
        showToast(
          hasCurrentOrLast
            ? 'تم تفعيل الرهان التلقائي للجولات القادمة'
            : 'ضع رهانك أولاً وسيتم تكراره تلقائياً',
        );
      } else {
        showToast('تم إيقاف الرهان التلقائي');
      }
      return next;
    });
  }, [showToast]);

  const handleTopUp = useCallback(
    (amount: number) => {
      arcadeSound.playJackpotFanfare();
      setBalance((b) => b + amount);
      showToast(`تم شحن ${amount.toLocaleString('en-US')} عملة بنجاح`);
    },
    [showToast],
  );

  const isSpinning = phase === 'SPINNING';

  return (
    <div
      className="min-h-dvh w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 25%, #2a1252 0%, #120826 55%, #090414 100%)',
      }}
    >
      {/* Blurred ambient arcade hall backdrop matching Screenshot 1 */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30 bg-cover bg-center scale-105 blur-md"
        style={{ backgroundImage: 'url(/assets/sprites/ambient_bg.jpg)' }}
        aria-hidden="true"
      />

      {/* Main Portrait Arcade Machine Container (Exact 779:1280 proportions) */}
      <main className="relative z-10 w-full max-w-[448px] min-h-dvh sm:min-h-0 sm:my-3 flex flex-col justify-between px-1.5 sm:px-2 pt-1.5 pb-0">
        {/* ================= TOP BAR & JACKPOT CROWN ================= */}
        <header className="relative w-full pt-1">
          {/* Top-Left Controls: Power, Sound, and Round Number */}
          <div className="absolute left-1 top-1 z-30 flex flex-col items-start gap-2.5">
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={handleTogglePause}
                className={`w-[42px] h-[42px] rounded-[11px] flex items-center justify-center cursor-pointer transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  isPaused ? 'ring-2 ring-amber-400' : ''
                }`}
                style={{
                  background: 'linear-gradient(180deg, #1b2f4d 0%, #0d1b32 100%)',
                  border: '2px solid #5985b5',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(160,210,255,0.45)',
                }}
                aria-label={isPaused ? 'استئناف اللعبة' : 'إيقاف مؤقت'}
                title={isPaused ? 'استئناف اللعبة' : 'إيقاف مؤقت'}
              >
                <Power
                  className={`w-[22px] h-[22px] stroke-[2.5] ${
                    isPaused ? 'text-amber-300' : 'text-[#87c3f0]'
                  }`}
                />
              </button>

              {/* Live Round Counter matching "937 الجولة" in Screenshot 1 */}
              <div className="pt-0.5 text-[13px] sm:text-[14px] font-bold text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] whitespace-nowrap tabular-nums">
                {roundNumber} الجولة
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleMute}
              className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center cursor-pointer transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              style={{
                background: 'linear-gradient(180deg, #1b2f4d 0%, #0d1b32 100%)',
                border: '2px solid #5985b5',
                boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(160,210,255,0.45)',
              }}
              aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? (
                <VolumeX className="w-[22px] h-[22px] text-[#87c3f0] stroke-[2.5]" />
              ) : (
                <Volume2 className="w-[22px] h-[22px] text-[#87c3f0] stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Top-Right Control: Rules Lightbulb (opens Screenshot 4 modal) */}
          <div className="absolute right-1 top-1 z-30">
            <button
              type="button"
              onClick={() => {
                arcadeSound.playButtonClick();
                setShowHistoryModal(false);
                setShowRulesModal((v) => !v);
              }}
              className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center cursor-pointer transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              style={{
                background: 'linear-gradient(180deg, #1b2f4d 0%, #0d1b32 100%)',
                border: '2px solid #5985b5',
                boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(160,210,255,0.45)',
              }}
              aria-label="قواعد اللعبة"
              title="قواعد اللعبة"
            >
              <Lightbulb className="w-[22px] h-[22px] text-[#98d3ff] stroke-[2.3] fill-[#98d3ff]/25" />
            </button>
          </div>

          {/* Cropped JACKPOT Gold Crown + Live Pool + Animated 3-Reel JJ Slot Machine */}
          <JackpotHeader
            jackpotPool={jackpotPool}
            reelsSpinning={reelsSpinning}
            leverPulled={leverPulled}
            bonusBadgeText={bonusBadgeText}
          />
        </header>

        {/* ================= MAIN PURPLE ARCADE CABINET ================= */}
        <section
          className="relative -mt-[42px] pt-[50px] pb-3 px-[14px] sm:px-[18px] rounded-t-[26px] z-10 flex-1 flex flex-col justify-between"
          style={{
            background:
              'linear-gradient(180deg, #7f68c4 0%, #6349ad 16%, #50369c 55%, #402685 100%)',
            boxShadow:
              '0 -4px 18px rgba(140, 100, 255, 0.35), inset 0 2px 3px rgba(235, 224, 255, 0.55), inset 3px 0 6px rgba(255,255,255,0.18), inset -3px 0 6px rgba(20,5,60,0.45)',
          }}
        >
          {/* Perforated Metallic Speaker Vent Texture near Cabinet Top */}
          <div
            className="pointer-events-none absolute top-[18px] left-[22px] right-[22px] h-[22px] opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle, #2a145c 1.4px, transparent 1.6px)',
              backgroundSize: '8px 6px',
            }}
            aria-hidden="true"
          />

          {/* Left Chasing Marquee Neon Light Strip */}
          <div
            className="pointer-events-none absolute left-[2px] top-[56px] bottom-[88px] w-[10px] rounded-full flex flex-col items-center justify-between py-2.5"
            style={{
              background: 'linear-gradient(180deg, #5d2b8a 0%, #9b3cb8 50%, #5d2b8a 100%)',
              border: '1px solid rgba(255, 195, 255, 0.55)',
              boxShadow: '0 0 10px rgba(220, 80, 255, 0.65)',
            }}
            aria-hidden="true"
          >
            {Array.from({ length: SIDE_BULB_COUNT }).map((_, i) => (
              <span
                key={`l-${i}`}
                className={`w-[5px] h-[5px] rounded-full bg-[#fff5ff] ${
                  isSpinning
                    ? i % 2 === 0
                      ? 'animate-bulb-fast-a'
                      : 'animate-bulb-fast-b'
                    : i % 2 === 0
                    ? 'animate-bulb-a'
                    : 'animate-bulb-b'
                }`}
              />
            ))}
          </div>

          {/* Right Chasing Marquee Neon Light Strip */}
          <div
            className="pointer-events-none absolute right-[2px] top-[56px] bottom-[88px] w-[10px] rounded-full flex flex-col items-center justify-between py-2.5"
            style={{
              background: 'linear-gradient(180deg, #5d2b8a 0%, #9b3cb8 50%, #5d2b8a 100%)',
              border: '1px solid rgba(255, 195, 255, 0.55)',
              boxShadow: '0 0 10px rgba(220, 80, 255, 0.65)',
            }}
            aria-hidden="true"
          >
            {Array.from({ length: SIDE_BULB_COUNT }).map((_, i) => (
              <span
                key={`r-${i}`}
                className={`w-[5px] h-[5px] rounded-full bg-[#fff5ff] ${
                  isSpinning
                    ? i % 2 === 1
                      ? 'animate-bulb-fast-a'
                      : 'animate-bulb-fast-b'
                    : i % 2 === 1
                    ? 'animate-bulb-a'
                    : 'animate-bulb-b'
                }`}
              />
            ))}
          </div>

          {/* ================= INNER SILVER-LAVENDER SCREEN FRAME ================= */}
          <div
            className="relative w-full rounded-[20px] p-[6px] sm:p-[7px]"
            style={{
              background:
                'linear-gradient(180deg, #dcd5f7 0%, #a998df 48%, #c6b9f0 100%)',
              boxShadow:
                '0 4px 12px rgba(17, 5, 48, 0.55), inset 0 1px 2px rgba(255,255,255,0.85)',
            }}
          >
            {/* Dark Purple Recessed Screen Backplate */}
            <div
              className="relative w-full rounded-[15px] p-[8px] sm:p-[10px] flex flex-col gap-[8px]"
              style={{
                background: 'linear-gradient(180deg, #563e99 0%, #442d86 55%, #3b247b 100%)',
                boxShadow: 'inset 0 3px 10px rgba(18, 6, 48, 0.65)',
              }}
            >
              {/* Toast notification pill inside screen */}
              {toastMessage && (
                <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-[#1b0b3e]/95 border border-[#ffe459]/75 text-[12px] font-bold text-[#ffe97a] shadow-lg whitespace-nowrap">
                  {toastMessage}
                </div>
              )}

              {/* 3x3 FRUIT GRID + CENTER 7-SEGMENT TIMER */}
              <div className="grid grid-cols-3 gap-[7px] sm:gap-[8px]">
                {GRID_SLOTS.map((slot) => {
                  if (slot === 'CENTER') {
                    return (
                      <SevenSegmentDisplay
                        key="CENTER"
                        value={isSpinning ? null : countdown}
                        isSpinning={isSpinning}
                        isUrgent={phase === 'BETTING' && countdown <= 3}
                      />
                    );
                  }

                  const fruit = FRUIT_MAP[slot];
                  const isHighlighted = activeRingIndex === fruit.ringIndex;
                  const isWinner = winningFruit === fruit.id;
                  const isBonusWinner = bonusFruits.includes(fruit.id);

                  return (
                    <FruitTile
                      key={fruit.id}
                      fruit={fruit}
                      betAmount={bets[fruit.id] ?? 0}
                      isHighlighted={isHighlighted}
                      isWinner={isWinner}
                      isBonusWinner={isBonusWinner}
                      canBet={phase === 'BETTING' && !isPaused}
                      justBetPulse={pulseFruit === fruit.id}
                      onBet={handleBetFruit}
                    />
                  );
                })}
              </div>

              {/* RESULT HISTORY STRIP ("نتيجة" + 8 recent fruits + blue NEW tag) */}
              <div
                className="w-full rounded-[11px] px-2.5 py-1.5 flex items-center justify-between gap-1.5"
                style={{
                  background: 'linear-gradient(180deg, #4b3194 0%, #3a227c 100%)',
                  boxShadow: 'inset 0 2px 5px rgba(15, 5, 42, 0.65), 0 1px 0 rgba(255,255,255,0.16)',
                }}
              >
                <span className="text-[13px] sm:text-[14px] font-bold text-white/95 shrink-0 pl-0.5 pr-1">
                  نتيجة
                </span>

                <div className="flex-1 grid grid-cols-8 items-center gap-0.5">
                  {historyStrip.map((fruitId, idx) => {
                    const f = FRUIT_MAP[fruitId];
                    return (
                      <div
                        key={`${fruitId}-${idx}`}
                        className="relative flex flex-col items-center justify-center py-0.5"
                      >
                        <img
                          src={f.sprite}
                          alt={f.nameAr}
                          className="w-[24px] h-[24px] sm:w-[27px] sm:h-[27px] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)]"
                          draggable={false}
                          referrerPolicy="no-referrer"
                        />
                        {idx === 0 && (
                          <span
                            className="mt-[-3px] px-1.5 py-[0.5px] rounded-full text-[8px] font-black uppercase tracking-wider text-white leading-tight shadow"
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              background: 'linear-gradient(180deg, #5da7ff 0%, #2f69db 100%)',
                              border: '0.5px solid rgba(255,255,255,0.75)',
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OVERLAY MODALS (Exact placement over the inner screen matching Screenshots 2, 3, 4) */}
              {showResultModal && lastResultSummary && !showHistoryModal && !showRulesModal && (
                <RoundResultModal
                  roundNumber={lastResultSummary.roundNumber}
                  winningFruit={lastResultSummary.winningFruit}
                  bonusFruits={lastResultSummary.bonusFruits}
                  bonusLabel={lastResultSummary.bonusLabel}
                  roundWin={lastResultSummary.roundWin}
                  roundBet={lastResultSummary.roundBet}
                  countdown={resultCountdown}
                  rankings={lastResultSummary.rankings}
                  onClose={() => startNextRound()}
                />
              )}

              {showHistoryModal && (
                <HistoryModal
                  records={records}
                  balance={balance}
                  onTopUp={handleTopUp}
                  onClose={() => {
                    arcadeSound.playButtonClick();
                    setShowHistoryModal(false);
                  }}
                />
              )}

              {showRulesModal && (
                <RulesModal
                  onClose={() => {
                    arcadeSound.playButtonClick();
                    setShowRulesModal(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* ================= 4 CHIP SELECTOR PILLS + 4 3D ARCADE PUSH BUTTONS ================= */}
          <div className="mt-2.5 grid grid-cols-4 gap-2 px-0.5">
            {CHIPS.map((chip, idx) => {
              const isSelected = selectedChipIndex === idx;
              return (
                <div key={chip.id} className="flex flex-col items-center gap-2">
                  {/* Oval Bet Denomination Pill matching Screenshot 1 */}
                  <button
                    type="button"
                    onClick={() => handleSelectChip(idx)}
                    className="w-full h-[32px] sm:h-[34px] rounded-full flex items-center justify-center gap-1 px-1.5 cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    style={
                      isSelected
                        ? {
                            background:
                              'linear-gradient(180deg, #ff7048 0%, #e63922 58%, #b91c14 100%)',
                            border: '1.5px solid #ffd5c2',
                            boxShadow:
                              '0 0 12px rgba(255, 82, 46, 0.8), inset 0 1px 2px rgba(255,255,255,0.55)',
                          }
                        : {
                            background:
                              'linear-gradient(180deg, #5c46b5 0%, #3d2a8c 65%, #2b1a70 100%)',
                            border: '1.5px solid rgba(196, 184, 248, 0.72)',
                            boxShadow:
                              '0 2px 6px rgba(15, 5, 42, 0.55), inset 0 1px 1px rgba(255,255,255,0.3)',
                          }
                    }
                    aria-pressed={isSelected}
                    aria-label={`اختيار رهان ${chip.label}`}
                  >
                    <img
                      src={chip.sprite}
                      alt=""
                      className="w-[21px] h-[21px] sm:w-[23px] sm:h-[23px] object-contain shrink-0"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className="text-[13px] sm:text-[14px] font-extrabold text-white tracking-tight leading-none whitespace-nowrap"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {chip.label}
                    </span>
                  </button>

                  {/* Physical 3D Arcade Dome Push-Button underneath each chip */}
                  <button
                    type="button"
                    onClick={() => handleSelectChip(idx)}
                    className="group relative w-[68%] h-[25px] flex items-end justify-center cursor-pointer focus-visible:outline-none"
                    aria-label={`زر رهان ${chip.label}`}
                  >
                    {/* Metallic Chrome Base Socket */}
                    <span
                      className="absolute bottom-0 inset-x-0 h-[15px] rounded-[50%]"
                      style={{
                        background:
                          'linear-gradient(180deg, #e7e1f7 0%, #8f84b0 55%, #4d426c 100%)',
                        boxShadow: '0 3px 5px rgba(10, 3, 28, 0.7)',
                      }}
                    />
                    {/* 3D Glowing Dome Cap (Red when active, Sky-Blue when inactive) */}
                    <span
                      className={`relative w-[84%] h-[19px] rounded-[50%] transition-transform duration-100 ${
                        isSelected
                          ? 'translate-y-[-3px] group-active:translate-y-[0px]'
                          : 'translate-y-[-5px] group-active:translate-y-[-1px]'
                      }`}
                      style={
                        isSelected
                          ? {
                              background:
                                'radial-gradient(ellipse at 50% 25%, #ffab8a 0%, #ff4726 48%, #ba1c0e 100%)',
                              boxShadow:
                                '0 4px 0 #8a1208, 0 0 14px rgba(255, 80, 42, 0.85), inset 0 2px 3px rgba(255,255,255,0.6)',
                            }
                          : {
                              background:
                                'radial-gradient(ellipse at 50% 25%, #a8e4ff 0%, #2f9bff 48%, #1055c9 100%)',
                              boxShadow:
                                '0 4px 0 #0a368a, 0 2px 8px rgba(35, 130, 255, 0.45), inset 0 2px 3px rgba(255,255,255,0.65)',
                            }
                      }
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 3D ANGLED BOTTOM CONSOLE DECK (أنا / اليوم يفوز / تلقائي) ================= */}
        <footer
          className="relative -mx-1.5 sm:-mx-2 px-3 pt-2.5 pb-3.5 z-20"
          style={{
            background:
              'linear-gradient(180deg, #8b76c8 0%, #5e47a8 12%, #a292d4 16%, #745eb8 45%, #8973c9 100%)',
            boxShadow: '0 -3px 12px rgba(14, 5, 38, 0.65), inset 0 2px 2px rgba(255,255,255,0.55)',
          }}
        >
          <div className="grid grid-cols-[1.22fr_1.15fr_0.95fr] gap-2 items-stretch">
            {/* Button 1: أنا (Me — Balance + opens Historical Records Screenshot 3) */}
            <button
              type="button"
              onClick={() => {
                arcadeSound.playButtonClick();
                setShowRulesModal(false);
                setShowHistoryModal((v) => !v);
              }}
              className="relative h-[52px] rounded-full px-3 flex items-center justify-between cursor-pointer transition-transform active:scale-95 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                background:
                  'linear-gradient(180deg, #9887c7 0%, #6f5ca4 52%, #8c7abd 100%)',
                border: '2px solid #dcd5f5',
                boxShadow:
                  '0 4px 8px rgba(20, 8, 50, 0.55), inset 0 2px 3px rgba(255,255,255,0.45)',
              }}
              aria-label="السجلات التاريخية والرصيد"
            >
              <div className="flex flex-col items-center flex-1 leading-tight">
                <span className="text-[12px] font-bold text-white/95">أنا</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <img
                    src="/assets/sprites/coin_gold.png"
                    alt=""
                    className="w-[17px] h-[17px] object-contain shrink-0"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                  <span
                    className="text-[14px] font-extrabold text-[#ffbb40] tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {balance.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/90 shrink-0 -mr-1" />
            </button>

            {/* Button 2: اليوم يفوز (Today's Wins) */}
            <div
              className="h-[52px] rounded-full px-3 flex flex-col items-center justify-center leading-tight"
              style={{
                background:
                  'linear-gradient(180deg, #9887c7 0%, #6f5ca4 52%, #8c7abd 100%)',
                border: '2px solid #dcd5f5',
                boxShadow:
                  '0 4px 8px rgba(20, 8, 50, 0.55), inset 0 2px 3px rgba(255,255,255,0.45)',
              }}
            >
              <span className="text-[12px] font-bold text-white/95 whitespace-nowrap">
                اليوم يفوز
              </span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <img
                  src="/assets/sprites/coin_gold.png"
                  alt=""
                  className="w-[17px] h-[17px] object-contain shrink-0"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
                <span
                  className="text-[14px] font-extrabold text-[#ffbb40] tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {todayWins.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Button 3: تلقائي (Auto-Bet Toggle) */}
            <button
              type="button"
              onClick={handleToggleAuto}
              className="h-[52px] rounded-full px-2 flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={
                autoBet
                  ? {
                      background:
                        'linear-gradient(180deg, #ff8f4d 0%, #e04624 55%, #b82914 100%)',
                      border: '2px solid #ffe4b5',
                      boxShadow:
                        '0 0 14px rgba(255, 100, 45, 0.75), inset 0 2px 3px rgba(255,255,255,0.55)',
                    }
                  : {
                      background:
                        'linear-gradient(180deg, #9f8ece 0%, #7764ad 52%, #9280c4 100%)',
                      border: '2px solid #dcd5f5',
                      boxShadow:
                        '0 4px 8px rgba(20, 8, 50, 0.55), inset 0 2px 3px rgba(255,255,255,0.45)',
                    }
              }
              aria-pressed={autoBet}
            >
              <span className="text-[16px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] whitespace-nowrap">
                {autoBet ? 'تلقائي ✓' : 'تلقائي'}
              </span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
