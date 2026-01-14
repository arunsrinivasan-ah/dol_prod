import { Document, Page } from "react-pdf";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

const SecurePdfViewer = ({ src, isFullscreen, onClose }) => {
  const pdfUrl = `${src}#toolbar=0&navpanes=0&scrollbar=0`;

  document.addEventListener("mousedown", function (event) {
    if (event.button === 2) {
      event.preventDefault();
      onClose();
    } else if (event.button === 0) {
      event.preventDefault();
      onClose();
    }
  });

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: isFullscreen ? "100vh" : 500,
        backgroundColor: "black",
      }}
    >
      {/* PDF iframe */}
      <iframe
        src={pdfUrl}
        title="PDF Preview"
        width="100%"
        height="100%"
        allowFullScreen
        style={{ border: "none" }}
      />
    </Box>
  );
};

export default SecurePdfViewer;
