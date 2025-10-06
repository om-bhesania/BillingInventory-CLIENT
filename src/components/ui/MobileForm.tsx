import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';

interface MobileFormProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const MobileForm: React.FC<MobileFormProps> = ({
  children,
  title,
  description,
  onSubmit,
  className,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  disabled = false
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className={cn('w-full max-w-full', className)}>
      <Card className="w-full">
        {(title || description) && (
          <CardHeader className="pb-4">
            {title && (
              <CardTitle className={cn(
                'text-lg font-semibold',
                isMobile && 'text-base'
              )}>
                {title}
              </CardTitle>
            )}
            {description && (
              <p className={cn(
                'text-sm text-muted-foreground',
                isMobile && 'text-xs'
              )}>
                {description}
              </p>
            )}
          </CardHeader>
        )}
        
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className={cn(
              'space-y-4',
              isMobile ? 'space-y-3' : 'space-y-4'
            )}>
              {children}
            </div>
            
            <div className={cn(
              'flex gap-3 pt-4',
              isMobile ? 'flex-col' : 'flex-row justify-end'
            )}>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className={cn(
                    isMobile && 'w-full'
                  )}
                  disabled={isLoading || disabled}
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                type="submit"
                className={cn(
                  isMobile && 'w-full'
                )}
                disabled={isLoading || disabled}
              >
                {isLoading ? 'Loading...' : submitLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileForm;
