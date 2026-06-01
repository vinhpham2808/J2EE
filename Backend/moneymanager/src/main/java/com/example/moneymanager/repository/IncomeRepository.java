package com.example.moneymanager.repository;

import com.example.moneymanager.entity.IncomeEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface IncomeRepository extends JpaRepository<IncomeEntity, Long> {

    @EntityGraph(attributePaths = {"category", "allocations", "allocations.jar"})
    List<IncomeEntity> findByProfileIdOrderByDateDesc(Long profileId);

    @EntityGraph(attributePaths = {"category", "allocations", "allocations.jar"})
    Page<IncomeEntity> findByProfileIdOrderByDateDesc(Long profileId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "allocations", "allocations.jar"})
    List<IncomeEntity> findTop5ByProfileIdOrderByDateDesc(Long profileId);

    @Query("SELECT SUM(i.amount) FROM IncomeEntity i WHERE i.profile.id = :profileId")
    BigDecimal findTotalIncomeByProfileId(@Param("profileId") Long profileId);

    @Query("SELECT SUM(i.amount) FROM IncomeEntity i WHERE i.profile.id = :profileId AND i.date BETWEEN :startDate AND :endDate")
    BigDecimal findTotalIncomeByProfileIdAndDateBetween(@Param("profileId") Long profileId, 
                                                        @Param("startDate") LocalDate startDate, 
                                                        @Param("endDate") LocalDate endDate);

    @Query("SELECT MONTH(i.date), YEAR(i.date), SUM(i.amount) FROM IncomeEntity i " +
           "WHERE i.profile.id = :profileId AND i.date BETWEEN :startDate AND :endDate " +
           "GROUP BY MONTH(i.date), YEAR(i.date) ORDER BY YEAR(i.date), MONTH(i.date)")
    List<Object[]> findMonthlyIncomeTotals(@Param("profileId") Long profileId, 
                                           @Param("startDate") LocalDate startDate, 
                                           @Param("endDate") LocalDate endDate);

    @EntityGraph(attributePaths = {"category", "allocations", "allocations.jar"})
    List<IncomeEntity> findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
            Long profileId,
            LocalDate startDate,
            LocalDate endDate,
            String keyword,
            Sort sort
    );

    @EntityGraph(attributePaths = {"category", "allocations", "allocations.jar"})
    Page<IncomeEntity> findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
            Long profileId,
            LocalDate startDate,
            LocalDate endDate,
            String keyword,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"category", "allocations", "allocations.jar"})
    List<IncomeEntity> findByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    @EntityGraph(attributePaths = {"category", "allocations", "allocations.jar"})
    Page<IncomeEntity> findByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    long countByProfileId(Long profileId);

    long countByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    List<IncomeEntity> findByProfileIdAndDate(Long profileId, LocalDate date);

    // Xoá toàn bộ income thuộc một danh mục (dùng khi xoá danh mục)
    void deleteByCategoryId(Long categoryId);

    void deleteByProfileId(Long profileId);
}
