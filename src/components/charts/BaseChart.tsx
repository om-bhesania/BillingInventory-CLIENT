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
    <Card className={`${className} h-auto ${title}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent
        className={`${
          title !== "Category Distribution" || "Flavor Distribution"
            ? "h-[25rem]"
            : "h-[18rem]"
        } ${title}`}
      >
        <div className="w-full h-auto max-h-[18rem]">{children}</div>
      </CardContent>
    </Card>
  );
};
