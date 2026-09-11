"use client";

import React, { useRef } from "react";
import { UploadCloud } from "lucide-react";

function ScanUpload({ onFileSelect }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      className="scan-upload-area"
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="upload-icon-wrapper">
        <UploadCloud className="upload-icon" />
      </div>

      <h3>Drop repository ZIP here or browse files</h3>

      <p>Supports .zip, .tar.gz (Max 2GB)</p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.tar.gz"
        onChange={handleFileChange}
        hidden
      />
    </div>
  );
}

export default ScanUpload;