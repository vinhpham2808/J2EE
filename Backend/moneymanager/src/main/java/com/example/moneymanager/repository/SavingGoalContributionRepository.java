package com.example.moneymanager.repository;

import com.example.moneymanager.entity.SavingGoalContributionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SavingGoalContributionRepository extends JpaRepository<SavingGoalContributionEntity, Long> {

    List<SavingGoalContributionEntity> findByGoalIdOrderByContributionDateDesc(Long goalId);

    List<SavingGoalContributionEntity> findByGoalIdAndContributionDateBetween(Long goalId, LocalDate start, LocalDate end);

    void deleteByGoalIdIn(List<Long> goalIds);
}
