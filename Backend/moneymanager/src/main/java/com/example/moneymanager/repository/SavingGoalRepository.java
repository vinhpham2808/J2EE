package com.example.moneymanager.repository;

import com.example.moneymanager.entity.GoalStatus;
import com.example.moneymanager.entity.SavingGoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface SavingGoalRepository extends JpaRepository<SavingGoalEntity, Long> {

    List<SavingGoalEntity> findByProfileIdOrderByCreatedAtDesc(Long profileId);

    List<SavingGoalEntity> findByProfileIdAndStatus(Long profileId, GoalStatus status);

    long countByProfileIdAndStatus(Long profileId, GoalStatus status);

    @Query("SELECT COALESCE(SUM(g.currentAmount), 0) FROM SavingGoalEntity g WHERE g.profile.id = :profileId AND g.status = :status")
    BigDecimal sumCurrentAmountByProfileIdAndStatus(@Param("profileId") Long profileId, @Param("status") GoalStatus status);

    List<SavingGoalEntity> findByProfileId(Long profileId);

    void deleteByProfileId(Long profileId);
}
