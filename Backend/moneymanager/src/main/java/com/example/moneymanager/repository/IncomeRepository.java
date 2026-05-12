package com.example.moneymanager.repository;

import com.example.moneymanager.entity.IncomeEntity;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface IncomeRepository extends JpaRepository<IncomeEntity, Long> {

    @EntityGraph(attributePaths = {"category"})
    List<IncomeEntity> findByProfileIdOrderByDateDesc(Long profileId);

    @EntityGraph(attributePaths = {"category"})
    List<IncomeEntity> findTop5ByProfileIdOrderByDateDesc(Long profileId);

    @Query("SELECT SUM(i.amount) FROM IncomeEntity i WHERE i.profile.id = :profileId")
    BigDecimal findTotalIncomeByProfileId(@Param("profileId") Long profileId);

    @EntityGraph(attributePaths = {"category"})
    List<IncomeEntity> findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
            Long profileId,
            LocalDate startDate,
            LocalDate endDate,
            String keyword,
            Sort sort
    );

    @EntityGraph(attributePaths = {"category"})
    List<IncomeEntity> findByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    long countByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    List<IncomeEntity> findByProfileIdAndDate(Long profileId, LocalDate date);

    // Xoá toàn bộ income thuộc một danh mục (dùng khi xoá danh mục)
    void deleteByCategoryId(Long categoryId);

    void deleteByProfileId(Long profileId);
}
