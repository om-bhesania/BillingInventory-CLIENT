import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2, UserPlus, UserMinus, Database } from "lucide-react";
import { ManagerSelectionDialog } from "@/components/dialogs/ManagerSelectionDialog";
import { UnlinkManagerDialog } from "@/components/dialogs/UnlinkManagerDialog";
import DeleteAllDataDialog from "@/components/dialogs/DeleteAllDataDialog";
import { useState } from "react";
import { usePermissions } from "@/contexts/PermissionsContext";

// Create a function that returns the columns with a refresh callback
export const createShopColumns = (onRefresh: () => void) => [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Shop Name" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "contactNumber", header: "Contact" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "operatingHours", header: "Hours" },
  { accessorKey: "isActive", header: "Active" },
  { accessorKey: "_count.inventory", header: "Inventory" },
  { accessorKey: "_count.restockRequests", header: "Restocks" },
  {
    accessorKey: "manager",
    header: "Manager",
    Cell: ({ row }) => {
      const manager = row.original.manager;
      
      return (
        <div className="text-sm">
          <div className="font-medium">
            {manager ? manager.name : "No Manager"}
          </div>
          {manager?.email && (
            <div className="text-muted-foreground text-xs">
              {manager.email}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "Actions",
    header: "Actions",
    Cell: ({ row }) => {
      const id = row.original.id as string;
      const shopName = row.original.name as string;
      const manager = row.original.manager;
      const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
      const [showLinkDialog, setShowLinkDialog] = useState(false);
      const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
      const { hasPermission } = usePermissions();
      
      // Check if user has permission to manage shop managers (Admin only)
      const canManageManagers = hasPermission("Shop", "update");
      
      // Check if user has permission to delete all shop data (Admin only)
      const canDeleteAllData = hasPermission("Shop", "delete");
      
      const handleEdit = () => {
        window.dispatchEvent(new CustomEvent("shop:edit", { detail: { id } }));
      };
      const handleDelete = () => {
        window.dispatchEvent(
          new CustomEvent("shop:delete", { detail: { id } })
        );
      };
      const handleDeleteAll = () => {
        setShowDeleteAllDialog(true);
      };
      
      return (
        <>
          <div className="flex justify-end space-x-1">
            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <span className="sr-only">Edit</span>
              <PencilIcon />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <span className="sr-only">Delete</span>
              <Trash2 />
            </Button>
            {canManageManagers &&
              (manager ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUnlinkDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Unlink Manager"
                >
                  <span className="sr-only">Unlink Manager</span>
                  <UserMinus />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLinkDialog(true)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Assign Manager"
                >
                  <span className="sr-only">Assign Manager</span>
                  <UserPlus />
                </Button>
              ))}
            {canDeleteAllData && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete All Data"
              >
                <span className="sr-only">Delete All Data</span>
                <Database />
              </Button>
            )}
          </div>

          {/* Link Manager Dialog - Only show if user has permission */}
          {canManageManagers && (
            <ManagerSelectionDialog
              isOpen={showLinkDialog}
              onClose={() => setShowLinkDialog(false)}
              shopId={id}
              shopName={shopName}
              onSuccess={onRefresh}
            />
          )}

          {/* Unlink Manager Dialog - Only show if user has permission */}
          {canManageManagers && (
            <UnlinkManagerDialog
              isOpen={showUnlinkDialog}
              onClose={() => setShowUnlinkDialog(false)}
              shopId={id}
              shopName={shopName}
              managerName={manager?.name || ""}
              onSuccess={onRefresh}
            />
          )}

          {/* Delete All Data Dialog - Only show if user has permission */}
          {canDeleteAllData && (
            <DeleteAllDataDialog
              isOpen={showDeleteAllDialog}
              onClose={() => setShowDeleteAllDialog(false)}
              shopId={id}
              shopName={shopName}
              onSuccess={onRefresh}
            />
          )}
        </>
      );
    },
  },
];

// Export the old columns for backward compatibility (will use window.location.reload)
export const shopColumns: any = createShopColumns(() => window.location.reload());