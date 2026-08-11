'use client';

import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/language-store';

export function ApiDocsButton() {
  const router = useRouter();
  const { isRTL } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push('/api-docs')}
      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      title={isRTL ? 'توثيق API — ادمج أطلس المعادلات مع تطبيقاتك' : 'API documentation — integrate Formula Atlas with your apps'}
    >
      <Code className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">API</span>
    </Button>
  );
}
