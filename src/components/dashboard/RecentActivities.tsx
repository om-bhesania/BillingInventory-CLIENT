import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RecentActivity } from '@/apis/dashboardApi';
import {
  DollarSign,
  Package,
  TrendingUp,
  ClipboardList,
  User,
  Clock
} from 'lucide-react';

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'billing':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'restock':
        return <Package className="h-4 w-4 text-orange-600" />;
      case 'inventory':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'user':
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'billing':
        return 'bg-green-100 border-green-200';
      case 'restock':
        return 'bg-orange-100 border-orange-200';
      case 'inventory':
        return 'bg-blue-100 border-blue-200';
      case 'user':
        return 'bg-purple-100 border-purple-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return null;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activities to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`rounded-full p-2 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{activity.action}</p>
                  {activity.status && (
                    <Badge variant="outline" className="text-xs">
                      {activity.status}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activity.details}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(activity.timestamp)}
                  </span>
                  {activity.shopName && (
                    <span>Shop: {activity.shopName}</span>
                  )}
                  {activity.amount && (
                    <span className="font-medium text-green-600">
                      {formatAmount(activity.amount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
