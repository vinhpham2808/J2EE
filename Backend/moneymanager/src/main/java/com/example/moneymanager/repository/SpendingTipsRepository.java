package com.example.moneymanager.repository;

import com.example.moneymanager.entity.SpendingTipEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpendingTipsRepository extends JpaRepository<SpendingTipEntity, Long> {
    Optional<SpendingTipEntity> findTopByProfileIdOrderByGeneratedAtDesc(Long profileId);
}
