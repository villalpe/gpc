import type { CellDef } from "jspdf-autotable";
import type { jsPDF } from "jspdf";
import type { Sheet } from "./sheet";

const BRAND: [number, number, number] = [193, 55, 74];
const MARGIN = 40;

type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

export async function downloadSheetPdf(sheet: Sheet): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(sheet.shipmentId, MARGIN, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(sheet.title, pageWidth - MARGIN * 2)[0] ?? "",
    MARGIN,
    48
  );

  let y = 84;
  const getLastY = () =>
    (doc as PdfWithAutoTable).lastAutoTable?.finalY ?? y;

  for (const section of sheet.sections) {
    for (const [index, group] of section.groups.entries()) {
      const head: CellDef[][] = [];

      if (index === 0) {
        head.push([
          {
            content: section.title,
            colSpan: 2,
            styles: {
              fillColor: BRAND,
              textColor: [255, 255, 255],
              fontSize: 11,
            },
          },
        ]);
      }

      if (group.heading) {
        head.push([
          {
            content: group.heading,
            colSpan: 2,
            styles: {
              fillColor: [241, 245, 249],
              textColor: [51, 65, 85],
            },
          },
        ]);
      }

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head,
        body: group.rows.map((row) => [row.label, row.value]),
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [226, 232, 240],
          lineWidth: 0.5,
          textColor: [15, 23, 42],
        },
        columnStyles: {
          0: {
            cellWidth: 170,
            fontStyle: "bold",
            textColor: [71, 85, 105],
          },
        },
      });

      y = getLastY() + 2;

      if (group.customsRows?.length) {
        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN },
          body: group.customsRows,
          theme: "plain",
          styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: [15, 23, 42],
            lineColor: [226, 232, 240],
          },
          columnStyles: {
            0: {
              cellWidth: 165,
              fontStyle: "bold",
              textColor: [71, 85, 105],
            },
            1: { cellWidth: 110 },
          },
          didParseCell(data) {
            if (data.section === "body" && data.row.index === 2) {
              data.cell.styles.lineWidth = {
                top: 0.5,
                bottom: 0.5,
              };
            }
          },
        });

        y = getLastY();
      }

      const isLastGroup = index === section.groups.length - 1;
      y += isLastGroup ? 16 : 8;
    }
  }

  const pageCount = doc.getNumberOfPages();
  const generatedAt = new Date().toLocaleString("es-MX");

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado: ${generatedAt}`, MARGIN, pageHeight - 20);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - MARGIN, pageHeight - 20, {
      align: "right",
    });
  }

  const safeShipmentId = sheet.shipmentId.replace(/[^\w-]/g, "");
  doc.save(`cargobase-${safeShipmentId}.pdf`);
}