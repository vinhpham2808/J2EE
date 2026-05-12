package com.example.moneymanager.service;

import com.example.moneymanager.dto.SavingGoalContributionDTO;
import com.example.moneymanager.dto.SavingGoalDTO;
import com.example.moneymanager.entity.*;
import com.example.moneymanager.repository.SavingGoalContributionRepository;
import com.example.moneymanager.repository.SavingGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SavingGoalService {

    private final SavingGoalRepository goalRepository;
    private final SavingGoalContributionRepository contributionRepository;
    private final ProfileService profileService;
    private final NotificationService notificationService;

    // ─── CREATE ──────────────────────────────────────────────────
    @Transactional
    public SavingGoalDTO createGoal(SavingGoalDTO dto) {
        ProfileEntity profile = profileService.getCurrentProfile();
        validateGoalInput(dto);

        BigDecimal monthlyTarget = computeMonthlyTarget(
                dto.getTargetAmount(),
                dto.getCurrentAmount() != null ? dto.getCurrentAmount() : BigDecimal.ZERO,
                dto.getStartDate(),
                dto.getTargetDate());

        SavingGoalEntity entity = SavingGoalEntity.builder()
                .name(dto.getName())
                .targetAmount(dto.getTargetAmount())
                .currentAmount(dto.getCurrentAmount() != null ? dto.getCurrentAmount() : BigDecimal.ZERO)
                .startDate(dto.getStartDate())
                .targetDate(dto.getTargetDate())
                .monthlyTarget(monthlyTarget)
                .status(GoalStatus.ACTIVE)
                .profile(profile)
                .build();

        entity = goalRepository.save(entity);
        return toDTO(entity);
    }

    // ─── READ ALL ────────────────────────────────────────────────
    public List<SavingGoalDTO> getAllGoals() {
        ProfileEntity profile = profileService.getCurrentProfile();
        return goalRepository.findByProfileIdOrderByCreatedAtDesc(profile.getId())
                .stream().map(this::toDTO).toList();
    }

    // ─── READ ONE ────────────────────────────────────────────────
    public SavingGoalDTO getGoalById(Long id) {
        SavingGoalEntity entity = findGoalForCurrentUser(id);
        return toDTO(entity);
    }

    // ─── UPDATE ──────────────────────────────────────────────────
    @Transactional
    public SavingGoalDTO updateGoal(Long id, SavingGoalDTO dto) {
        SavingGoalEntity entity = findGoalForCurrentUser(id);

        if (dto.getName() != null && !dto.getName().isBlank()) {
            entity.setName(dto.getName());
        }
        if (dto.getTargetAmount() != null && dto.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            entity.setTargetAmount(dto.getTargetAmount());
        }
        if (dto.getTargetDate() != null) {
            entity.setTargetDate(dto.getTargetDate());
        }

        entity.setMonthlyTarget(computeMonthlyTarget(
                entity.getTargetAmount(),
                entity.getCurrentAmount(),
                entity.getStartDate(),
                entity.getTargetDate()));

        // Auto-complete check
        if (entity.getCurrentAmount().compareTo(entity.getTargetAmount()) >= 0) {
            entity.setStatus(GoalStatus.COMPLETED);
        }

        entity = goalRepository.save(entity);
        return toDTO(entity);
    }

    // ─── DELETE (hard) ───────────────────────────────────────────
    @Transactional
    public void deleteGoal(Long id) {
        SavingGoalEntity entity = findGoalForCurrentUser(id);
        // Delete all contributions first
        contributionRepository.deleteAll(
                contributionRepository.findByGoalIdOrderByContributionDateDesc(entity.getId()));
        goalRepository.delete(entity);
    }

    // ─── ADD CONTRIBUTION ────────────────────────────────────────
    @Transactional
    public SavingGoalContributionDTO addContribution(Long goalId, SavingGoalContributionDTO dto) {
        SavingGoalEntity goal = findGoalForCurrentUser(goalId);

        if (goal.getStatus() != GoalStatus.ACTIVE) {
            throw new RuntimeException("Không thể đóng góp vào mục tiêu đã hoàn thành hoặc đã huỷ");
        }
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền đóng góp phải lớn hơn 0");
        }

        SavingGoalContributionEntity contribution = SavingGoalContributionEntity.builder()
                .amount(dto.getAmount())
                .contributionDate(dto.getContributionDate() != null ? dto.getContributionDate() : LocalDate.now())
                .note(dto.getNote())
                .goal(goal)
                .build();

        contribution = contributionRepository.save(contribution);

        // Update goal current amount
        goal.setCurrentAmount(goal.getCurrentAmount().add(dto.getAmount()));
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(GoalStatus.COMPLETED);
        }
        goalRepository.save(goal);

        // ─── Smart Notification: Goal Progress ──────────────────
        ProfileEntity profile = profileService.getCurrentProfile();
        notificationService.notifyGoalProgress(profile, goal.getName(),
                dto.getAmount(), goal.getCurrentAmount(), goal.getTargetAmount());

        return toContributionDTO(contribution);
    }

    // ─── GET CONTRIBUTIONS ───────────────────────────────────────
    public List<SavingGoalContributionDTO> getContributions(Long goalId) {
        findGoalForCurrentUser(goalId); // ownership check
        return contributionRepository.findByGoalIdOrderByContributionDateDesc(goalId)
                .stream().map(this::toContributionDTO).toList();
    }

    // ─── DASHBOARD SUMMARY ──────────────────────────────────────
    public Map<String, Object> getSavingGoalSummary() {
        ProfileEntity profile = profileService.getCurrentProfile();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("activeCount", goalRepository.countByProfileIdAndStatus(profile.getId(), GoalStatus.ACTIVE));
        summary.put("completedCount", goalRepository.countByProfileIdAndStatus(profile.getId(), GoalStatus.COMPLETED));
        BigDecimal totalSaved = goalRepository.sumCurrentAmountByProfileIdAndStatus(profile.getId(), GoalStatus.ACTIVE);
        summary.put("totalSaved", totalSaved != null ? totalSaved : BigDecimal.ZERO);
        return summary;
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    private SavingGoalEntity findGoalForCurrentUser(Long id) {
        ProfileEntity profile = profileService.getCurrentProfile();
        SavingGoalEntity entity = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục tiêu tiết kiệm"));
        if (!entity.getProfile().getId().equals(profile.getId())) {
            throw new RuntimeException("Không có quyền truy cập mục tiêu này");
        }
        return entity;
    }

    private void validateGoalInput(SavingGoalDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new RuntimeException("Tên mục tiêu không được để trống");
        }
        if (dto.getTargetAmount() == null || dto.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền mục tiêu phải lớn hơn 0");
        }
        if (dto.getCurrentAmount() != null && dto.getCurrentAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Số tiền hiện có không được âm");
        }
        if (dto.getCurrentAmount() != null && dto.getCurrentAmount().compareTo(dto.getTargetAmount()) > 0) {
            throw new RuntimeException("Số tiền hiện có không được lớn hơn số tiền mục tiêu");
        }
        if (dto.getStartDate() == null || dto.getTargetDate() == null) {
            throw new RuntimeException("Ngày bắt đầu và hạn chót không được để trống");
        }
        if (dto.getTargetDate().isBefore(dto.getStartDate())) {
            throw new RuntimeException("Hạn chót phải lớn hơn hoặc bằng ngày bắt đầu");
        }
    }

    private BigDecimal computeMonthlyTarget(BigDecimal targetAmount, BigDecimal currentAmount,
                                            LocalDate startDate, LocalDate targetDate) {
        BigDecimal remaining = targetAmount.subtract(currentAmount);
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        long totalMonths = ChronoUnit.MONTHS.between(startDate.withDayOfMonth(1), targetDate.withDayOfMonth(1));
        if (totalMonths <= 0) totalMonths = 1;
        return remaining.divide(BigDecimal.valueOf(totalMonths), 0, RoundingMode.CEILING);
    }

    private double computeProgressPercent(BigDecimal current, BigDecimal target) {
        if (target.compareTo(BigDecimal.ZERO) == 0) return 100.0;
        return current.multiply(BigDecimal.valueOf(100))
                .divide(target, 2, RoundingMode.HALF_UP).doubleValue();
    }

    private SavingGoalDTO toDTO(SavingGoalEntity entity) {
        BigDecimal remaining = entity.getTargetAmount().subtract(entity.getCurrentAmount());
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

        double progressPercent = computeProgressPercent(entity.getCurrentAmount(), entity.getTargetAmount());

        // Monthly progress
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());
        List<SavingGoalContributionEntity> monthContributions =
                contributionRepository.findByGoalIdAndContributionDateBetween(entity.getId(), monthStart, monthEnd);
        BigDecimal monthlyContributed = monthContributions.stream()
                .map(SavingGoalContributionEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double monthlyProgressPercent = entity.getMonthlyTarget().compareTo(BigDecimal.ZERO) > 0
                ? monthlyContributed.multiply(BigDecimal.valueOf(100))
                .divide(entity.getMonthlyTarget(), 2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        boolean isBehindSchedule = entity.getStatus() == GoalStatus.ACTIVE && monthlyProgressPercent < 100.0;

        return SavingGoalDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .targetAmount(entity.getTargetAmount())
                .currentAmount(entity.getCurrentAmount())
                .remainingAmount(remaining)
                .progressPercent(Math.min(progressPercent, 100.0))
                .monthlyTarget(entity.getMonthlyTarget())
                .monthlyContributed(monthlyContributed)
                .monthlyProgressPercent(monthlyProgressPercent)
                .isBehindSchedule(isBehindSchedule)
                .startDate(entity.getStartDate())
                .targetDate(entity.getTargetDate())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private SavingGoalContributionDTO toContributionDTO(SavingGoalContributionEntity entity) {
        return SavingGoalContributionDTO.builder()
                .id(entity.getId())
                .goalId(entity.getGoal().getId())
                .amount(entity.getAmount())
                .contributionDate(entity.getContributionDate())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
