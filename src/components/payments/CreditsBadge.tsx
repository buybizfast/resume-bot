'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';

export default function CreditsBadge() {
  const { user } = useAuth();
  const { credits, isLoading, totalAvailable, hasFreeFix } = useUserCredits();

  if (!user || isLoading || !credits) return null;

  let bgColor: string;
  let textColor: string;
  let label: string;

  if (hasFreeFix) {
    bgColor = 'bg-[var(--accent-light)]';
    textColor = 'text-[var(--accent)]';
    label = '1 free fix';
  } else if (totalAvailable > 0) {
    bgColor = totalAvailable <= 2 ? 'bg-[var(--gold-light)]' : 'bg-[var(--accent-light)]';
    textColor = totalAvailable <= 2 ? 'text-[var(--gold)]' : 'text-[var(--accent)]';
    label = `${totalAvailable} fix${totalAvailable === 1 ? '' : 'es'}`;
  } else {
    bgColor = 'bg-[var(--danger-light)]';
    textColor = 'text-[var(--danger)]';
    label = '0 fixes';
  }

  return (
    <div className={`flex items-center gap-1 rounded-full ${bgColor} px-2.5 py-1`}>
      <svg className={`h-3 w-3 ${textColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      <span className={`text-[10px] font-bold ${textColor}`}>
        {label}
      </span>
    </div>
  );
}
