import toast from "react-hot-toast";

const baseOptions = {
  duration: 3200,
  position: "top-right",
  style: {
    background: "linear-gradient(135deg, #171923 0%, #2f1822 100%)",
    border: "1px solid rgba(232, 89, 122, 0.38)",
    borderRadius: "14px",
    boxShadow: "0 18px 48px rgba(17, 24, 39, 0.28)",
    color: "#fff7fa",
    fontWeight: 700,
    padding: "14px 16px"
  }
};

export function showAlert(message, type = "info") {
  const iconByType = {
    error: "!",
    success: "✓",
    warning: "!",
    info: "i"
  };

  return toast(message, {
    ...baseOptions,
    icon: iconByType[type] || iconByType.info
  });
}

export function showErrorAlert(message) {
  return showAlert(message, "error");
}

export function showSuccessAlert(message) {
  return showAlert(message, "success");
}
