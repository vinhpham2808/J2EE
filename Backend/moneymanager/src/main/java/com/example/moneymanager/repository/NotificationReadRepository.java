package com.example.moneymanager.repository;

import com.example.moneymanager.entity.NotificationReadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationReadRepository extends JpaRepository<NotificationReadEntity, Long> {
    boolean existsByNotificationIdAndProfileId(Long notificationId, Long profileId);
    void deleteByNotificationId(Long notificationId);
    void deleteByProfileId(Long profileId);
}
