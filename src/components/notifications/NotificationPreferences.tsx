import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  Mail, 
  Smartphone, 
  Monitor, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  MessageSquare, 
  Settings,
  Save,
  RefreshCw
} from 'lucide-react';
import { 
  NotificationService, 
  NotificationPreferences 
} from '@/services/notificationService';
import { cn } from '@/lib/utils';

interface NotificationPreferencesProps {
  className?: string;
  userId: string;
  onPreferencesUpdated?: (preferences: NotificationPreferences) => void;
}

export const NotificationPreferencesComponent: React.FC<NotificationPreferencesProps> = ({
  className,
  userId,
  onPreferencesUpdated
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const data = await NotificationService.getNotificationPreferences(userId);
      setPreferences(data);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    
    setIsSaving(true);
    try {
      await NotificationService.updateNotificationPreferences(userId, preferences);
      setHasChanges(false);
      onPreferencesUpdated?.(preferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPreferences = () => {
    loadPreferences();
    setHasChanges(false);
  };

  const handleEnableAll = () => {
    if (!preferences) return;
    
    const newPreferences = {
      ...preferences,
      email: true,
      push: true,
      inApp: true,
      restockRequests: true,
      paymentUpdates: true,
      stockAlerts: true,
      chatMessages: true,
      systemUpdates: true,
      marketing: true
    };
    
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleDisableAll = () => {
    if (!preferences) return;
    
    const newPreferences = {
      ...preferences,
      email: false,
      push: false,
      inApp: false,
      restockRequests: false,
      paymentUpdates: false,
      stockAlerts: false,
      chatMessages: false,
      systemUpdates: false,
      marketing: false
    };
    
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading preferences...</span>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="text-center py-8">
          <BellOff className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Unable to load notification preferences</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetPreferences}
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSavePreferences}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium">Quick Actions</h4>
            <p className="text-sm text-gray-600">Enable or disable all notifications at once</p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={handleEnableAll}>
              <Bell className="h-4 w-4 mr-2" />
              Enable All
            </Button>
            <Button size="sm" variant="outline" onClick={handleDisableAll}>
              <BellOff className="h-4 w-4 mr-2" />
              Disable All
            </Button>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Notification Channels
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="email" className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
              </div>
              <Checkbox
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) => handlePreferenceChange('email', !!checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="push" className="font-medium">Push Notifications</Label>
                  <p className="text-sm text-gray-600">Receive push notifications on your device</p>
                </div>
              </div>
              <Checkbox
                id="push"
                checked={preferences.push}
                onCheckedChange={(checked) => handlePreferenceChange('push', !!checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Monitor className="h-5 w-5 text-purple-600" />
                <div>
                  <Label htmlFor="inApp" className="font-medium">In-App Notifications</Label>
                  <p className="text-sm text-gray-600">Show notifications within the application</p>
                </div>
              </div>
              <Checkbox
                id="inApp"
                checked={preferences.inApp}
                onCheckedChange={(checked) => handlePreferenceChange('inApp', !!checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Notification Types
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="restockRequests" className="font-medium">Restock Requests</Label>
                  <p className="text-sm text-gray-600">Notifications about restock requests and approvals</p>
                </div>
              </div>
              <Checkbox
                id="restockRequests"
                checked={preferences.restockRequests}
                onCheckedChange={(checked) => handlePreferenceChange('restockRequests', !!checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="paymentUpdates" className="font-medium">Payment Updates</Label>
                  <p className="text-sm text-gray-600">Notifications about payment status and verification</p>
                </div>
              </div>
              <Checkbox
                id="paymentUpdates"
                checked={preferences.paymentUpdates}
                onCheckedChange={(checked) => handlePreferenceChange('paymentUpdates', !!checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <Label htmlFor="stockAlerts" className="font-medium">Stock Alerts</Label>
                  <p className="text-sm text-gray-600">Low stock and critical inventory alerts</p>
                </div>
              </div>
              <Checkbox
                id="stockAlerts"
                checked={preferences.stockAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('stockAlerts', !!checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <div>
                  <Label htmlFor="chatMessages" className="font-medium">Chat Messages</Label>
                  <p className="text-sm text-gray-600">Notifications about new chat messages</p>
                </div>
              </div>
              <Checkbox
                id="chatMessages"
                checked={preferences.chatMessages}
                onCheckedChange={(checked) => handlePreferenceChange('chatMessages', !!checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="systemUpdates" className="font-medium">System Updates</Label>
                  <p className="text-sm text-gray-600">System maintenance and update notifications</p>
                </div>
              </div>
              <Checkbox
                id="systemUpdates"
                checked={preferences.systemUpdates}
                onCheckedChange={(checked) => handlePreferenceChange('systemUpdates', !!checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-orange-600" />
                <div>
                  <Label htmlFor="marketing" className="font-medium">Marketing & Promotions</Label>
                  <p className="text-sm text-gray-600">Promotional offers and marketing communications</p>
                </div>
              </div>
              <Checkbox
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) => handlePreferenceChange('marketing', !!checked)}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current Settings Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Channels Enabled:</span>
              <p className="font-medium">
                {[preferences.email, preferences.push, preferences.inApp]
                  .filter(Boolean).length} of 3
              </p>
            </div>
            <div>
              <span className="text-blue-700">Types Enabled:</span>
              <p className="font-medium">
                {[preferences.restockRequests, preferences.paymentUpdates, 
                  preferences.stockAlerts, preferences.chatMessages, 
                  preferences.systemUpdates, preferences.marketing]
                  .filter(Boolean).length} of 6
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesComponent;
