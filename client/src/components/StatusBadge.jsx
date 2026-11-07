import React from "react";
import "./StatusBadge.css";

const STATUS_CONFIG = {
  open: {
    label: "OPEN • ยังรอเจ้าของ",
    className: "status-open",
  },
  closed: {
    label: "CLOSED • ปิดรับแล้ว",
    className: "status-closed",
  },
  pending: {
    label: "PENDING • กำลังดำเนินการ",
    className: "status-pending",
  },
};

export default function StatusBadge({status = "open"}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}