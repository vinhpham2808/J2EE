package com.example.moneymanager.repository;

import com.example.moneymanager.entity.EmailNotificationPreferenceEntity;
import com.example.moneymanager.entity.EmailNotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailNotificationPreferenceRepository
    extends JpaRepository<EmailNotificationPreferenceEntity, Long> {

    @Query("SELECT e FROM EmailNotificationPreferenceEntity e WHERE e.profile.id = :profileId")
    List<EmailNotificationPreferenceEntity> findByProfileId(@Param("profileId") Long profileId);

    @Query("SELECT e FROM EmailNotificationPreferenceEntity e WHERE e.profile.id = :profileId AND e.type = :type")
    Optional<EmailNotificationPreferenceEntity> findByProfileIdAndType(
        @Param("profileId") Long profileId,
        @Param("type") EmailNotificationType type
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailNotificationPreferenceEntity e WHERE e.profile.id = :profileId")
    void deleteByProfileId(@Param("profileId") Long profileId);
}
