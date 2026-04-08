package com.example.monpremiersite.service;

import com.example.monpremiersite.entities.*;
import com.example.monpremiersite.repository.InvoiceRepository;
import com.example.monpremiersite.repository.LateFeeRecordRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LateFeeService {

    private final InvoiceRepository invoiceRepository;
    private final LateFeeRecordRepository lateFeeRecordRepository;
    private final JavaMailSender mailSender;

    @Value("${payment.late-fee.percentage:0.05}")
    private double lateFeePercentage;

    @Value("${payment.late-fee.threshold-days:30}")
    private int thresholdDays;

    @Value("${spring.mail.username:noreply@jurishub.tn}")
    private String fromEmail;

    public LateFeeService(InvoiceRepository invoiceRepository,
                          LateFeeRecordRepository lateFeeRecordRepository,
                          JavaMailSender mailSender) {
        this.invoiceRepository = invoiceRepository;
        this.lateFeeRecordRepository = lateFeeRecordRepository;
        this.mailSender = mailSender;
    }

    /** Runs daily at 9 AM — applies late fees to overdue invoices. */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void applyLateFees() {
        LocalDate threshold = LocalDate.now().minusDays(thresholdDays);
        List<Invoice> overdue = invoiceRepository.findOverdueEligibleForLateFee(threshold);
        for (Invoice invoice : overdue) {
            applyLateFeeInternal(invoice);
        }
    }

    @Transactional
    public LateFeeRecord applyLateFee(Invoice invoice) {
        return applyLateFeeInternal(invoice);
    }

    private LateFeeRecord applyLateFeeInternal(Invoice invoice) {
        BigDecimal total = invoice.getTotal();
        BigDecimal feeAmount = total.multiply(BigDecimal.valueOf(lateFeePercentage))
                .setScale(3, RoundingMode.HALF_UP);
        long daysOverdue = ChronoUnit.DAYS.between(invoice.getDueDate(), LocalDate.now());

        LateFeeRecord feeRecord = new LateFeeRecord();
        feeRecord.setInvoice(invoice);
        feeRecord.setAmount(feeAmount);
        feeRecord.setAppliedDate(LocalDate.now());
        feeRecord.setNotes("Pénalité de retard (" + daysOverdue + " jours de retard)");
        feeRecord = lateFeeRecordRepository.save(feeRecord);

        invoiceRepository.save(invoice);

        sendLateFeeNotification(invoice, feeAmount, daysOverdue);
        return feeRecord;
    }

    public List<LateFeeRecord> findByInvoiceId(Long invoiceId) {
        return lateFeeRecordRepository.findByInvoice_Id(invoiceId);
    }

    @Transactional
    public LateFeeRecord overrideFee(Long feeId, BigDecimal overrideAmount, String notes) {
        LateFeeRecord feeRecord = lateFeeRecordRepository.findById(feeId)
                .orElseThrow(() -> new RuntimeException("Late fee not found: " + feeId));
        feeRecord.setOverrideAmount(overrideAmount);
        if (notes != null) feeRecord.setNotes(notes);
        return lateFeeRecordRepository.save(feeRecord);
    }

    private void sendLateFeeNotification(Invoice invoice, BigDecimal feeAmount, long daysOverdue) {
        if (invoice.getClient() == null || invoice.getClient().getEmail() == null) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(invoice.getClient().getEmail());
            helper.setSubject("Pénalité de retard - Facture " + invoice.getInvoiceNumber());
            String clientName = (invoice.getClient().getNom() + " " + invoice.getClient().getPrenom()).trim();
            helper.setText(
                "Madame/Monsieur " + clientName + ",\n\n" +
                "Votre facture " + invoice.getInvoiceNumber() + " est en retard depuis " + daysOverdue + " jours.\n" +
                "Une pénalité de retard de " + feeAmount + " TND a été appliquée.\n\n" +
                "Merci de régulariser votre situation dans les plus brefs délais.\n\n" +
                "Cordialement,\nJurisHub - Cabinet d'Avocats"
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erreur envoi notification pénalité pour facture "
                    + invoice.getInvoiceNumber() + ": " + e.getMessage());
        }
    }
}
