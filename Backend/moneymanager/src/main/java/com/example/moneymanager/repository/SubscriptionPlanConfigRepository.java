package com.example.moneymanager.repository;

import com.example.moneymanager.entity.SubscriptionPlanConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanConfigRepository extends JpaRepository<SubscriptionPlanConfigEntity, Long> {
    List<SubscriptionPlanConfigEntity> findAllByOrderByDisplayOrderAscCreatedAtAsc();
    Optional<SubscriptionPlanConfigEntity> findByPlanId(String planId);
}
