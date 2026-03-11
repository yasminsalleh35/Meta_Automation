
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const SimpleCampaignInsightsLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Header Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded" />
                <div>
                  <Skeleton className="h-8 w-80 mb-2" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
          {[...Array(7)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <Skeleton className="w-4 h-4 rounded" />
                </div>
                <Skeleton className="h-4 w-20 mt-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Skeleton */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-4 w-40 mb-3" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
