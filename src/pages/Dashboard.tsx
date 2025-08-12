import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  BadgeDelta,
  Card,
  DeltaType,
  Flex,
  Grid,
  Metric,
  ProgressBar,
  Text,
} from "@tremor/react";
import {
  Calendar,
  ClipboardList,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

type KPIData = {
  title: string;
  metric: string;
  icon: React.ReactNode;
  delta: string;
  deltaType: DeltaType;
  progress: number;
};

const Dashboard = () => {
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get dashboard data
    setTimeout(() => {
      setKpiData([
        {
          title: "Total Revenue",
          metric: "₹ 12,699",
          icon: <DollarSign className="h-5 w-5" />,
          delta: "+18.1%",
          deltaType: "increase",
          progress: 85,
        },
        {
          title: "Total Shops",
          metric: "8",
          icon: <ShoppingCart className="h-5 w-5" />,
          delta: "+2",
          deltaType: "increase",
          progress: 70,
        },
        {
          title: "Total Inventory",
          metric: "512",
          icon: <Package className="h-5 w-5" />,
          delta: "-5.2%",
          deltaType: "decrease",
          progress: 55,
        },
        {
          title: "Total Employees",
          metric: "42",
          icon: <Users className="h-5 w-5" />,
          delta: "+12.5%",
          deltaType: "increase",
          progress: 65,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Function to handle quick actions
  const handleQuickAction = (action: string) => {
    toast({
      title: "Action triggered",
      text: `You clicked on ${action}`,
      type: "info",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Admin! Here's an overview of your ice cream business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleQuickAction("Generate Report")}>
            Generate Report
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : (
        <Grid numItemsLg={4} numItemsMd={2} numItemsSm={1} className="gap-6">
          {kpiData.map((item) => (
            <Card key={item.title}>
              <Flex alignItems="start">
                <div className="truncate">
                  <Text>{item.title}</Text>
                  <Metric className="truncate">{item.metric}</Metric>
                </div>
                <div className="rounded-md bg-gray-100 p-2 dark:bg-gray-800">
                  {item.icon}
                </div>
              </Flex>
              <Flex className="mt-4 space-x-2">
                <Text className="truncate">Target Completion</Text>
                <BadgeDelta deltaType={item.deltaType}>{item.delta}</BadgeDelta>
              </Flex>
              <ProgressBar value={item.progress} className="mt-2" />
            </Card>
          ))}
        </Grid>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5" /> Recent Activity
          </h2>

          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`rounded-full p-1.5 ${
                    i % 2 === 0 ? "bg-green-100" : "bg-blue-100"
                  }`}
                >
                  {i % 2 === 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardList className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {i % 2 === 0 ? "New inventory added" : "Invoice generated"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i % 2 === 0
                      ? "Added 24 units of Chocolate flavor"
                      : "Invoice #1084 created for Shop C"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i === 0
                      ? "10 minutes ago"
                      : i === 1
                      ? "2 hours ago"
                      : i === 2
                      ? "Yesterday"
                      : "2 days ago"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5" /> Low Stock Alerts
          </h2>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="rounded-full p-1.5 bg-red-100">
                  <Package className="h-4 w-4 text-red-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {i === 0
                        ? "Vanilla Flavor"
                        : i === 1
                        ? "Strawberry Flavor"
                        : "Chocolate Chips"}
                    </p>
                    <p className="text-xs font-medium text-red-600">
                      {i === 0
                        ? "Only 5 left"
                        : i === 1
                        ? "Only 8 left"
                        : "Only 3 left"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reorder point: {i === 0 ? "10" : i === 1 ? "15" : "10"}{" "}
                    units
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shop {i === 0 ? "A" : i === 1 ? "B" : "C"}
                  </p>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleQuickAction("View all low stock items")}
            >
              View all low stock items
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
