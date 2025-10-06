import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, AlertTriangle, XCircle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  type?: "success" | "warning" | "error" | "info";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
  info: "text-blue-600",
};

const bgColorMap = {
  success: "bg-green-50 border-green-200",
  warning: "bg-yellow-50 border-yellow-200",
  error: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
};

export const CustomAlert: React.FC<CustomAlertProps> = ({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = false,
  className,
}) => {
  const Icon = iconMap[type];
  const iconColor = colorMap[type];
  const bgColor = bgColorMap[type];

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("sm:max-w-md", className)}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", bgColor)}>
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-left text-gray-700">
          {description}
        </AlertDialogDescription>
        <AlertDialogFooter className="gap-2">
          {showCancel && (
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Convenience hooks for common alert types
export const useCustomAlert = () => {
  const [alertState, setAlertState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    type: "success" | "warning" | "error" | "info";
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
  }>({
    open: false,
    title: "",
    description: "",
    type: "info",
  });

  const showAlert = (props: Omit<typeof alertState, "open">) => {
    setAlertState({ ...props, open: true });
  };

  const showSuccess = (title: string, description: string, onConfirm?: () => void) => {
    showAlert({ title, description, type: "success", onConfirm });
  };

  const showWarning = (title: string, description: string, onConfirm?: () => void) => {
    showAlert({ title, description, type: "warning", onConfirm });
  };

  const showError = (title: string, description: string, onConfirm?: () => void) => {
    showAlert({ title, description, type: "error", onConfirm });
  };

  const showInfo = (title: string, description: string, onConfirm?: () => void) => {
    showAlert({ title, description, type: "info", onConfirm });
  };

  const showConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    showAlert({
      title,
      description,
      type: "warning",
      onConfirm,
      onCancel,
      showCancel: true,
      confirmText,
      cancelText,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, open: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      open={alertState.open}
      onOpenChange={hideAlert}
      title={alertState.title}
      description={alertState.description}
      type={alertState.type}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      onConfirm={alertState.onConfirm}
      onCancel={alertState.onCancel}
      showCancel={alertState.showCancel}
    />
  );

  return {
    showAlert,
    showSuccess,
    showWarning,
    showError,
    showInfo,
    showConfirm,
    hideAlert,
    AlertComponent,
  };
};
