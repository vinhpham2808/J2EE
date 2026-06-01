package com.example.moneymanager.repository;

import com.example.moneymanager.entity.SavingGoalContributionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface SavingGoalContributionRepository extends JpaRepository<SavingGoalContributionEntity, Long> {

    List<SavingGoalContributionEntity> findByGoalIdOrderByContributionDateDesc(Long goalId);

    List<SavingGoalContributionEntity> findByGoalIdAndContributionDateBetween(Long goalId, LocalDate start, LocalDate end);

    void deleteByGoalIdIn(List<Long> goalIds);

    /**
     * Batch query: trả về tập goal IDs (trong danh sách goalIds) có ít nhất 1 contribution
     * trong khoảng ngày [start, end]. Tránh N+1 khi kiểm tra từng goal một.
     */
    @Query("""
            SELECT DISTINCT c.goal.id
            FROM SavingGoalContributionEntity c
            WHERE c.goal.id IN :goalIds
              AND c.contributionDate BETWEEN :start AND :end
            """)
    Set<Long> findGoalIdsWithContributionsBetween(
            @Param("goalIds") List<Long> goalIds,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}
