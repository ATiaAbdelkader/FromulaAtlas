'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/language-store';

/**
 * Header button that links to the Telegram setup page.
 */
export function TelegramConnectButton() {
  const router = useRouter();
  const { isRTL } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push('/telegram-setup')}
      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      title={isRTL ? 'اربط أطلس المعادلات بـ Telegram — احصل على نصائح زراعية بالذكاء على هاتفك' : 'Connect Formula Atlas to Telegram — get AI agronomy advice on your phone'}
    >
      <Send className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Telegram</span>
    </Button>
  );
}
