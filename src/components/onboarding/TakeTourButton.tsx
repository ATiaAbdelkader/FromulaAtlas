'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { resetOnboarding } from '@/lib/onboarding-store';
import { OnboardingFlow } from './OnboardingFlow';

/**
 * Button that resets the onboarding state and re-mounts the OnboardingFlow
 * so the user can replay the tour anytime.
 */
export function TakeTourButton() {
  const [replayKey, setReplayKey] = useState(0);
  const [forceShow, setForceShow] = useState(false);

  const handleClick = () => {
    resetOnboarding();
    setForceShow(true);
    setReplayKey(k => k + 1);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        title="Replay the welcome tour"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tour</span>
      </Button>
      {forceShow && (
        <OnboardingFlow key={replayKey} />
      )}
    </>
  );
}
