package com.example.moneymanager.service;

import com.example.moneymanager.dto.EmailNotificationPreferenceDTO;
import com.example.moneymanager.entity.EmailNotificationPreferenceEntity;
import com.example.moneymanager.entity.EmailNotificationType;
import com.example.moneymanager.entity.ProfileEntity;
import com.example.moneymanager.repository.EmailNotificationPreferenceRepository;
import com.example.moneymanager.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationPreferenceService {

    private final EmailNotificationPreferenceRepository repository;
    private final ProfileRepository profileRepository;

    @Transactional
    public void initializeDefaultPreferences(Long profileId) {
        ProfileEntity profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new RuntimeException("Profile not found: " + profileId));

        List<EmailNotificationPreferenceEntity> preferences = new ArrayList<>();
        for (EmailNotificationType type : EmailNotificationType.values()) {
            preferences.add(EmailNotificationPreferenceEntity.builder()
                .profile(profile)
                .type(type)
                .isEnabled(type.getDefaultEnabled())
                .build());
        }
        repository.saveAll(preferences);
        log.info("Initialized default email preferences for profile: {}", profileId);
    }

    @Transactional
    public List<EmailNotificationPreferenceDTO> getUserPreferences(Long profileId) {
        List<EmailNotificationPreferenceEntity> entities = repository.findByProfileId(profileId);
        if (entities.isEmpty()) {
            initializeDefaultPreferences(profileId);
            entities = repository.findByProfileId(profileId);
        } else {
            // Add records for any enum types added after this user was first initialized
            Set<EmailNotificationType> existing = entities.stream()
                .map(EmailNotificationPreferenceEntity::getType)
                .collect(Collectors.toSet());
            List<EmailNotificationType> missing = Arrays.stream(EmailNotificationType.values())
                .filter(t -> !existing.contains(t))
                .collect(Collectors.toList());
            if (!missing.isEmpty()) {
                ProfileEntity profile = profileRepository.findById(profileId)
                    .orElseThrow(() -> new RuntimeException("Profile not found: " + profileId));
                List<EmailNotificationPreferenceEntity> newPrefs = missing.stream()
                    .map(type -> EmailNotificationPreferenceEntity.builder()
                        .profile(profile)
                        .type(type)
                        .isEnabled(type.getDefaultEnabled())
                        .build())
                    .collect(Collectors.toList());
                repository.saveAll(newPrefs);
                entities = repository.findByProfileId(profileId);
            }
        }
        return entities.stream()
            .map(EmailNotificationPreferenceDTO::fromEntity)
            .sorted(Comparator.comparing(EmailNotificationPreferenceDTO::getIsCritical).reversed())
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isNotificationEnabled(Long profileId, EmailNotificationType type) {
        return repository.findByProfileIdAndType(profileId, type)
            .map(pref -> Boolean.TRUE.equals(pref.getIsEnabled()))
            .orElse(type.isCritical());
    }

    @Transactional
    public void updatePreferences(Long profileId, List<EmailNotificationPreferenceDTO> updates) {
        ProfileEntity profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new RuntimeException("Profile not found: " + profileId));
        for (EmailNotificationPreferenceDTO dto : updates) {
            EmailNotificationType type = EmailNotificationType.valueOf(dto.getType());
            if (type.isCritical() && Boolean.FALSE.equals(dto.getIsEnabled())) {
                log.warn("Attempt to disable critical email type {} for profile {}", type, profileId);
                continue;
            }
            // Upsert: update existing record or create a new one if missing
            EmailNotificationPreferenceEntity preference = repository
                .findByProfileIdAndType(profileId, type)
                .orElseGet(() -> EmailNotificationPreferenceEntity.builder()
                    .profile(profile)
                    .type(type)
                    .build());
            preference.setIsEnabled(dto.getIsEnabled());
            repository.save(preference);
        }
        log.info("Updated email preferences for profile: {}", profileId);
    }

    @Transactional
    public void resetToDefaults(Long profileId) {
        repository.deleteByProfileId(profileId);
        initializeDefaultPreferences(profileId);
        log.info("Reset email preferences to defaults for profile: {}", profileId);
    }

    @Transactional
    public void deletePreferences(Long profileId) {
        repository.deleteByProfileId(profileId);
        log.info("Deleted email preferences for profile: {}", profileId);
    }
}
