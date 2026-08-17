import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { AnalysisFeedback } from '../../types';

interface RealtimeFeedbackBadgeProps {
  feedback: AnalysisFeedback | null;
  isActive: boolean;
}

export const RealtimeFeedbackBadge: React.FC<RealtimeFeedbackBadgeProps> = ({
  feedback,
  isActive
}) => {
  if (!isActive || !feedback) {
    return (
      <div className="flex items-center space-x-2.5 rounded-2xl border border-white/[0.2] bg-black/80 px-4 py-2.5 backdrop-blur-md shadow-lg">
        <Sparkles className="h-4 w-4 text-[#eab308] animate-spin" />
        <span className="text-xs font-semibold text-white">
          Sẵn sàng bắt đầu: Đứng vào khung hình và bấm &quot;BẮT ĐẦU TẬP&quot;.
        </span>
      </div>
    );
  }

  const { text, status, guidanceTip, errorsDetected } = feedback;

  let bgStyle = 'border-[#0d9488]/50 bg-black/85 text-[#0d9488] shadow-[#0d9488]/20';
  let Icon = CheckCircle2;
  let iconColor = 'text-[#0d9488]';

  if (status === 'warning') {
    bgStyle = 'border-amber-500/50 bg-black/85 text-amber-400 shadow-amber-500/20';
    Icon = AlertTriangle;
    iconColor = 'text-amber-400';
  } else if (status === 'bad') {
    bgStyle = 'border-rose-500/50 bg-black/85 text-rose-400 shadow-rose-500/20';
    Icon = AlertCircle;
    iconColor = 'text-rose-400';
  }

  return (
    <div className="flex flex-col space-y-2 w-full max-w-xl animate-in fade-in duration-200">
      {/* Primary Real-time Feedback Banner */}
      <div
        className={`flex items-center space-x-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl transition-all ${bgStyle}`}
      >
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor} animate-pulse`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold tracking-wide text-white line-clamp-2">
            {text}
          </p>
        </div>
        {errorsDetected && errorsDetected.length > 0 && (
          <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
            {errorsDetected.length} LỖI
          </span>
        )}
      </div>

      {/* Guidance Tip Pill */}
      {guidanceTip && (
        <div className="flex items-center justify-between rounded-xl bg-black/80 border border-white/[0.15] px-4 py-2 text-xs text-slate-200 backdrop-blur-md">
          <span>{guidanceTip}</span>
          <span className="text-[#eab308] font-bold font-mono ml-2 flex-shrink-0 text-[11px]">
            AI COACH TIP
          </span>
        </div>
      )}
    </div>
  );
};
