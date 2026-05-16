package com.example.moneymanager.service;

import com.example.moneymanager.dto.BudgetStatusDTO;
import com.example.moneymanager.dto.ExpenseDTO;
import com.example.moneymanager.dto.MonthlyReportCardDTO;
import com.example.moneymanager.dto.NotificationDTO;
import com.example.moneymanager.entity.*;
import com.example.moneymanager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final ProfileRepository profileRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final EmailService emailService;
    private final MailTemplateService mailTemplateService;
    private final ProfileService profileService;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final SavingGoalContributionRepository savingGoalContributionRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final BudgetRepository budgetRepository;
    private final MonthlyReportCardService monthlyReportCardService;
    private final EmailNotificationPreferenceService emailNotificationPreferenceService;
    
    @Autowired
    @Lazy
    private ExpenseService expenseService;

    @Value("${money.manager.frontend.url}")
    private String frontendUrl;

    // --- Core Notification Methods ---
    
    @Transactional
    public void createNotification(ProfileEntity profile, String title, String message, NotificationType type) {
        NotificationEntity notification = NotificationEntity.builder()
                .profile(profile)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Async
    @Transactional
    public void sendWelcomeAsync(ProfileEntity profile) {
        try {
            createNotification(profile,
                    "Chào mừng bạn đến với Money Manager! 🎉",
                    "Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu theo dõi thu chi và quản lý tài chính thông minh hơn ngay hôm nay!",
                    NotificationType.SYSTEM);
            String htmlBody = mailTemplateService.buildWelcomeEmail(profile.getFullName());
            emailService.sendHtmlEmail(profile.getEmail(), "Chào mừng bạn đến với Money Manager!", htmlBody);
        } catch (Exception e) {
            log.error("Failed to send welcome notification/email to {}: {}", profile.getEmail(), e.getMessage());
        }
    }

    @Transactional
    public void createBroadcast(String title, String message) {
        NotificationEntity notification = NotificationEntity.builder()
                .profile(null) // null indicates broadcast to all
                .title(title)
                .message(message)
                .type(NotificationType.ADMIN)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotificationsForCurrentUser() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<NotificationEntity> notifications = notificationRepository.findByProfileIdOrProfileIsNullOrderByCreatedAtDesc(profile.getId());

        return notifications.stream().map(n -> NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType().name())
                .isRead(isRead(n, profile.getId()))
                .createdAt(n.getCreatedAt())
                .build()
        ).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        ProfileEntity profile = profileService.getCurrentProfile();
        long personalUnread = notificationRepository.countUnreadByProfileId(profile.getId());
        long unreadBroadcasts = notificationRepository.countUnreadBroadcastsForProfile(profile.getId());
        return personalUnread + unreadBroadcasts;
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        ProfileEntity profile = profileService.getCurrentProfile();
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));

        if (notification.getProfile() == null) {
            if (!isRead(notification, profile.getId())) {
                notificationReadRepository.save(NotificationReadEntity.builder()
                        .notification(notification)
                        .profile(profile)
                        .build());
            }
        } else if (notification.getProfile().getId().equals(profile.getId())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        } else {
            throw new RuntimeException("Không có quyền truy cập thông báo này");
        }
    }

    @Transactional
    public void markAllAsRead() {
        ProfileEntity profile = profileService.getCurrentProfile();
        List<NotificationEntity> notifications = notificationRepository.findByProfileIdOrProfileIsNullOrderByCreatedAtDesc(profile.getId());

        for (NotificationEntity n : notifications) {
            if (isRead(n, profile.getId())) continue;
            if (n.getProfile() == null) {
                notificationReadRepository.save(NotificationReadEntity.builder()
                        .notification(n)
                        .profile(profile)
                        .build());
            } else {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        }
    }

    private boolean isRead(NotificationEntity n, Long profileId) {
        if (n.getProfile() == null) {
            return notificationReadRepository.existsByNotificationIdAndProfileId(n.getId(), profileId);
        }
        return Boolean.TRUE.equals(n.getIsRead());
    }

    // --- Helper Methods to generate specific notifications ---

    @Transactional
    public void notifyExpenseAdded(ProfileEntity profile, String expenseName, BigDecimal amount) {
        String formattedAmount = NumberFormat.getInstance(new Locale("vi", "VN")).format(amount);
        String message = String.format("Bạn vừa thêm khoản chi tiêu '%s' với số tiền %s VNĐ.", expenseName, formattedAmount);
        createNotification(profile, "Thêm chi tiêu mới", message, NotificationType.EXPENSE);
    }

    @Transactional
    public void notifyIncomeAdded(ProfileEntity profile, String incomeName, BigDecimal amount) {
        String formattedAmount = NumberFormat.getInstance(new Locale("vi", "VN")).format(amount);
        String message = String.format("Bạn vừa thêm khoản thu nhập '%s' với số tiền %s VNĐ.", incomeName, formattedAmount);
        createNotification(profile, "Thêm thu nhập mới", message, NotificationType.INCOME);
    }

    @Transactional
    public void notifyBudgetWarning(ProfileEntity profile, BudgetStatusDTO budgetStatus) {
        if (!budgetStatus.isHasBudget()) return;
        
        if (budgetStatus.isExceeded()) {
            String message = String.format("Ngân sách cho danh mục '%s' đã VƯỢT HẠN MỨC! Hãy điều chỉnh chi tiêu của bạn.", budgetStatus.getCategoryName());
            createNotification(profile, "Vượt ngân sách", message, NotificationType.BUDGET_EXCEEDED);
        } else if (budgetStatus.isWarning()) {
            String message = String.format("Ngân sách cho danh mục '%s' sắp hết (đã dùng %d%%).", 
                    budgetStatus.getCategoryName(), (int)(budgetStatus.getUsageRatio() * 100));
            createNotification(profile, "Cảnh báo ngân sách", message, NotificationType.BUDGET_WARNING);
        }
    }

    @Transactional
    public void notifyPaymentSuccess(ProfileEntity profile, String planName) {
        String message = String.format("Thanh toán thành công! Gói đăng ký %s của bạn đã được kích hoạt.", planName);
        createNotification(profile, "Thanh toán thành công", message, NotificationType.PAYMENT);
    }

    // ─── Smart Notification: Budget Threshold (70/80/90%) ─────────────

    @Transactional
    public void notifyBudgetThreshold(ProfileEntity profile, String categoryName,
                                       int percent, BigDecimal spent, BigDecimal limit) {
        String formattedSpent = NumberFormat.getInstance(new Locale("vi", "VN")).format(spent);
        String formattedLimit = NumberFormat.getInstance(new Locale("vi", "VN")).format(limit);
        String message = String.format(
                "Ngân sách '%s' đã đạt %d%% (đã chi %s VNĐ / %s VNĐ). Hãy cân nhắc chi tiêu!",
                categoryName, percent, formattedSpent, formattedLimit);
        createNotification(profile, "⚠️ Cảnh báo ngân sách " + percent + "%", message, NotificationType.BUDGET_ALERT);
    }

    // ─── Smart Notification: Abnormal Daily Spending ─────────────────

    @Async
    public void checkAbnormalSpendingAsync(ProfileEntity profile, LocalDate date) {
        try {
            // 1. Get today's total spending
            BigDecimal todaySpent = expenseRepository.findByProfileIdAndDate(profile.getId(), date)
                    .stream()
                    .map(ExpenseEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (todaySpent.compareTo(BigDecimal.ZERO) <= 0) return;

            // 2. Get average daily spending for the month
            YearMonth yearMonth = YearMonth.from(date);
            LocalDate startOfMonth = yearMonth.atDay(1);
            LocalDate endOfMonth = yearMonth.atEndOfMonth();
            int daysInMonth = yearMonth.lengthOfMonth();

            BigDecimal monthTotal = expenseRepository.findByProfileIdAndDateBetween(profile.getId(), startOfMonth, endOfMonth)
                    .stream()
                    .map(ExpenseEntity::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal dailyAverage = monthTotal.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);

            // 3. If today > average * 1.5, send alert
            BigDecimal threshold = dailyAverage.multiply(BigDecimal.valueOf(1.5));
            if (todaySpent.compareTo(threshold) > 0) {
                // Check duplicate: already sent today?
                boolean alreadySent = notificationRepository.findByProfileIdAndTypeAndCreatedAtAfter(
                        profile.getId(), NotificationType.SPENDING_ALERT, date.atStartOfDay()
                ).size() > 0;

                if (!alreadySent) {
                    String formattedToday = NumberFormat.getInstance(new Locale("vi", "VN")).format(todaySpent);
                    String formattedAvg = NumberFormat.getInstance(new Locale("vi", "VN")).format(dailyAverage);
                    String message = String.format(
                            "Hôm nay bạn đã chi %s VNĐ, cao hơn %.1f lần so với mức trung bình hàng ngày (%s VNĐ). Hãy kiểm tra lại!",
                            formattedToday,
                            todaySpent.divide(dailyAverage, 1, RoundingMode.HALF_UP).doubleValue(),
                            formattedAvg);
                    createNotification(profile, "🔴 Chi tiêu bất thường", message, NotificationType.SPENDING_ALERT);
                }
            }
        } catch (Exception e) {
            log.error("Error checking abnormal spending for user {}: {}", profile.getId(), e.getMessage());
        }
    }

    // ─── Smart Notification: Saving Goal Progress ────────────────────

    @Transactional
    public void notifyGoalProgress(ProfileEntity profile, String goalName,
                                    BigDecimal contributed, BigDecimal current, BigDecimal target) {
        String formattedContributed = NumberFormat.getInstance(new Locale("vi", "VN")).format(contributed);
        String formattedCurrent = NumberFormat.getInstance(new Locale("vi", "VN")).format(current);
        String formattedTarget = NumberFormat.getInstance(new Locale("vi", "VN")).format(target);
        BigDecimal remaining = target.subtract(current);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;
        String formattedRemaining = NumberFormat.getInstance(new Locale("vi", "VN")).format(remaining);

        String message = String.format(
                "Bạn vừa tiết kiệm được %s VNĐ cho '%s'. Hiện tại: %s VNĐ / %s VNĐ. Còn cần %s VNĐ nữa để đạt mục tiêu!",
                formattedContributed, goalName, formattedCurrent, formattedTarget, formattedRemaining);
        createNotification(profile, "🎯 Tiến độ mục tiêu", message, NotificationType.GOAL_PROGRESS);
    }

    // --- Scheduled Email Jobs ---

    @Scheduled(cron = "0 0 22 * * *", zone = "IST")
    public void sendDailyIncomeExpenseReminder() {
        log.info("Job started: sendDailyIncomeExpenseReminder()");
        List<ProfileEntity> profiles = profileRepository.findAll();
        for(ProfileEntity profile : profiles) {
            if (!emailNotificationPreferenceService.isNotificationEnabled(profile.getId(), EmailNotificationType.DAILY_EXPENSE_REPORT)) {
                continue;
            }
            String htmlBody = mailTemplateService.buildDailyReminderEmail(profile.getFullName(), frontendUrl);
            emailService.sendHtmlEmail(profile.getEmail(), "[Money Manager] Nhắc nhở hằng ngày: cập nhật thu chi", htmlBody);
        }
        log.info("Job completed: sendDailyIncomeExpenseReminder()");
    }

    @Scheduled(cron = "0 0 23 * * *", zone = "IST")
    public void sendDailyExpenseSummary() {
        log.info("Job started: sendDailyExpenseSummary()");
        List<ProfileEntity> profiles = profileRepository.findAll();
        for (ProfileEntity profile : profiles) {
            if (!emailNotificationPreferenceService.isNotificationEnabled(profile.getId(), EmailNotificationType.DAILY_EXPENSE_REPORT)) {
                continue;
            }
            List<ExpenseDTO> todaysExpenses = expenseService.getExpensesForUserOnDate(profile.getId(), LocalDate.now());
            if (!todaysExpenses.isEmpty()) {
                StringBuilder table = new StringBuilder();
                table.append("<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"border-collapse:collapse;margin-bottom:8px;\">");
                table.append("<tr style=\"background:#f0f0ff;\">")
                     .append("<th style=\"padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#374151;text-align:left;\">STT</th>")
                     .append("<th style=\"padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#374151;text-align:left;\">Tên khoản chi</th>")
                     .append("<th style=\"padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#374151;text-align:right;\">Số tiền</th>")
                     .append("<th style=\"padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#374151;text-align:left;\">Danh mục</th>")
                     .append("</tr>");
                int i = 1;
                for (ExpenseDTO expense : todaysExpenses) {
                    String rowBg = (i % 2 == 0) ? "background:#f8fafc;" : "";
                    table.append("<tr style=\"").append(rowBg).append("\">");
                    table.append("<td style=\"padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;color:#6b7280;\">").append(i++).append("</td>");
                    table.append("<td style=\"padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;color:#374151;\">").append(expense.getName()).append("</td>");
                    table.append("<td style=\"padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;color:#374151;text-align:right;\">").append(expense.getAmount()).append("</td>");
                    table.append("<td style=\"padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;color:#374151;\">").append(expense.getCategoryId() != null ? expense.getCategoryName() : "Không có").append("</td>");
                    table.append("</tr>");
                }
                table.append("</table>");
                String htmlBody = mailTemplateService.buildDailyExpenseSummaryEmail(profile.getFullName(), table.toString());
                emailService.sendHtmlEmail(profile.getEmail(), "[Money Manager] Tổng hợp chi tiêu hằng ngày", htmlBody);
            }
        }
        log.info("Job completed: sendDailyExpenseSummary()");
    }

    // ─── Scheduled: Monthly Report Card Notification ─────────────────

    @Scheduled(cron = "0 0 8 1 * *", zone = "Asia/Kolkata")
    public void sendMonthlyReportCardNotification() {
        log.info("Job started: sendMonthlyReportCardNotification()");
        List<ProfileEntity> profiles = profileRepository.findAll();
        LocalDate now = LocalDate.now();
        // Previous month
        YearMonth prevMonth = YearMonth.from(now).minusMonths(1);

        for (ProfileEntity profile : profiles) {
            try {
                MonthlyReportCardDTO report = monthlyReportCardService.getReportCard(prevMonth.getYear(), prevMonth.getMonthValue());
                String title = "📊 Bảng điểm tháng " + prevMonth.getMonthValue() + "/" + prevMonth.getYear();
                String message = String.format(
                        "Điểm %s (%s) | Thu nhập: %s | Chi tiêu: %s | Tiết kiệm: %s (%.1f%%)",
                        report.getGrade(),
                        report.getGradeLabel(),
                        NumberFormat.getInstance(new Locale("vi", "VN")).format(report.getTotalIncome()),
                        NumberFormat.getInstance(new Locale("vi", "VN")).format(report.getTotalExpense()),
                        NumberFormat.getInstance(new Locale("vi", "VN")).format(report.getSavings()),
                        report.getSavingsRate()
                );
                createNotification(profile, title, message, NotificationType.MONTHLY_REPORT);
            } catch (Exception e) {
                log.error("Error sending monthly report for user {}: {}", profile.getId(), e.getMessage());
            }
        }
        log.info("Job completed: sendMonthlyReportCardNotification()");
    }

    // ─── Scheduled: Daily Saving Streak Reminder ─────────────────────

    @Scheduled(cron = "0 0 21 * * *", zone = "Asia/Kolkata")
    public void sendDailySavingStreakReminder() {
        log.info("Job started: sendDailySavingStreakReminder()");
        List<ProfileEntity> profiles = profileRepository.findAll();
        LocalDate today = LocalDate.now();

        for (ProfileEntity profile : profiles) {
            try {
                // Check if already sent today
                boolean alreadySent = notificationRepository.findByProfileIdAndTypeAndCreatedAtAfter(
                        profile.getId(), NotificationType.SAVING_STREAK, today.atStartOfDay()
                ).size() > 0;
                if (alreadySent) continue;

                // Count consecutive days with transactions
                int streak = 0;
                LocalDate checkDate = today.minusDays(1); // start from yesterday
                while (true) {
                    boolean hasExpense = !expenseRepository.findByProfileIdAndDate(profile.getId(), checkDate).isEmpty();
                    boolean hasIncome = !incomeRepository.findByProfileIdAndDate(profile.getId(), checkDate).isEmpty();

                    if (hasExpense || hasIncome) {
                        streak++;
                        checkDate = checkDate.minusDays(1);
                    } else {
                        break;
                    }
                }

                if (streak >= 2) {
                    String message = String.format(
                            "Bạn đã có chuỗi %d ngày liên tiếp theo dõi tài chính! Hãy tiếp tục duy trì nhé! 💪",
                            streak);
                    createNotification(profile, "🔥 Chuỗi ngày theo dõi", message, NotificationType.SAVING_STREAK);
                }
            } catch (Exception e) {
                log.error("Error checking streak for user {}: {}", profile.getId(), e.getMessage());
            }
        }
        log.info("Job completed: sendDailySavingStreakReminder()");
    }

    // ─── Group Budget Notifications ─────────────────────

    @Transactional
    public void notifyGroupExpenseAdded(ProfileEntity profile, String groupName, String expenseName, BigDecimal amount) {
        String formattedAmount = NumberFormat.getInstance(new Locale("vi", "VN")).format(amount);
        String message = String.format("Khoản chi mới '%s' (%s VNĐ) vừa được thêm vào nhóm '%s'.", expenseName, formattedAmount, groupName);
        createNotification(profile, "Chi tiêu nhóm mới", message, NotificationType.GROUP_EXPENSE);
    }

    @Transactional
    public void notifyGroupSettlement(ProfileEntity profile, String groupName, String payerName, BigDecimal amount) {
        String formattedAmount = NumberFormat.getInstance(new Locale("vi", "VN")).format(amount);
        String message = String.format("%s vừa thanh toán khoản nợ %s VNĐ trong nhóm '%s'.", payerName, formattedAmount, groupName);
        createNotification(profile, "Thanh toán trong nhóm", message, NotificationType.GROUP_SETTLEMENT);
    }
}
