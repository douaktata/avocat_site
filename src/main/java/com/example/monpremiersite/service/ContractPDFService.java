                                                                                                                    package com.example.monpremiersite.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

@Service
public class ContractPDFService {

    private static final Color NAVY       = new Color(26,  42,  74);
    private static final Color DARK_GRAY  = new Color(80,  80,  80);
    private static final Color MID_GRAY   = new Color(130, 130, 130);
    private static final Color LIGHT_GRAY = new Color(210, 210, 210);
    private static final Color WARN_COLOR = new Color(160, 70,  0);

    // Patterns for content analysis
    private static final Pattern ARTICLE_PAT =
            Pattern.compile("(?i)^(ARTICLE|ART\\.?)\\s+\\S.*");
    private static final Pattern ROMAN_PAT =
            Pattern.compile("^(I{1,3}|IV|VI{0,3}|IX|X{1,3}|XI{0,3}|XIV|XV)[.\\-\\s].+");
    private static final Pattern NUMBERED_PAT =
            Pattern.compile("^\\d+[.)\\-]\\s+\\p{Lu}.+");
    private static final Pattern ALLCAPS_PAT =
            Pattern.compile(".*[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ]{4,}.*");

    public byte[] generatePDF(String label, String typeContrat, String content) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        // A4 with generous legal margins (points: 1pt ≈ 0.35mm)
        Document doc = new Document(PageSize.A4, 70f, 70f, 95f, 80f);
        PdfWriter writer = PdfWriter.getInstance(doc, baos);
        writer.setPageEvent(new ContractPageEvent(label));
        doc.open();

        addCoverBlock(doc, label);
        processContent(doc, content);

        doc.close();
        return baos.toByteArray();
    }

    // ── Cover block ──────────────────────────────────────────────────────────

    private void addCoverBlock(Document doc, String label) throws DocumentException {
        Font titleFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 15, NAVY);
        Font dateFont  = FontFactory.getFont(FontFactory.HELVETICA, 9, MID_GRAY);

        Paragraph title = new Paragraph(label.toUpperCase(), titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingBefore(6f);
        title.setSpacingAfter(6f);
        doc.add(title);

        String dateStr = "Généré le " +
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                "  •  JurisHub Cabinet d'Avocats";
        Paragraph datePara = new Paragraph(dateStr, dateFont);
        datePara.setAlignment(Element.ALIGN_CENTER);
        datePara.setSpacingAfter(14f);
        doc.add(datePara);

        LineSeparator sep = new LineSeparator(1.5f, 100f, NAVY, Element.ALIGN_CENTER, -2f);
        doc.add(new Chunk(sep));
        doc.add(new Paragraph(" "));
    }

    // ── Content processor ────────────────────────────────────────────────────

    private void processContent(Document doc, String content) throws DocumentException {
        if (content == null || content.isBlank()) return;

        Font bodyFont    = FontFactory.getFont(FontFactory.TIMES_ROMAN,  11, Color.BLACK);
        Font articleFont = FontFactory.getFont(FontFactory.TIMES_BOLD,   11, NAVY);
        Font sectionFont = FontFactory.getFont(FontFactory.TIMES_BOLD,   12, NAVY);
        Font bulletFont  = FontFactory.getFont(FontFactory.TIMES_ROMAN,  11, DARK_GRAY);
        Font warnFont    = FontFactory.getFont(FontFactory.TIMES_ITALIC, 10, WARN_COLOR);

        String[] lines = content.split("\n");

        for (String raw : lines) {
            String line = raw.trim();

            if (line.isBlank()) {
                // small vertical gap
                Paragraph gap = new Paragraph(5f, " ", bodyFont);
                doc.add(gap);
                continue;
            }

            if (isWarning(line)) {
                addWarning(doc, line, warnFont);
                continue;
            }

            if (isMajorSection(line)) {
                Paragraph p = new Paragraph(line, sectionFont);
                p.setAlignment(Element.ALIGN_CENTER);
                p.setSpacingBefore(16f);
                p.setSpacingAfter(6f);
                doc.add(p);
                continue;
            }

            if (isArticleHeader(line)) {
                Paragraph p = new Paragraph(line, articleFont);
                p.setSpacingBefore(12f);
                p.setSpacingAfter(4f);
                doc.add(p);
                continue;
            }

            if (isBullet(line)) {
                String text = line.replaceFirst("^[•\\-\\*]\\s*", "");
                Paragraph p = new Paragraph();
                p.setIndentationLeft(18f);
                p.setSpacingAfter(3f);
                p.add(new Chunk("•  " + text, bulletFont));
                doc.add(p);
                continue;
            }

            // Default: justified body paragraph
            Paragraph body = new Paragraph(line, bodyFont);
            body.setAlignment(Element.ALIGN_JUSTIFIED);
            body.setSpacingAfter(3f);
            doc.add(body);
        }
    }

    // ── Line classifiers ─────────────────────────────────────────────────────

    private boolean isMajorSection(String line) {
        if (line.length() < 5) return false;
        // All-caps line that is NOT an article/numbered header
        return line.equals(line.toUpperCase())
                && ALLCAPS_PAT.matcher(line).matches()
                && !ARTICLE_PAT.matcher(line).matches()
                && !line.matches("^\\d+.*");
    }

    private boolean isArticleHeader(String line) {
        return ARTICLE_PAT.matcher(line).matches()
                || ROMAN_PAT.matcher(line).matches()
                || NUMBERED_PAT.matcher(line).matches();
    }

    private boolean isBullet(String line) {
        return line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ");
    }

    private boolean isWarning(String line) {
        String low = line.toLowerCase();
        return low.startsWith("avertissement") || low.startsWith("⚠") || low.startsWith("note :");
    }

    // ── Warning block ────────────────────────────────────────────────────────

    private void addWarning(Document doc, String text, Font warnFont) throws DocumentException {
        LineSeparator ls = new LineSeparator(0.5f, 100f, LIGHT_GRAY, Element.ALIGN_CENTER, -2f);
        doc.add(new Chunk(ls));
        Paragraph p = new Paragraph(text, warnFont);
        p.setSpacingBefore(8f);
        p.setSpacingAfter(4f);
        p.setAlignment(Element.ALIGN_JUSTIFIED);
        doc.add(p);
    }

    // ── Page event: header + footer on every page ────────────────────────────

    static class ContractPageEvent extends PdfPageEventHelper {

        private final String shortTitle;

        ContractPageEvent(String title) {
            this.shortTitle = title.length() > 55 ? title.substring(0, 52) + "…" : title;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb   = writer.getDirectContent();
            int            page = writer.getPageNumber();

            Font small = FontFactory.getFont(FontFactory.HELVETICA, 8,
                    new Color(140, 140, 140));

            // ── Header (from page 2 onward) ──────────────────────────────
            if (page > 1) {
                float top = document.top() + 16f;
                ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                        new Phrase("JurisHub — Cabinet d'Avocats", small),
                        document.leftMargin(), top, 0);
                ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                        new Phrase(shortTitle, small),
                        document.right(), top, 0);
                cb.setLineWidth(0.4f);
                cb.setColorStroke(new Color(200, 200, 200));
                cb.moveTo(document.leftMargin(), document.top() + 10f);
                cb.lineTo(document.right(),      document.top() + 10f);
                cb.stroke();
            }

            // ── Footer ───────────────────────────────────────────────────
            float bot = document.bottom() - 14f;
            cb.setLineWidth(0.4f);
            cb.setColorStroke(new Color(200, 200, 200));
            cb.moveTo(document.leftMargin(), bot + 4f);
            cb.lineTo(document.right(),      bot + 4f);
            cb.stroke();

            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                    new Phrase("Document généré par IA — À valider par un avocat qualifié", small),
                    document.leftMargin(), bot - 6f, 0);
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                    new Phrase("Page " + page, small),
                    document.right(), bot - 6f, 0);
        }
    }
}
