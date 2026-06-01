package com.example.moneymanager.service;

import com.example.moneymanager.dto.SubscriptionPlanConfigDTO;
import com.example.moneymanager.entity.SubscriptionPlanConfigEntity;
import com.example.moneymanager.repository.SubscriptionPlanConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanConfigService {

    private final SubscriptionPlanConfigRepository repository;

    /**
     * Lấy danh sách gói cước — cache 60 phút (gói cước rất ít thay đổi).
     * Cache key: "subscription-plans" (shared across all users).
     */
    @Cacheable(value = "subscriptionPlans", key = "'all'")
    public List<SubscriptionPlanConfigDTO> getAllPlans() {
        return repository.findAllByOrderByDisplayOrderAscCreatedAtAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "subscriptionPlans", allEntries = true)
    public SubscriptionPlanConfigDTO createPlan(SubscriptionPlanConfigDTO dto) {
        SubscriptionPlanConfigEntity entity = toEntity(dto);
        return toDTO(repository.save(entity));
    }

    @Transactional
    @CacheEvict(value = "subscriptionPlans", allEntries = true)
    public SubscriptionPlanConfigDTO updatePlan(Long id, SubscriptionPlanConfigDTO dto) {
        SubscriptionPlanConfigEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói thanh toán."));
        entity.setPlanId(dto.getPlanId());
        entity.setDisplayName(dto.getDisplayName());
        entity.setDescription(dto.getDescription());
        entity.setAmount(dto.getAmount());
        entity.setSubscriptionPlan(dto.getSubscriptionPlan());
        entity.setCycleLabel(dto.getCycleLabel());
        entity.setCycleMonths(dto.getCycleMonths());
        entity.setBadge(dto.getBadge());
        entity.setIcon(dto.getIcon());
        entity.setAccent(dto.getAccent());
        entity.setFeaturesRaw(joinFeatures(dto.getFeatures()));
        entity.setDisplayOrder(dto.getDisplayOrder());
        return toDTO(repository.save(entity));
    }

    @Transactional
    @CacheEvict(value = "subscriptionPlans", allEntries = true)
    public void deletePlan(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy gói thanh toán.");
        }
        repository.deleteById(id);
    }

    /**
     * Tra cứu gói theo planId để dùng trong PaymentService / SubscriptionService.
     * Nếu không tìm thấy trong DB, trả về null (caller tự xử lý fallback).
     */
    public SubscriptionPlanConfigDTO getPlanByPlanId(String planId) {
        return repository.findByPlanId(planId)
                .map(this::toDTO)
                .orElse(null);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private SubscriptionPlanConfigDTO toDTO(SubscriptionPlanConfigEntity entity) {
        return SubscriptionPlanConfigDTO.builder()
                .id(entity.getId())
                .planId(entity.getPlanId())
                .displayName(entity.getDisplayName())
                .description(entity.getDescription())
                .amount(entity.getAmount())
                .subscriptionPlan(entity.getSubscriptionPlan())
                .cycleLabel(entity.getCycleLabel())
                .cycleMonths(entity.getCycleMonths())
                .badge(entity.getBadge())
                .icon(entity.getIcon())
                .accent(entity.getAccent())
                .features(splitFeatures(entity.getFeaturesRaw()))
                .displayOrder(entity.getDisplayOrder())
                .build();
    }

    private SubscriptionPlanConfigEntity toEntity(SubscriptionPlanConfigDTO dto) {
        return SubscriptionPlanConfigEntity.builder()
                .planId(dto.getPlanId())
                .displayName(dto.getDisplayName())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .subscriptionPlan(dto.getSubscriptionPlan())
                .cycleLabel(dto.getCycleLabel())
                .cycleMonths(dto.getCycleMonths())
                .badge(dto.getBadge())
                .icon(dto.getIcon())
                .accent(dto.getAccent())
                .featuresRaw(joinFeatures(dto.getFeatures()))
                .displayOrder(dto.getDisplayOrder())
                .build();
    }

    private List<String> splitFeatures(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String joinFeatures(List<String> features) {
        if (features == null) return "";
        return features.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining("\n"));
    }
}
