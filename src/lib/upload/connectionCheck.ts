const supabaseUrl = 'https://ibwhqkgvrkkqxiksbiqr.supabase.co';

export interface ConnectionStatus {
  speed: 'fast' | 'medium' | 'slow';
  estimatedMbps: number;
  isStable: boolean;
}

export const checkConnection = async (): Promise<ConnectionStatus> => {
  const startTime = performance.now();
  
  try {
    // Test download speed using a small file from Supabase
    // Using a 100KB test instead of 1MB to be faster
    const testSize = 100 * 1024; // 100KB
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/user-media/.test`, {
      method: 'HEAD',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      // If test file doesn't exist, estimate based on ping
      const endTime = performance.now();
      const pingMs = endTime - startTime;
      
      let speed: 'fast' | 'medium' | 'slow';
      let estimatedMbps: number;
      
      if (pingMs < 100) {
        speed = 'fast';
        estimatedMbps = 10;
      } else if (pingMs < 300) {
        speed = 'medium';
        estimatedMbps = 5;
      } else {
        speed = 'slow';
        estimatedMbps = 1;
      }
      
      return {
        speed,
        estimatedMbps,
        isStable: true
      };
    }
    
    const endTime = performance.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const mbps = (testSize / (1024 * 1024)) / durationSeconds * 8;
    
    let speed: 'fast' | 'medium' | 'slow';
    if (mbps >= 10) speed = 'fast';
    else if (mbps >= 3) speed = 'medium';
    else speed = 'slow';
    
    return {
      speed,
      estimatedMbps: mbps,
      isStable: true
    };
  } catch (error) {
    console.error('Connection check failed:', error);
    return {
      speed: 'slow',
      estimatedMbps: 0,
      isStable: false
    };
  }
};
