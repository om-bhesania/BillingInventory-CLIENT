import { getEmployee, deleteEmployee } from "@/apis/employeeapi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Table from "@/components/ui/material-table";
import { Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employeeColumns } from "./Columns";
import useToast from "@/hooks/use-toast";
import { useCustomAlert } from "@/components/ui/custom-alert";
// Mock employees data (fallback)
const mockEmployees = Array.from({ length: 10 }).map((_, i) => ({
  id: `EMP${1000 + i}`,
  name: `Employee ${i + 1}`,
  email: `employee${i + 1}@iceberg.com`,
  phone: `+91 ${9000000000 + i * 1111111}`,
  position: i % 3 === 0 ? "Manager" : i % 3 === 1 ? "Cashier" : "Chef",
  shop: `Shop ${String.fromCharCode(65 + (i % 5))}`,
  joinDate: new Date(2022, i % 12, (i % 28) + 1).toLocaleDateString(),
  status: i % 5 === 0 ? "On Leave" : "Active",
}));

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeData, setEmployeeData] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { showSuccess, showError } = useCustomAlert();

  const fetchEmployeeData = async () => {
    console.log("Fetching employee data...");
    setIsLoading(true);
    setError(null);

    try {
      const response: any = await getEmployee();
      console.log("Employee Data fetched:", response);
      console.log("Setting employeeData to:", response);
      setEmployeeData(response);
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError("Failed to load employee data. Using mock data instead.");
      setEmployeeData(mockEmployees);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  console.log("employeeData", employeeData);

  const filteredEmployees = employeeData.filter(
    (employee) =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.shop?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    console.log("Deleting employee with ID:", id);
    console.log("Current employeeData before deletion:", employeeData);
    try {
      const res: any = await deleteEmployee(id);
      console.log("Delete API response:", res);
      showSuccess(
        "Employee Deleted",
        `Employee ${res.message || "has been deleted successfully"}.`
      );
      fetchEmployeeData();
    } catch (error) {
      console.error("Error deleting employee:", error);
      showError("Error", "Failed to delete employee");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Employee Management
          </h1>
          <p className="text-muted-foreground">
            Manage your employees across all shops
          </p>
        </div>
        <Link to="/employees/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New Employee
          </Button>
        </Link>
      </div>

      <Separator className="my-6" />

      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchEmployeeData}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search employees..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto flex">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              Position
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2">
              Manager
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              Cashier
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              Chef
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              Status
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2">
              Active
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              On Leave
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6 rounded-md border">
        {!isLoading && (
          <Table
            columns={employeeColumns(handleDelete, fetchEmployeeData)}
            data={filteredEmployees}
          />
        )}
      </div>
    </>
  );
};

export default EmployeeList;
