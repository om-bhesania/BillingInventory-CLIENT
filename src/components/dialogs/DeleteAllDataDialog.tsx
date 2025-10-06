import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, AlertTriangle, Database } from "lucide-react";
import { deleteAllShopData } from "@/apis/shopapi";
import useToast from "@/hooks/use-toast";

interface DeleteAllDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  onSuccess: () => void;
}

const DeleteAllDataDialog: React.FC<DeleteAllDataDialogProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await deleteAllShopData(shopId);
      
      toast({
        title: "Success",
        text: `All data for ${shopName} has been deleted successfully`,
        type: "success",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting all shop data:", error);
      toast({
        title: "Error",
        text: error?.response?.data?.error || "Failed to delete all shop data",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete All Shop Data
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete <strong>ALL DATA</strong> related to{" "}
            <strong>{shopName}</strong>. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            {/* Warning Box */}
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800 mb-2">
                  ⚠️ This action will delete:
                </p>
                <ul className="space-y-1 text-red-700">
                  <li>• All inventory records for this shop</li>
                  <li>• All billing/invoice records for this shop</li>
                  <li>• All restock requests for this shop</li>
                  <li>• The shop itself</li>
                  <li>• Manager will be automatically unlinked</li>
                </ul>
              </div>
            </div>

            {/* What's Preserved */}
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Database className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-1">
                  ✅ Employee records will be preserved
                </p>
                <p className="text-green-700">
                  Shop managers and other employees will not be deleted from the system
                </p>
              </div>
            </div>

            {/* Confirmation Text */}
            <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-800">
                Type <strong>DELETE ALL DATA</strong> to confirm
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This action is irreversible and will remove all shop-related data
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAllDataDialog;
