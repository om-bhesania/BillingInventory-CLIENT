import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'HOLIDAY' | 'SPECIAL_EVENT' | 'MAINTENANCE';
  description?: string;
  year: number;
  shopId?: string;
  shop?: {
    id: string;
    name: string;
  };
}

interface HolidayManagerProps {
  onHolidaySelect?: (holiday: Holiday | null) => void;
  selectedDate?: Date;
  className?: string;
}

const holidayTypes = [
  { value: 'HOLIDAY', label: 'Holiday', color: 'bg-red-100 text-red-800' },
  { value: 'SPECIAL_EVENT', label: 'Special Event', color: 'bg-blue-100 text-blue-800' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' }
];

export const HolidayManager: React.FC<HolidayManagerProps> = ({
  onHolidaySelect,
  selectedDate,
  className
}) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [shops, setShops] = useState<Array<{ id: string; name: string }>>([]);

  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'HOLIDAY' as const,
    description: '',
    shopId: ''
  });

  // Load holidays
  const loadHolidays = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        ...(selectedShop !== 'all' && { shopId: selectedShop })
      });

      const response = await fetch(`/api/holidays?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load holidays');
      }

      const data = await response.json();
      setHolidays(data.data || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast({
        type: 'error',
        title: 'Error',
        text: 'Failed to load holidays'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load shops
  const loadShops = async () => {
    try {
      const response = await fetch('/api/shops/get-all-shops', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load shops');
      }

      const data = await response.json();
      setShops(data.shops || []);
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  useEffect(() => {
    loadHolidays();
    loadShops();
  }, [selectedYear, selectedShop]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date) {
      toast({
        type: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields'
      });
      return;
    }

    try {
      const url = editingHoliday ? `/api/holidays/${editingHoliday.id}` : '/api/holidays';
      const method = editingHoliday ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...formData,
          shopId: formData.shopId || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save holiday');
      }

      const data = await response.json();
      
      toast({
        type: 'success',
        title: editingHoliday ? 'Holiday Updated' : 'Holiday Created',
        text: data.message
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        date: '',
        type: 'HOLIDAY',
        description: '',
        shopId: ''
      });
      setEditingHoliday(null);
      setIsDialogOpen(false);
      
      // Reload holidays
      loadHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast({
        type: 'error',
        title: 'Error',
        text: 'Failed to save holiday'
      });
    }
  };

  // Handle delete
  const handleDelete = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      const response = await fetch(`/api/holidays/${holidayId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete holiday');
      }

      toast({
        type: 'success',
        title: 'Holiday Deleted',
        text: 'Holiday has been deleted successfully'
      });

      loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        type: 'error',
        title: 'Error',
        text: 'Failed to delete holiday'
      });
    }
  };

  // Handle edit
  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: format(new Date(holiday.date), 'yyyy-MM-dd'),
      type: holiday.type,
      description: holiday.description || '',
      shopId: holiday.shopId || ''
    });
    setIsDialogOpen(true);
  };

  // Get holidays for a specific date
  const getHolidaysForDate = (date: Date) => {
    return holidays.filter(holiday => 
      isSameDay(new Date(holiday.date), date)
    );
  };

  // Get holiday type info
  const getHolidayTypeInfo = (type: string) => {
    return holidayTypes.find(t => t.value === type) || holidayTypes[0];
  };

  // Calendar day renderer
  const renderCalendarDay = (date: Date) => {
    const dayHolidays = getHolidaysForDate(date);
    
    return (
      <div className="relative">
        <span className={cn(
          "text-sm",
          dayHolidays.length > 0 && "font-semibold"
        )}>
          {date.getDate()}
        </span>
        {dayHolidays.length > 0 && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Holiday Manager</h3>
          <div className="flex items-center space-x-2">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {user?.role === 'Admin' && (
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingHoliday(null);
              setFormData({
                name: '',
                date: '',
                type: 'HOLIDAY',
                description: '',
                shopId: ''
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Holiday Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter holiday name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {holidayTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {user?.role === 'Admin' && (
                <div>
                  <Label htmlFor="shopId">Shop (Optional)</Label>
                  <Select value={formData.shopId} onValueChange={(value) => setFormData(prev => ({ ...prev, shopId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Shops</SelectItem>
                      {shops.map(shop => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingHoliday ? 'Update' : 'Create'} Holiday
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Holiday Calendar - {selectedYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                const dayHolidays = getHolidaysForDate(date);
                onHolidaySelect?.(dayHolidays[0] || null);
              }
            }}
            className="rounded-md border"
            components={{
              Day: renderCalendarDay
            }}
          />
        </CardContent>
      </Card>

      {/* Holidays List */}
      <Card>
        <CardHeader>
          <CardTitle>Holidays ({holidays.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No holidays found for {selectedYear}
            </div>
          ) : (
            <div className="space-y-2">
              {holidays.map(holiday => {
                const typeInfo = getHolidayTypeInfo(holiday.type);
                return (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{holiday.name}</span>
                      </div>
                      <Badge className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(holiday.date), 'MMM d, yyyy')}
                      </span>
                      {holiday.shop && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{holiday.shop.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(holiday)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(holiday.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
