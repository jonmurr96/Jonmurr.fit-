import React from 'react';
import { GamificationFeedback as FeedbackType } from '../../hooks/useGamification';
import { XPToast } from './XPToast';
import { LevelUpModal } from './LevelUpModal';
import { BadgeUnlockModal } from './BadgeUnlockModal';

interface GamificationFeedbackProps {
  feedback: FeedbackType;
  onDismiss: () => void;
}

export const GamificationFeedback: React.FC<GamificationFeedbackProps> = ({ feedback, onDismiss }) => {
  if (feedback.xpToast) {
    return (
      <XPToast
        amount={feedback.xpToast.amount}
        reason={feedback.xpToast.reason}
        onDismiss={onDismiss}
      />
    );
  }

  if (feedback.levelUp) {
    return (
      <LevelUpModal
        oldLevel={feedback.levelUp.oldLevel}
        newLevel={feedback.levelUp.newLevel}
        newRank={feedback.levelUp.newRank}
        perksUnlocked={feedback.levelUp.perksUnlocked}
        chest={feedback.levelUp.chest}
        onClose={onDismiss}
      />
    );
  }

  if (feedback.badgeUnlock) {
    return (
      <BadgeUnlockModal
        badges={feedback.badgeUnlock.badges}
        onClose={onDismiss}
      />
    );
  }

  return null;
};
