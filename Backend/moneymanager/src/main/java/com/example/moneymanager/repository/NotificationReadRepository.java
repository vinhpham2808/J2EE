package com.example.moneymanager.repository;

import com.example.moneymanager.entity.NotificationReadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
public interface NotificationReadRepository extends JpaRepository<NotificationReadEntity, Long> {
    boolean existsByNotificationIdAndProfileId(Long notificationId, Long profileId);
    void deleteByNotificationId(Long notificationId);
    void deleteByProfileId(Long profileId);

    @Query("SELECT r.notification.id FROM NotificationReadEntity r WHERE r.profile.id = :profileId")
    Set<Long> findReadNotificationIdsByProfileId(@Param("profileId") Long profileId);
}
