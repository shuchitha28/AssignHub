export const SERVER_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace("/api", "") 
  : "http://localhost:5000";

export const getFileUrl = (path: string | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  
  // If it's a relative path from the server like /uploads/...
  return `${SERVER_URL}${path}`;
};

export const getPdfUrl = (path: string | undefined): string => {
  const url = getFileUrl(path);
  if (!url) return "";

  // For Cloudinary URLs: insert fl_inline flag after /upload/
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/fl_inline/");
  }

  return url;
};

export const openPDF = (pdfData: string | undefined) => {
  if (!pdfData) return;

  // If it's our Cloudinary bypassed PDF (.txt), we MUST fetch and convert it to a PDF blob
  if (pdfData.includes("cloudinary.com") && pdfData.endsWith(".txt")) {
    fetch(pdfData)
      .then(res => res.blob())
      .then(blob => {
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      })
      .catch(err => {
        console.error("Error opening PDF bypass:", err);
        window.open(getPdfUrl(pdfData), "_blank");
      });
    return;
  }

  // If it's a standard URL (Cloudinary image or local server), open directly
  if (!pdfData.startsWith("data:")) {
    window.open(getPdfUrl(pdfData), "_blank");
    return;
  }

  // Handle base64 robustly using fetch (prevents memory/stack issues with large files)
  fetch(pdfData)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    })
    .catch(err => {
      console.error("Error opening PDF:", err);
      window.open(getPdfUrl(pdfData), "_blank");
    });
};
