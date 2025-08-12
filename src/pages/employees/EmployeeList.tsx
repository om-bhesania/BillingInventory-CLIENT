import { getEmployee } from "@/apis/employeeapi";
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
import Table from "@/components/ui/table";
import { Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employeeColumns } from "./Columns";

// Mock employees data
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

  const fetchEmployeeData = async () => {
    try {
      const response: any = await getEmployee();
      console.log("product Data", response);
      setEmployeeData(response);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  console.log("employeeData", employeeData);

  const filteredEmployees = employeeData.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.shop.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleDelete = (id: string) => {
    setEmployeeData(employeeData.filter((employee) => employee.id !== id));
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
        <Button asChild>
          <Link to="/employees/add">
            <Plus className="mr-2 h-4 w-4" /> Add New Employee
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />

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
        {/* <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${employee.id}`} alt={employee.name} />
                        <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <div className="text-sm">{employee.email}</div>
                    <div className="text-xs text-muted-foreground">{employee.phone}</div>
                  </TableCell>
                  <TableCell>{employee.shop}</TableCell>
                  <TableCell>{employee.joinDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.status === "Active" ? "secondary" : "outline"}
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/employees/edit/${employee.id}`}>
                          <span className="sr-only">Edit</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <span className="sr-only">Delete</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table> */}
        <Table columns={employeeColumns} data={filteredEmployees} />
      </div>
    </>
  );
};

export default EmployeeList;
