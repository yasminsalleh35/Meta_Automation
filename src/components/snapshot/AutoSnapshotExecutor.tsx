
import React, { useEffect } from 'react';
import { useSnapshotManager } from '@/hooks/useSnapshotManager';

interface AutoSnapshotExecutorProps {
  command: string;
  onComplete?: (result: any) => void;
}

export const AutoSnapshotExecutor: React.FC<AutoSnapshotExecutorProps> = ({ 
  command, 
  onComplete 
}) => {
  const { executeCommand } = useSnapshotManager();

  useEffect(() => {
    const runCommand = async () => {
      console.log('🎯 Auto-executing snapshot command:', command);
      const result = await executeCommand(command);
      
      if (onComplete) {
        onComplete(result);
      }
    };

    runCommand();
  }, [command, executeCommand, onComplete]);

  return null; // This component doesn't render anything visible
};
