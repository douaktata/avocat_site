package com.example.monpremiersite.service;

import com.example.monpremiersite.dto.CaseClosureResultDTO;
import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.entities.Invoice;
import com.example.monpremiersite.entities.InvoiceLine;
import com.example.monpremiersite.entities.Provision;
import com.example.monpremiersite.entities.TrustDeposit;
import com.example.monpremiersite.entities.TrustAccount;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.base-url}")
    private String baseUrl;

    public void sendProvisionRequestEmail(Provision provision) {
        if (provision.getClient() == null || provision.getClient().getEmail() == null) {
            log.warn("⚠️ Provision email skipped: client or client email is null");
            return;
        }
        String clientEmail = provision.getClient().getEmail();
        String clientName  = provision.getClient().getPrenom() + " " + provision.getClient().getNom();
        String caseNumber  = provision.getCaseEntity() != null ? provision.getCaseEntity().getCase_number() : "—";
        String caseType    = provision.getCaseEntity() != null ? provision.getCaseEntity().getCase_type()   : "—";

        try {
            log.info("📧 Envoi email provision à : {}", clientEmail);

            String subject = "Demande de provision – Dossier " + caseNumber;
            String html    = buildProvisionHtml(clientName, caseNumber, caseType, provision);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(clientEmail);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("✅ Email provision envoyé à : {}", clientEmail);

        } catch (Exception e) {
            log.error("❌ Échec envoi email provision à {} : {}", clientEmail, e.getMessage());
        }
    }

    private String buildProvisionHtml(String clientName, String caseNumber,
                                      String caseType, Provision provision) {
        String amount  = provision.getAmount() != null ? provision.getAmount().toPlainString() : "—";
        String provNum = provision.getProvisionNumber() != null ? provision.getProvisionNumber() : "—";
        String date    = provision.getRequestedDate() != null
                ? provision.getRequestedDate().format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRENCH))
                : "—";
        String desc    = provision.getDescription() != null ? provision.getDescription() : "";

        return "<!DOCTYPE html>"
            + "<html lang='fr'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<style>"
            + "*{margin:0;padding:0;box-sizing:border-box}"
            + "body{background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;color:#1a202c}"
            + ".outer{padding:40px 16px}"
            + ".card{max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}"
            + ".banner{background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 32px;text-align:center}"
            + ".banner-logo{display:inline-block;background:rgba(255,255,255,.15);border-radius:50%;padding:14px 18px;margin-bottom:14px}"
            + ".banner-logo span{font-size:2rem}"
            + ".banner h1{color:#fff;font-size:1.5rem;font-weight:700;letter-spacing:.5px}"
            + ".banner p{color:rgba(255,255,255,.8);font-size:.875rem;margin-top:6px}"
            + ".content{padding:32px}"
            + ".greeting{font-size:1rem;color:#374151;margin-bottom:8px}"
            + ".intro{font-size:.9rem;color:#6b7280;margin-bottom:24px;line-height:1.6}"
            + ".section-title{font-size:.7rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}"
            + ".info-card{background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;padding:18px;margin-bottom:16px}"
            + ".info-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #e8ecf5}"
            + ".info-row:last-child{border-bottom:none}"
            + ".info-label{font-size:.82rem;color:#6b7280;font-weight:500}"
            + ".info-value{font-size:.82rem;color:#1a202c;font-weight:600;text-align:right}"
            + ".amount-card{background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:1px solid #bfdbfe;border-radius:10px;padding:22px;margin-bottom:24px;text-align:center}"
            + ".amount-label{font-size:.8rem;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}"
            + ".amount-value{font-size:2.2rem;font-weight:800;color:#1e3a8a;letter-spacing:.5px}"
            + ".amount-currency{font-size:1rem;font-weight:600;color:#3b82f6;margin-left:6px}"
            + ".badge{display:inline-block;background:#fef3c7;color:#d97706;border:1px solid #fcd34d;border-radius:20px;padding:4px 14px;font-size:.78rem;font-weight:700;margin-top:10px}"
            + ".prov-num{font-size:.8rem;color:#6b7280;margin-top:8px}"
            + ".cta-block{text-align:center;margin:28px 0 20px}"
            + ".cta-btn{display:inline-block;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:.9rem;letter-spacing:.3px;box-shadow:0 4px 14px rgba(37,99,235,.35)}"
            + ".divider{border:none;border-top:1px solid #e5e7eb;margin:24px 0}"
            + ".sign{font-size:.88rem;color:#374151;line-height:1.7}"
            + ".footer{background:#f8faff;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center}"
            + ".footer p{font-size:.75rem;color:#9ca3af;line-height:1.8}"
            + ".footer a{color:#3b82f6;text-decoration:none}"
            + "</style></head>"
            + "<body><div class='outer'><div class='card'>"

            // Banner
            + "<div class='banner'>"
            + "<div class='banner-logo'><span>⚖️</span></div>"
            + "<h1>JurisHub Avocats</h1>"
            + "<p>Demande de Provision d'Honoraires</p>"
            + "</div>"

            // Content
            + "<div class='content'>"
            + "<p class='greeting'>Chèr(e) <strong>" + clientName + "</strong>,</p>"
            + "<p class='intro'>Votre avocat a établi une demande de provision pour votre dossier. Veuillez trouver ci-dessous le détail de cette demande.</p>"

            // Dossier info
            + "<div class='section-title'>Informations du dossier</div>"
            + "<div class='info-card'>"
            + "<div class='info-row'><span class='info-label'>📁 Numéro de dossier</span><span class='info-value'>" + caseNumber + "</span></div>"
            + "<div class='info-row'><span class='info-label'>📌 Type d'affaire</span><span class='info-value'>" + caseType + "</span></div>"
            + "<div class='info-row'><span class='info-label'>📅 Date de la demande</span><span class='info-value'>" + date + "</span></div>"
            + (desc.isEmpty() ? "" : "<div class='info-row'><span class='info-label'>📝 Description</span><span class='info-value' style='max-width:60%;word-break:break-word'>" + desc + "</span></div>")
            + "</div>"

            // Amount
            + "<div class='section-title'>Montant de la provision</div>"
            + "<div class='amount-card'>"
            + "<div class='amount-label'>Montant demandé</div>"
            + "<div><span class='amount-value'>" + amount + "</span><span class='amount-currency'>TND</span></div>"
            + "<div><span class='badge'>⏳ En attente de paiement</span></div>"
            + "<div class='prov-num'>Référence : <strong>" + provNum + "</strong></div>"
            + "</div>"

            // CTA
            + "<div class='cta-block'>"
            + "<a href='" + baseUrl + "/client' class='cta-btn'>Accéder à mon espace client</a>"
            + "</div>"

            + "<hr class='divider'>"
            + "<p class='sign'>Pour toute question, n'hésitez pas à contacter votre avocat directement.<br><br>Cordialement,<br><strong>L'équipe JurisHub</strong></p>"
            + "</div>"

            // Footer
            + "<div class='footer'>"
            + "<p>Cet email a été envoyé automatiquement — merci de ne pas y répondre directement.</p>"
            + "<p>&copy; 2026 JurisHub &mdash; Cabinet d'Avocats &mdash; Tous droits réservés</p>"
            + "</div>"

            + "</div></div></body></html>";
    }

    public void sendInvoiceEmail(Invoice invoice) {
        if (invoice.getClient() == null || invoice.getClient().getEmail() == null) {
            log.warn("⚠️ Invoice email skipped: client or client email is null");
            return;
        }
        String clientEmail = invoice.getClient().getEmail();
        String clientName  = invoice.getClient().getPrenom() + " " + invoice.getClient().getNom();
        String caseNumber  = invoice.getCaseEntity() != null ? invoice.getCaseEntity().getCase_number() : "—";
        String caseType    = invoice.getCaseEntity() != null ? invoice.getCaseEntity().getCase_type()   : "—";

        try {
            log.info("📧 Envoi email facture à : {}", clientEmail);

            String subject = "Facture " + (invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "FAC-" + invoice.getId()) + " – Dossier " + caseNumber;
            String html    = buildInvoiceHtml(clientName, caseNumber, caseType, invoice);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(clientEmail);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("✅ Email facture envoyé à : {}", clientEmail);

        } catch (Exception e) {
            log.error("❌ Échec envoi email facture à {} : {}", clientEmail, e.getMessage());
        }
    }

    // ── Dépôt séquestre ────────────────────────────────────────────────────

    public void sendDepositReceiptEmail(TrustDeposit dep) {
        if (dep.getTrustAccount() == null) return;
        CaseEntity cas = dep.getTrustAccount().getLegalCase();
        if (cas == null || cas.getUser() == null || cas.getUser().getEmail() == null) {
            log.warn("⚠️ Deposit email skipped: no client email");
            return;
        }
        String clientEmail = cas.getUser().getEmail();
        String clientName  = cas.getUser().getPrenom() + " " + cas.getUser().getNom();
        String caseNumber  = cas.getCase_number();
        String amount      = dep.getAmount().toPlainString();
        String receipt     = dep.getReceiptNumber() != null ? dep.getReceiptNumber() : "—";
        String method      = dep.getPaymentMethod() != null ? dep.getPaymentMethod().name() : "—";
        String date        = dep.getPaymentDate() != null
                ? dep.getPaymentDate().format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRENCH)) : "—";
        String balance     = dep.getTrustAccount().getBalance().toPlainString();
        try {
            String subject = "Reçu de dépôt " + receipt + " – Dossier " + caseNumber;
            String html = "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'><style>"
                + "*{margin:0;padding:0;box-sizing:border-box}body{background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;color:#1a202c}"
                + ".outer{padding:40px 16px}.card{max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}"
                + ".banner{background:linear-gradient(135deg,#065f46 0%,#059669 100%);padding:36px 32px;text-align:center}"
                + ".banner h1{color:#fff;font-size:1.5rem;font-weight:700}.banner p{color:rgba(255,255,255,.8);font-size:.875rem;margin-top:6px}"
                + ".content{padding:32px}.section-title{font-size:.7rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}"
                + ".info-card{background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;padding:18px;margin-bottom:16px}"
                + ".info-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e8ecf5}"
                + ".info-row:last-child{border-bottom:none}.info-label{font-size:.82rem;color:#6b7280;font-weight:500}.info-value{font-size:.82rem;color:#1a202c;font-weight:600}"
                + ".amount-card{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:10px;padding:22px;margin-bottom:24px;text-align:center}"
                + ".amount-value{font-size:2.2rem;font-weight:800;color:#065f46}.notice{background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:.82rem;color:#92400e;margin-bottom:24px}"
                + ".footer{background:#f8faff;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center}.footer p{font-size:.75rem;color:#9ca3af;line-height:1.8}"
                + "</style></head><body><div class='outer'><div class='card'>"
                + "<div class='banner'><h1>JurisHub Avocats</h1><p>Reçu de Dépôt Séquestre</p></div>"
                + "<div class='content'>"
                + "<p style='font-size:1rem;color:#374151;margin-bottom:20px'>Chèr(e) <strong>" + clientName + "</strong>,<br>Votre versement au compte séquestre a bien été enregistré.</p>"
                + "<div class='section-title'>Détail du versement</div><div class='info-card'>"
                + "<div class='info-row'><span class='info-label'>📄 N° Reçu</span><span class='info-value'>" + receipt + "</span></div>"
                + "<div class='info-row'><span class='info-label'>📁 Dossier</span><span class='info-value'>" + caseNumber + "</span></div>"
                + "<div class='info-row'><span class='info-label'>📅 Date</span><span class='info-value'>" + date + "</span></div>"
                + "<div class='info-row'><span class='info-label'>💳 Méthode</span><span class='info-value'>" + method + "</span></div>"
                + "</div>"
                + "<div class='section-title'>Montant versé</div><div class='amount-card'>"
                + "<div style='font-size:.8rem;color:#059669;font-weight:600;margin-bottom:8px'>VERSEMENT REÇU</div>"
                + "<div class='amount-value'>" + amount + " <span style='font-size:1rem'>TND</span></div>"
                + "<div style='font-size:.8rem;color:#374151;margin-top:10px'>Solde séquestre après versement : <strong>" + balance + " TND</strong></div>"
                + "</div>"
                + "<div class='notice'>⚠️ Ce reçu ne constitue pas une facture. Il atteste uniquement du versement au compte séquestre.</div>"
                + "<hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0'>"
                + "<p style='font-size:.88rem;color:#374151;line-height:1.7'>Cordialement,<br><strong>L'équipe JurisHub</strong></p>"
                + "</div><div class='footer'><p>&copy; 2026 JurisHub — Cabinet d'Avocats</p></div></div></div></body></html>";
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(clientEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Email reçu dépôt envoyé à : {}", clientEmail);
        } catch (Exception e) {
            log.error("❌ Échec email dépôt : {}", e.getMessage());
        }
    }

    public void sendCaseClosureEmail(CaseEntity cas, CaseClosureResultDTO result) {
        if (cas.getUser() == null || cas.getUser().getEmail() == null) {
            log.warn("⚠️ Closure email skipped: no client email");
            return;
        }
        String clientEmail = cas.getUser().getEmail();
        String clientName  = cas.getUser().getPrenom() + " " + cas.getUser().getNom();
        String caseNumber  = cas.getCase_number();
        String statusLine  = result.allSettled
                ? "<div style='background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-weight:600'>✅ Bilan clôturé — tout est réglé</div>"
                : "<div style='background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:8px;padding:10px 16px;margin-bottom:16px;font-weight:600'>⚠️ Des points financiers restent en attente</div>";
        StringBuilder warningHtml = new StringBuilder();
        if (result.warnings != null) {
            for (String w : result.warnings) {
                warningHtml.append("<li style='margin-bottom:4px'>").append(w).append("</li>");
            }
        }
        try {
            String subject = "Votre dossier " + caseNumber + " est clôturé";
            String html = "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'><style>"
                + "*{margin:0;padding:0;box-sizing:border-box}body{background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;color:#1a202c}"
                + ".outer{padding:40px 16px}.card{max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}"
                + ".banner{background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 32px;text-align:center}"
                + ".banner h1{color:#fff;font-size:1.5rem;font-weight:700}.banner p{color:rgba(255,255,255,.8);font-size:.875rem;margin-top:6px}"
                + ".content{padding:32px}.footer{background:#f8faff;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center}.footer p{font-size:.75rem;color:#9ca3af;line-height:1.8}"
                + "</style></head><body><div class='outer'><div class='card'>"
                + "<div class='banner'><h1>JurisHub Avocats</h1><p>Clôture de dossier</p></div>"
                + "<div class='content'>"
                + "<p style='font-size:1rem;color:#374151;margin-bottom:20px'>Chèr(e) <strong>" + clientName + "</strong>,<br>Votre dossier <strong>" + caseNumber + "</strong> a été clôturé.</p>"
                + statusLine
                + (warningHtml.length() > 0
                    ? "<ul style='font-size:.88rem;color:#374151;padding-left:20px;margin-bottom:16px'>" + warningHtml + "</ul>"
                    : "")
                + "<hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0'>"
                + "<p style='font-size:.88rem;color:#374151;line-height:1.7'>Pour toute question, contactez votre avocat.<br><br>Cordialement,<br><strong>L'équipe JurisHub</strong></p>"
                + "</div><div class='footer'><p>&copy; 2026 JurisHub — Cabinet d'Avocats</p></div></div></div></body></html>";
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(clientEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Email clôture dossier envoyé à : {}", clientEmail);
        } catch (Exception e) {
            log.error("❌ Échec email clôture dossier : {}", e.getMessage());
        }
    }

    private String buildInvoiceHtml(String clientName, String caseNumber, String caseType, Invoice invoice) {
        String invoiceNum  = invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "FAC-" + invoice.getId();
        String date        = invoice.getInvoiceDate() != null
                ? invoice.getInvoiceDate().format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRENCH))
                : "—";
        String subtotal    = invoice.getSubtotal() != null ? invoice.getSubtotal().toPlainString() : "0";
        String total       = invoice.getTotal()    != null ? invoice.getTotal().toPlainString()    : "0";
        String taxAmount   = invoice.getTaxAmount() != null ? invoice.getTaxAmount().toPlainString() : "0";

        StringBuilder lines = new StringBuilder();
        for (InvoiceLine line : invoice.getInvoiceLines()) {
            lines.append("<div class='info-row'><span class='info-label'>").append(line.getDescription()).append("</span>")
                 .append("<span class='info-value'>").append(line.getSubtotal().toPlainString()).append(" TND</span></div>");
        }

        return "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'>"
            + "<style>"
            + "*{margin:0;padding:0;box-sizing:border-box}"
            + "body{background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;color:#1a202c}"
            + ".outer{padding:40px 16px}"
            + ".card{max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)}"
            + ".banner{background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:36px 32px;text-align:center}"
            + ".banner-logo{display:inline-block;background:rgba(255,255,255,.15);border-radius:50%;padding:14px 18px;margin-bottom:14px}"
            + ".banner h1{color:#fff;font-size:1.5rem;font-weight:700}"
            + ".banner p{color:rgba(255,255,255,.8);font-size:.875rem;margin-top:6px}"
            + ".content{padding:32px}"
            + ".intro{font-size:.9rem;color:#6b7280;margin-bottom:24px;line-height:1.6}"
            + ".section-title{font-size:.7rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}"
            + ".info-card{background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;padding:18px;margin-bottom:16px}"
            + ".info-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e8ecf5}"
            + ".info-row:last-child{border-bottom:none}"
            + ".info-label{font-size:.82rem;color:#6b7280;font-weight:500}"
            + ".info-value{font-size:.82rem;color:#1a202c;font-weight:600}"
            + ".total-card{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:10px;padding:22px;text-align:center;margin-bottom:24px}"
            + ".total-value{font-size:2.2rem;font-weight:800;color:#1e3a8a}"
            + ".total-label{font-size:.8rem;color:#3b82f6;font-weight:600;text-transform:uppercase;margin-bottom:8px}"
            + ".cta-btn{display:inline-block;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:.9rem;box-shadow:0 4px 14px rgba(37,99,235,.35)}"
            + ".footer{background:#f8faff;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center}"
            + ".footer p{font-size:.75rem;color:#9ca3af;line-height:1.8}"
            + "</style></head>"
            + "<body><div class='outer'><div class='card'>"
            + "<div class='banner'><div class='banner-logo'><span>⚖️</span></div>"
            + "<h1>JurisHub Avocats</h1><p>Facture d'Honoraires</p></div>"
            + "<div class='content'>"
            + "<p class='intro'>Chèr(e) <strong>" + clientName + "</strong>,<br>Veuillez trouver ci-dessous votre facture pour les services juridiques rendus.</p>"
            + "<div class='section-title'>Informations de la facture</div>"
            + "<div class='info-card'>"
            + "<div class='info-row'><span class='info-label'>📄 N° Facture</span><span class='info-value'>" + invoiceNum + "</span></div>"
            + "<div class='info-row'><span class='info-label'>📁 Dossier</span><span class='info-value'>" + caseNumber + "</span></div>"
            + "<div class='info-row'><span class='info-label'>📌 Type</span><span class='info-value'>" + caseType + "</span></div>"
            + "<div class='info-row'><span class='info-label'>📅 Date</span><span class='info-value'>" + date + "</span></div>"
            + "</div>"
            + (lines.length() > 0 ? "<div class='section-title'>Détail des prestations</div><div class='info-card'>" + lines + "</div>" : "")
            + "<div class='section-title'>Montant à régler</div>"
            + "<div class='total-card'>"
            + "<div class='total-label'>Sous-total HT : " + subtotal + " TND &nbsp;|&nbsp; TVA 19% : " + taxAmount + " TND</div>"
            + "<div class='total-value'>" + total + " <span style='font-size:1rem;color:#3b82f6'>TND TTC</span></div>"
            + "</div>"
            + "<div style='text-align:center;margin:28px 0 20px'><a href='" + baseUrl + "/client' class='cta-btn'>Accéder à mon espace client</a></div>"
            + "<hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0'>"
            + "<p style='font-size:.88rem;color:#374151;line-height:1.7'>Pour toute question, contactez votre avocat.<br><br>Cordialement,<br><strong>L'équipe JurisHub</strong></p>"
            + "</div>"
            + "<div class='footer'><p>Cet email est automatique — merci de ne pas y répondre.</p><p>&copy; 2026 JurisHub — Cabinet d'Avocats</p></div>"
            + "</div></div></body></html>";
    }
}
