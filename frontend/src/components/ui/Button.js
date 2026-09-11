"use client";

import React from "react";

export default function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyles = "btn-base";
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
  };

  return (
    <button className={`${baseStyles} ${variants[variant] || ""} ${className}`} {...props}>
      {children}
    </button>
  );
}
