import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBadge({ isOnline }) {
  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <WifiOff size={16} />
      <span>You are currently offline. Viewing cached roster & staff data.</span>
    </div>
  );
}
