package com.example.moneymanager.repository;

import com.example.moneymanager.entity.NotificationEntity;
import com.example.moneymanager.entity.NotificationType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByProfileIdOrProfileIsNullOrderByCreatedAtDesc(Long profileId);
    
    @Query("SELECT n FROM NotificationEntity n WHERE (n.profile.id = :profileId OR n.profile IS NULL) ORDER BY n.createdAt DESC")
    List<NotificationEntity> findTopNByProfileIdOrProfileIsNullOrderByCreatedAtDesc(@Param("profileId") Long profileId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.profile.id = :profileId AND (n.isRead IS NULL OR n.isRead = false)")
    long countUnreadByProfileId(@Param("profileId") Long profileId);

    // Get all broadcast notifications
    List<NotificationEntity> findByProfileIsNullOrderByCreatedAtDesc();

    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.profile IS NULL AND NOT EXISTS (SELECT r FROM NotificationReadEntity r WHERE r.notification = n AND r.profile.id = :profileId)")
    long countUnreadBroadcastsForProfile(@Param("profileId") Long profileId);

    @Query("SELECT n FROM NotificationEntity n WHERE n.profile IS NULL AND NOT EXISTS (SELECT r FROM NotificationReadEntity r WHERE r.notification = n AND r.profile.id = :profileId)")
    List<NotificationEntity> findUnreadBroadcastsForProfile(@Param("profileId") Long profileId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.isRead = true WHERE n.profile.id = :profileId AND (n.isRead = false OR n.isRead IS NULL)")
    void markAllPersonalAsRead(@Param("profileId") Long profileId);

    // Find notifications by profile, type, and created after a specific time (for duplicate check)
    List<NotificationEntity> findByProfileIdAndTypeAndCreatedAtAfter(Long profileId, NotificationType type, LocalDateTime after);

    void deleteByProfileId(Long profileId);
}
