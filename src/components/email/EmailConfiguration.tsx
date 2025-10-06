import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Settings, 
  TestTube,
  AlertTriangle,
  UserPlus,
  Package,
  Receipt,
  Bell
} from 'lucide-react';
import { 
  testEmailConfiguration, 
  sendSystemNotificationEmail,
  getEmailTemplates,
  EmailTemplates 
} from '@/apis/emailApi';
import useToast from '@/hooks/use-toast';

const EmailConfiguration: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [templates, setTemplates] = useState<EmailTemplates | null>(null);
  const [systemNotification, setSystemNotification] = useState({
    title: '',
    message: '',
    recipients: '',
    actionUrl: ''
  });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await getEmailTemplates();
      setTemplates(response);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        text: "Please enter a test email address",
        type: "error",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      await testEmailConfiguration({ testEmail });
      setTestResult('success');
      toast({
        title: "Test Email Sent! ✅",
        text: `Test email sent to ${testEmail}`,
        type: "success",
      });
    } catch (error) {
      setTestResult('error');
      toast({
        title: "Test Failed! ❌",
        text: "Failed to send test email. Check email configuration.",
        type: "error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendSystemNotification = async () => {
    if (!systemNotification.title || !systemNotification.message || !systemNotification.recipients) {
      toast({
        title: "Missing Information",
        text: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    setIsSendingNotification(true);

    try {
      const recipients = systemNotification.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      await sendSystemNotificationEmail({
        title: systemNotification.title,
        message: systemNotification.message,
        recipients,
        actionUrl: systemNotification.actionUrl || undefined
      });

      toast({
        title: "Notification Sent! 📧",
        text: `System notification sent to ${recipients.length} recipients`,
        type: "success",
      });

      setSystemNotification({
        title: '',
        message: '',
        recipients: '',
        actionUrl: ''
      });
    } catch (error) {
      toast({
        title: "Send Failed! ❌",
        text: "Failed to send system notification",
        type: "error",
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  const templateIcons = {
    lowStockAlert: AlertTriangle,
    employeeCreated: UserPlus,
    restockRequest: Package,
    invoiceGenerated: Receipt,
    systemNotification: Bell
  };

  const templateNames = {
    lowStockAlert: 'Low Stock Alert',
    employeeCreated: 'Employee Created',
    restockRequest: 'Restock Request',
    invoiceGenerated: 'Invoice Generated',
    systemNotification: 'System Notification'
  };

  return (
    <div className="space-y-6">
      {/* Email Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="h-5 w-5 mr-2" />
            Email Configuration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="Enter email address to test configuration"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleTestEmail} 
              disabled={isTesting || !testEmail}
              className="flex items-center"
            >
              {isTesting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isTesting ? 'Sending...' : 'Send Test Email'}
            </Button>
            {testResult && (
              <div className="flex items-center">
                {testResult === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-1" />
                )}
                <span className={testResult === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {testResult === 'success' ? 'Email sent successfully' : 'Email failed to send'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Notification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Send System Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notificationTitle">Title *</Label>
              <Input
                id="notificationTitle"
                placeholder="Notification title"
                value={systemNotification.title}
                onChange={(e) => setSystemNotification(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificationRecipients">Recipients *</Label>
              <Input
                id="notificationRecipients"
                placeholder="email1@example.com, email2@example.com"
                value={systemNotification.recipients}
                onChange={(e) => setSystemNotification(prev => ({ ...prev, recipients: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notificationMessage">Message *</Label>
            <Textarea
              id="notificationMessage"
              placeholder="Enter notification message"
              rows={4}
              value={systemNotification.message}
              onChange={(e) => setSystemNotification(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notificationActionUrl">Action URL (Optional)</Label>
            <Input
              id="notificationActionUrl"
              placeholder="https://example.com/action"
              value={systemNotification.actionUrl}
              onChange={(e) => setSystemNotification(prev => ({ ...prev, actionUrl: e.target.value }))}
            />
          </div>
          <Button 
            onClick={handleSendSystemNotification} 
            disabled={isSendingNotification}
            className="w-full md:w-auto"
          >
            {isSendingNotification ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSendingNotification ? 'Sending...' : 'Send Notification'}
          </Button>
        </CardContent>
      </Card>

      {/* Email Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates ? (
            <div className="space-y-4">
              {Object.entries(templates).map(([key, template]) => {
                const Icon = templateIcons[key as keyof typeof templateIcons];
                const name = templateNames[key as keyof typeof templateNames];
                
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-2 text-blue-500" />
                        <h3 className="font-medium">{name}</h3>
                      </div>
                      <Badge variant="outline">Template</Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Subject:</Label>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Preview:</Label>
                        <div 
                          className="text-sm text-gray-600 max-h-20 overflow-y-auto border rounded p-2 bg-gray-50"
                          dangerouslySetInnerHTML={{ __html: template.html.substring(0, 200) + '...' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading email templates...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfiguration;
