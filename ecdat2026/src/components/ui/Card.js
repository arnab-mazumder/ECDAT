"use client";

import React from "react";

export default function Card({ children, className = "", ...props }) {
  return (
    <div className={`card-container ${className}`} {...props}>
      {children}
    </div>
  );
}
