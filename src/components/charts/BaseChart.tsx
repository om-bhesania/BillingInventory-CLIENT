import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BaseChartProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export const BaseChart: React.FC<BaseChartProps> = ({ 
  title, 
  children, 
  className = "",
  subtitle 
}) => {
  return (
    <Card className={`${className} h-auto`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">{children}</div>
      </CardContent>
    </Card>
  );
};
