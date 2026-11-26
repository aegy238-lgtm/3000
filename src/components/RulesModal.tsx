import React from 'react';
import { X } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div
      className="absolute inset-0 z-40 rounded-[18px] flex flex-col overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, rgba(44, 29, 92, 0.94) 0%, rgba(28, 17, 62, 0.96) 100%)',
        border: '2px solid rgba(188, 174, 240, 0.88)',
        boxShadow: '0 0 26px rgba(118, 86, 215, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-label="قواعد اللعبة"
    >
      {/* Lavender Header Bar matching Screenshot 4 */}
      <div
        className="relative flex items-center justify-center py-2.5 px-4 shrink-0"
        style={{
          background: 'linear-gradient(180deg, #9981d9 0%, #7d64c2 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.28)',
        }}
      >
        <h2 className="text-[18px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          قواعد اللعبة
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

      {/* Exact Arabic Rules Content from Screenshot 4 */}
      <div
        className="flex-1 overflow-y-auto arcade-scroll px-4 py-4 text-[13.5px] sm:text-[14.5px] leading-[1.85] text-white/95 font-medium space-y-4"
        dir="rtl"
      >
        <p>اختر المبلغ والفواكه للمراهنة عليها ؛</p>

        <div>
          <p>يرجى إكمال رهانك قبل انتهاء العد التنازلي</p>
          <p>وسيتم ظهور النتائج مباشرة بعد انتهاء العد التنازلي .</p>
        </div>

        <div>
          <p>اذا فزت في النتيجة ستحصل على هذه الجوائز ؛</p>
          <p>ستتاح لك الفرصة لتنشيط لعبة فاكهة هي لعبة حظ .</p>
          <p>قد تكون نتيجة لعبة فاكهة لعبة الحظ احدى المكافآت التالية :</p>
          <p>فاكهة 1+، فاكهة 2+، فاكهة 3+ ،</p>
          <p>أو مكافآت كبيرة، أو ربما لا توجد مكافأة، مكافآت x2 مكافآت x3</p>
        </div>

        <div>
          <p>مع مشاركة المزيد من المستخدمين في اللعبة، ستزداد مجموع الجوائز</p>
          <p>سيكون للفائز على امكانية الفوز بمكافأة &quot;JACKPOT&quot; !</p>
        </div>

        <div>
          <p>القواعد احتساب &quot;JACKPOT&quot; هي كما يلي :</p>
          <p>اذا كان مبلغ الرهان بين 1000 - 9999 ،</p>
          <p>فيمكن الفائز يحصل على 10% من مجموع الجوائز ؛</p>
          <p>اذا كان مبلغ الرهان بين 10,000 - 99,999 ،</p>
          <p>فيمكن للفائز الحصول على 25% من مجموع الجوائز ؛</p>
          <p>اذا كان مبلغ الرهان بين 100,000 - 999,999 ،</p>
          <p>فيمكن للفائز الحصول على 50% من مجموع الجوائز ؛</p>
          <p>اذا كان مبلغ الرهان 1,000,000 فأكثر ،</p>
          <p>فيمكن للفائز الحصول على 100% من مجموع الجوائز !</p>
        </div>
      </div>
    </div>
  );
};
