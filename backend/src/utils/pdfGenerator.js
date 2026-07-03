const PDFDocument = require("pdfkit");

const generatePDF = (title, data, res) => {
  // 1. Initialize a clean standard Letter document with uniform 50pt padding margins
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });

  // 2. Set browser content pipeline headers for direct attachment downloads
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${title}.pdf`);

  doc.pipe(res);

  // 3. DRAW PDF BANNER HEADER
  const humanReadableTitle = title.replace(/_/g, " ").toUpperCase();
  doc.fillColor("#1f2937").fontSize(22).text(humanReadableTitle, { align: "center" });
  doc.fontSize(10).fillColor("#6b7280").text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(2);

  // Draw a crisp horizontal divider rule line across the header base frame
  doc.moveTo(50, 95).lineTo(562, 95).strokeColor("#e5e7eb").lineWidth(1).stroke();
  doc.moveDown(1);

  // 4. PROCESS ROW RECORD ITEMS ITERATION
  data.forEach((item, index) => {
    // Safety break check to add a clean new page block if we approach the page baseline boundary
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fillColor("#2563eb").fontSize(13).text(`RECORD ITEM #${index + 1}`, { underline: true });
    doc.moveDown(0.5);

    // Flatten Mongoose documents into clean, human-readable text properties
    const itemObject = typeof item.toObject === "function" ? item.toObject() : item;

    // Safely extract properties while skipping heavy tracking objects
    for (const [key, value] of Object.entries(itemObject)) {
      if (key === "_id" || key === "__v" || key === "updatedAt" || value === null || value === undefined) {
        continue;
      }

      doc.fillColor("#1f2937").fontSize(10);

      // Handle custom populated member sub-objects safely
      if (key === "memberId" && value && typeof value === "object") {
        const memberName = `${value.firstName || ""} ${value.surname || ""}`.trim();
        doc.text(`Member Profile: ${memberName || "Unknown Member"} (${value.email || "No Email"})`);
      } 
      // Handle array data fields (like multi-project splits)
      else if (Array.isArray(value)) {
        doc.text(`${key}: [List of ${value.length} items logged]`);
      } 
      // Handle standard nested sub-objects safely
      else if (typeof value === "object" && !(value instanceof Date)) {
        doc.text(`${key}: See sub-module records`);
      } 
      // Handle standard date values
      else if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)) && value.length > 15)) {
        doc.text(`${key}: ${new Date(value).toLocaleDateString()}`);
      }
      // Draw everything else as clean string lines
      else {
        doc.text(`${key}: ${value.toString()}`);
      }
    }

    doc.moveDown(1.5);
    
    // 5. FIXED LAYER: Applied correct pdfkit API syntax for dashed line separations
    const currentY = doc.y;
    doc.moveTo(50, currentY)
       .lineTo(562, currentY)
       .strokeColor("#f3f4f6")
       .dash(3, { space: 3 }) // Replaced non-existent .setLineDash() call
       .stroke()
       .undash(); // Safely clear dash rules to keep header lines solid on next pages
       
    doc.moveDown(1);
  });

  // 6. TERMINATE FILE PIPELINE
  doc.end();
};

module.exports = generatePDF;
