package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.Invoice;
import com.example.monpremiersite.entities.InvoiceLine;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class InvoicePDFService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generateInvoicePDF(Invoice invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 60);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont  = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(0x1a, 0x56, 0xdb));
            Font headerFont = new Font(Font.HELVETICA, 11, Font.BOLD, Color.WHITE);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font boldFont   = new Font(Font.HELVETICA, 10, Font.BOLD,   Color.DARK_GRAY);
            Font smallFont  = new Font(Font.HELVETICA,  8, Font.NORMAL, Color.GRAY);
            Font totalFont  = new Font(Font.HELVETICA, 12, Font.BOLD,   new Color(0x1a, 0x56, 0xdb));

            // ── Header ────────────────────────────────────────────────────
            PdfPTable header = new PdfPTable(2);
            header.setWidthPercentage(100);
            header.setWidths(new float[]{1, 1});

            PdfPCell cabinetCell = new PdfPCell();
            cabinetCell.setBorder(Rectangle.NO_BORDER);
            cabinetCell.addElement(new Phrase("JurisHub", titleFont));
            cabinetCell.addElement(new Phrase("Cabinet d'Avocats", normalFont));
            cabinetCell.addElement(new Phrase("Tunis, Tunisie", smallFont));
            header.addCell(cabinetCell);

            PdfPCell invoiceInfoCell = new PdfPCell();
            invoiceInfoCell.setBorder(Rectangle.NO_BORDER);
            invoiceInfoCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            invoiceInfoCell.addElement(new Phrase("FACTURE", titleFont));
            invoiceInfoCell.addElement(new Phrase("N°: " + invoice.getInvoiceNumber(), boldFont));
            invoiceInfoCell.addElement(new Phrase("Date: " + fmt(invoice.getInvoiceDate()), normalFont));
            invoiceInfoCell.addElement(new Phrase("Échéance: " + fmt(invoice.getDueDate()), normalFont));
            invoiceInfoCell.addElement(new Phrase("Statut: " + invoice.getStatus().name(), boldFont));
            header.addCell(invoiceInfoCell);
            doc.add(header);
            doc.add(Chunk.NEWLINE);

            // ── Client & Case ─────────────────────────────────────────────
            String clientFullName = invoice.getClient() != null
                    ? (invoice.getClient().getNom() + " " + invoice.getClient().getPrenom()).trim() : "-";
            String clientEmail = invoice.getClient() != null ? invoice.getClient().getEmail() : null;
            String caseNumber  = invoice.getCaseEntity() != null ? invoice.getCaseEntity().getCase_number() : "-";

            PdfPTable clientTable = new PdfPTable(2);
            clientTable.setWidthPercentage(100);
            clientTable.setWidths(new float[]{1, 1});

            PdfPCell clientCell = new PdfPCell();
            clientCell.setBorder(Rectangle.BOX);
            clientCell.setPadding(8);
            clientCell.addElement(new Phrase("CLIENT", boldFont));
            clientCell.addElement(new Phrase(clientFullName, normalFont));
            if (clientEmail != null) clientCell.addElement(new Phrase(clientEmail, smallFont));
            clientTable.addCell(clientCell);

            PdfPCell caseCell = new PdfPCell();
            caseCell.setBorder(Rectangle.BOX);
            caseCell.setPadding(8);
            caseCell.addElement(new Phrase("DOSSIER", boldFont));
            caseCell.addElement(new Phrase(caseNumber, normalFont));
            clientTable.addCell(caseCell);
            doc.add(clientTable);
            doc.add(Chunk.NEWLINE);

            // ── Line Items Table ──────────────────────────────────────────
            PdfPTable linesTable = new PdfPTable(5);
            linesTable.setWidthPercentage(100);
            linesTable.setWidths(new float[]{3, 1.5f, 1, 1.2f, 1.2f});

            addHeaderCell(linesTable, "Description",       headerFont);
            addHeaderCell(linesTable, "Type",         headerFont);
            addHeaderCell(linesTable, "Heures",       headerFont);
            addHeaderCell(linesTable, "Tarif/H (DT)", headerFont);
            addHeaderCell(linesTable, "Sous-total (DT)",   headerFont);

            for (InvoiceLine line : invoice.getInvoiceLines()) {
                linesTable.addCell(cell(line.getDescription(), normalFont));
                linesTable.addCell(cell(line.getType() != null ? line.getType().name() : "-", normalFont));
                linesTable.addCell(cell(line.getQuantity() != null ? line.getQuantity().toPlainString() : "1", normalFont));
                linesTable.addCell(cell(line.getUnitPrice() != null ? line.getUnitPrice().toPlainString() : "0", normalFont));
                linesTable.addCell(cell(line.getLineTotal().toPlainString(), boldFont));
            }
            doc.add(linesTable);
            doc.add(Chunk.NEWLINE);

            // ── Totals ────────────────────────────────────────────────────
            PdfPTable totals = new PdfPTable(2);
            totals.setWidthPercentage(40);
            totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totals.setWidths(new float[]{1.5f, 1});

            String taxPct = invoice.getTaxRate() != null
                    ? invoice.getTaxRate().multiply(java.math.BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%" : "19%";
            addTotalRow(totals, "Sous-total HT:",   invoice.getSubtotal().toPlainString() + " DT", normalFont, boldFont);
            addTotalRow(totals, "TVA (" + taxPct + "):", invoice.getTaxAmount().toPlainString() + " DT", normalFont, boldFont);
            addTotalRow(totals, "TOTAL TTC:",        invoice.getTotal().toPlainString() + " DT", totalFont, totalFont);
            doc.add(totals);

            doc.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph("Merci de votre confiance. Tout paiement doit être effectué dans le délai indiqué.", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF de la facture", e);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private String fmt(LocalDate d) {
        return d != null ? d.format(DATE_FMT) : "-";
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new Color(0x1a, 0x56, 0xdb));
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private PdfPCell cell(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setPadding(5);
        return c;
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell lc = new PdfPCell(new Phrase(label, labelFont));
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPadding(4);
        table.addCell(lc);
        PdfPCell vc = new PdfPCell(new Phrase(value, valueFont));
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPadding(4);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(vc);
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell lc = new PdfPCell(new Phrase(label, labelFont));
        lc.setPadding(5);
        table.addCell(lc);
        PdfPCell vc = new PdfPCell(new Phrase(value, valueFont));
        vc.setPadding(5);
        table.addCell(vc);
    }
}
