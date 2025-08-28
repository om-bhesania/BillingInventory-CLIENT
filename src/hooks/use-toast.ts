import Swal from "sweetalert2";

interface ToastProps {
  title: string;
  text: string;
  type: "success" | "error" | "warning" | "info" | "question";
}

import React from "react";

function useToast() {
  const toast = ({ title, text, type = "success" }: ToastProps) => {
    Swal.fire({
      title,
      text,
      icon: type,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,

      progressSteps: [
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
      ],
    });
  };

  return { toast };
}

export default useToast;
