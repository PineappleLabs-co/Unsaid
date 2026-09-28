import React from 'react';
import { Wifi, Signal, Battery } from 'lucide-react';

export const StatusBar: React.FC = () => {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Signal size={14} />
        <Wifi size={14} />
        <Battery size={16} />
      </div>
    </div>
  );
};
