import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from "sweetalert2";
import React from "react";

// Extend ToastProps to include all SweetAlert2 options and allow function overrides
export interface ToastProps extends Omit<SweetAlertOptions, "icon" | "toast" | "position" | "timer" | "timerProgressBar"> {
  title?: string;
  text?: string;
  type?: SweetAlertIcon;
  duration?: number;
  // Allow overriding any SweetAlert2 option
  [key: string]: any;
}

function useToast() {
  /**
   * Show a toast using SweetAlert2, exposing all available options and functions.
   * @param props ToastProps - All SweetAlert2 options, plus type/duration shortcuts.
   * @returns Promise<SweetAlertResult>
   */
  const toast = (props: ToastProps): Promise<SweetAlertResult<any>> => {
    const {
      title = "",
      text = "",
      type = "success",
      duration,
      // Extract known props, pass the rest to SweetAlert2
      ...rest
    } = props;

    // Set default durations based on toast type
    const getDefaultDuration = () => {
      if (duration !== undefined) return duration;
      switch (type) {
        case "error":
          return 8000; // 8 seconds for errors
        case "warning":
          return 6000; // 6 seconds for warnings
        case "success":
          return 4000; // 4 seconds for success
        case "info":
          return 5000; // 5 seconds for info
        default:
          return 4000;
      }
    };

    // Compose the options object, allowing full override
    const options = {
      title,
      text,
      icon: type,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: getDefaultDuration(),
      timerProgressBar: true,
      didOpen: (toast: any) => {
        // Add pause on hover functionality
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
      ...rest, // Allow user to override any option
    } as SweetAlertOptions;

    return Swal.fire(options);
  };

  // Expose all SweetAlert2 static methods for advanced usage
  return {
    toast,
    fire: Swal.fire,
    update: Swal.update,
    close: Swal.close,
    isVisible: Swal.isVisible,
    getTimerLeft: Swal.getTimerLeft,
    stopTimer: Swal.stopTimer,
    resumeTimer: Swal.resumeTimer,
    toggleTimer: Swal.toggleTimer,
    clickConfirm: Swal.clickConfirm,
    clickDeny: Swal.clickDeny,
    clickCancel: Swal.clickCancel,
    showLoading: Swal.showLoading,
    hideLoading: Swal.hideLoading,
    isLoading: Swal.isLoading,
    getTitle: Swal.getTitle,
    getHtmlContainer: Swal.getHtmlContainer,
    getImage: Swal.getImage,
    getIcon: Swal.getIcon,
    getActions: Swal.getActions,
    getConfirmButton: Swal.getConfirmButton,
    getDenyButton: Swal.getDenyButton,
    getCancelButton: Swal.getCancelButton,
    getFooter: Swal.getFooter,
    getTimerProgressBar: Swal.getTimerProgressBar,
  };
}

export { useToast };
export default useToast;
