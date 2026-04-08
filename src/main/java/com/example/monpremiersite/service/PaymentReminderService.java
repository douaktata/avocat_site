package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.EmailTemplateRepository;
import com.example.monpremiersite.repository.InvoiceRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentReminderService {

    private final InvoiceRepository invoiceRepository;
    private final EmailTemplateRepository templateRepository;
    private final JavaMailSender mailSender;

    @Value("${payment.reminder.stage1-days:10}")
    private int stage1Days;

    @Value("${payment.reminder.stage2-days:20}")
    private int stage2Days;

    @Value("${payment.reminder.stage3-days:30}")
    private int stage3Days;

    @Value("${payment.reminder.min-days-between:5}")
    private int minDaysBetween;

    @Value("${spring.mail.username:noreply@jurishub.tn}")
    private String fromEmail;

    public PaymentReminderService(InvoiceRepository invoiceRepository,
                                  EmailTemplateRepository templateRepository,
                                  JavaMailSender mailSender) {
        this.invoiceRepository = invoiceRepository;
        this.templateRepository = templateRepository;
        this.mailSender = mailSender;
    }

    /** Runs daily at 9 AM — sends reminders for overdue invoices. */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendPendingReminders() {
        LocalDate today = LocalDate.now();
        LocalDate minGap = today.minusDays(minDaysBetween);

        processStage(today.minusDays(stage1Days), 1, ReminderTemplateType.RAPPEL_1, minGap);
        processStage(today.minusDays(stage2Days), 2, ReminderTemplateType.RAPPEL_2, minGap);
        processStage(today.minusDays(stage3Days), 3, ReminderTemplateType.RAPPEL_3, minGap);
    }

    @Transactional
    public void sendManualReminder(Long invoiceId, ReminderTemplateType templateType, String actor) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));
        sendReminderEmail(invoice, templateType, actor);
    }

    private void processStage(LocalDate threshold, int stage, ReminderTemplateType type, LocalDate minGap) {
        List<Invoice> eligible = invoiceRepository.findEligibleForReminder(threshold, stage, minGap);
        for (Invoice invoice : eligible) {
            sendReminderEmail(invoice, type, "SYSTEM");
        }
    }

    private void sendReminderEmail(Invoice invoice, ReminderTemplateType type, String actor) {
        if (invoice.getClient() == null || invoice.getClient().getEmail() == null) return;

        Optional<EmailTemplate> templateOpt = templateRepository.findFirstByTypeAndIsActiveTrue(type);
        String subject, body;

        if (templateOpt.isPresent()) {
            subject = interpolate(templateOpt.get().getSubject(), invoice);
            body    = interpolate(templateOpt.get().getBody(), invoice);
        } else {
            subject = buildDefaultSubject(invoice, type);
            body    = buildDefaultBody(invoice, type);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(invoice.getClient().getEmail());
            helper.setSubject(subject);
            helper.setText(body);
            mailSender.send(message);
            System.out.printf("[Reminder] Rappel %s envoyé pour facture %s à %s par %s%n",
                    type, invoice.getInvoiceNumber(), invoice.getClient().getEmail(), actor);
        } catch (Exception e) {
            System.err.println("Erreur envoi rappel pour facture " + invoice.getInvoiceNumber() + ": " + e.getMessage());
        }
    }

    private String interpolate(String template, Invoice invoice) {
        String clientName = invoice.getClient() != null
                ? invoice.getClient().getNom() + " " + invoice.getClient().getPrenom() : "Client";
        long daysOverdue = invoice.getDueDate() != null
                ? java.time.temporal.ChronoUnit.DAYS.between(invoice.getDueDate(), LocalDate.now()) : 0;
        return template
                .replace("{INVOICE_NUMBER}", invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "")
                .replace("{AMOUNT}", invoice.getTotal() != null ? invoice.getTotal().toPlainString() : "0")
                .replace("{DUE_DATE}", invoice.getDueDate() != null ? invoice.getDueDate().toString() : "")
                .replace("{CLIENT_NAME}", clientName)
                .replace("{DAYS_OVERDUE}", String.valueOf(daysOverdue));
    }

    private String buildDefaultSubject(Invoice invoice, ReminderTemplateType type) {
        return switch (type) {
            case RAPPEL_1 -> "Rappel amiable - Facture " + invoice.getInvoiceNumber();
            case RAPPEL_2 -> "Rappel - Facture " + invoice.getInvoiceNumber() + " impayée";
            case RAPPEL_3 -> "[URGENT] Facture " + invoice.getInvoiceNumber() + " en retard";
        };
    }

    private String buildDefaultBody(Invoice invoice, ReminderTemplateType type) {
        String clientName = invoice.getClient() != null
                ? invoice.getClient().getNom() + " " + invoice.getClient().getPrenom() : "Client";
        long daysOverdue = invoice.getDueDate() != null
                ? java.time.temporal.ChronoUnit.DAYS.between(invoice.getDueDate(), LocalDate.now()) : 0;
        return switch (type) {
            case RAPPEL_1 -> String.format(
                "Madame/Monsieur %s,\n\nCeci est un rappel amical concernant votre facture %s d'un montant de %s TND, échue le %s.\n\nNous vous serions reconnaissants de bien vouloir procéder au règlement.\n\nCordialement,\nJurisHub",
                clientName, invoice.getInvoiceNumber(), invoice.getTotal(), invoice.getDueDate());
            case RAPPEL_2 -> String.format(
                "Madame/Monsieur %s,\n\nVotre facture %s d'un montant de %s TND est impayée depuis %d jours. Des pénalités de retard peuvent s'appliquer.\n\nMerci de régulariser cette situation rapidement.\n\nCordialement,\nJurisHub",
                clientName, invoice.getInvoiceNumber(), invoice.getTotal(), daysOverdue);
            case RAPPEL_3 -> String.format(
                "Madame/Monsieur %s,\n\nVotre facture %s d'un montant de %s TND est en retard depuis %d jours. Conformément à nos conditions, des pénalités de retard ont été appliquées.\n\nSans régularisation sous 7 jours, nous serons contraints d'engager une procédure de recouvrement.\n\nCordialement,\nJurisHub",
                clientName, invoice.getInvoiceNumber(), invoice.getTotal(), daysOverdue);
        };
    }
}
