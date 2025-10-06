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
import { Loader2, UserMinus, AlertTriangle } from "lucide-react";
import { unlinkShopManager } from "@/apis/shopapi";
import useToast from "@/hooks/use-toast";

interface UnlinkManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  managerName: string;
  onSuccess: () => void;
}

export const UnlinkManagerDialog: React.FC<UnlinkManagerDialogProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  managerName,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await unlinkShopManager(shopId);
      
      toast({
        title: "Success",
        text: "Manager unlinked successfully",
        type: "success",
        // Duration will be automatically set to 4 seconds for success type
        // Pause on hover is automatically enabled
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error unlinking manager:", error);
      toast({
        title: "Error",
        text: error?.response?.data?.error || "Failed to unlink manager",
        type: "error",
        // Duration will be automatically set to 8 seconds for error type
        // Pause on hover is automatically enabled
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Unlink Manager
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to unlink <strong>{managerName}</strong> from{" "}
            <strong>{shopName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <UserMinus className="h-5 w-5 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">
                Manager will lose access to this shop
              </p>
              <p className="text-amber-600">
                You can reassign a new manager later if needed
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlinking...
              </>
            ) : (
              <>
                <UserMinus className="mr-2 h-4 w-4" />
                Unlink Manager
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
