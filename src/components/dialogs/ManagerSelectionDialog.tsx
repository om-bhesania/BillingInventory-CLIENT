import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { getEmployee } from "@/apis/employeeapi";
import { linkShopManager } from "@/apis/shopapi";
import useToast from "@/hooks/use-toast";

interface ManagerSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  contact: string;
  shopName: string;
  shopId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ManagerSelectionDialog: React.FC<ManagerSelectionDialogProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  console.log("===============>", selectedEmployeeId);
  // Fetch employees when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response: any = await getEmployee();
      console.log(
        "ManagerSelectionDialog - Employee response =====>",
        response
      );

      // Handle the response structure - it might be direct array or wrapped in data
      const employeesData = Array.isArray(response)
        ? response
        : response.data || response;
      console.log(
        "ManagerSelectionDialog - employeesData =====>",
        employeesData
      );

      // Filter to show only Shop_Owner employees (they are more suitable for shop management)
      // You can remove this filter if you want to show all employees
      const filteredEmployees =
        employeesData?.filter((emp: Employee) => emp.role === "Shop_Owner") ||
        [];
      console.log(
        "ManagerSelectionDialog - filteredEmployees =====>",
        filteredEmployees
      );

      setEmployees(filteredEmployees);
    } catch (error) {
      console.error(
        "ManagerSelectionDialog - Error fetching employees:",
        error
      );
      toast({
        title: "Error",
        text: "Failed to load employees",
        type: "error",
        // Duration will be automatically set to 8 seconds for error type
        // Pause on hover is automatically enabled
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Selection Required",
        text: "Please select a shop owner to assign as manager",
        type: "warning",
        // Duration will be automatically set to 6 seconds for warning type
        // Pause on hover is automatically enabled
      });
      return;
    }

    try {
      setSubmitting(true);
      await linkShopManager(
        shopId,
        selectedEmployeeId.indexOf("no-employees") === 0
          ? ""
          : selectedEmployeeId
      );

      toast({
        title: "Success",
        text: "Manager assigned successfully",
        type: "success",
        // Duration will be automatically set to 4 seconds for success type
        // Pause on hover is automatically enabled
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error linking manager:", error);
      toast({
        title: "Error",
        text: error?.response?.data?.error || "Failed to assign manager",
        type: "error",
        // Duration will be automatically set to 8 seconds for error type
        // Pause on hover is automatically enabled
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Assign Manager
          </DialogTitle>
          <DialogDescription>
            Select a shop owner to assign as manager for{" "}
            <strong>{shopName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading employees...
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Shop Owner</label>

              {/* Debug information */}
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <strong>Debug Info:</strong>
                <br />
                selectedEmployeeId: "{selectedEmployeeId}"
                <br />
                employees.length: {employees.length}
                <br />
                Button disabled:{" "}
                {!selectedEmployeeId || submitting || loading
                  ? "true"
                  : "false"}
                <br />
                Available employees:{" "}
                {employees.map((emp) => emp.name).join(", ")}
                <br />
                <br />
                <strong>Test Buttons:</strong>
                <br />
                <button
                  onClick={() => {
                    const firstEmployee = employees[0];
                    if (firstEmployee) {
                      console.log(
                        "Manual test - setting selectedEmployeeId to:",
                        firstEmployee.id
                      );
                      setSelectedEmployeeId(firstEmployee.id);
                    }
                  }}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded mr-2"
                >
                  Set First Employee
                </button>
                <button
                  onClick={() => {
                    console.log("Manual test - clearing selectedEmployeeId");
                    setSelectedEmployeeId("");
                  }}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                >
                  Clear Selection
                </button>
              </div>
              <div className="space-y-2">
                <Select
                  value={selectedEmployeeId}
                  onValueChange={(value) => {
                    console.log(
                      "ManagerSelectionDialog - Select onValueChange called with value:",
                      value
                    );
                    console.log(
                      "ManagerSelectionDialog - Available employees:",
                      employees.map((emp) => ({
                        name: emp.name,
                        id: emp.id,
                      }))
                    ); 
                    setSelectedEmployeeId(value || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shop owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <SelectItem value="no-employees" disabled>
                        No shop owners available
                      </SelectItem>
                    ) : (
                        employees.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id}
                          >
                          <div className="flex flex-col">
                            <span className="font-medium">{employee.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {employee.email} • {employee.role}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Alternative simple select for testing */}
                <div className="mt-2 p-2 bg-gray-50 border rounded">
                  <label className="text-xs font-medium">
                    Alternative Test Select:
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => {
                      console.log(
                        "Alternative select onChange called with value:",
                        e.target.value
                      );
                      setSelectedEmployeeId(e.target.value);
                    }}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="">Choose a shop owner...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEmployeeId || submitting || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Manager
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
