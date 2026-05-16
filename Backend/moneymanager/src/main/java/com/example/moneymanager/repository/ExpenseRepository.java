package com.example.moneymanager.repository;

import com.example.moneymanager.entity.ExpenseEntity;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<ExpenseEntity, Long> {

    //select * from tbl_expenses where profile_id = ?1 order by date desc
    @EntityGraph(attributePaths = {"category"})
    List<ExpenseEntity> findByProfileIdOrderByDateDesc(Long profileId);

    //select * from tbl_expenses where profile_id = ?1 order by date desc limit 5
    @EntityGraph(attributePaths = {"category"})
    List<ExpenseEntity> findTop5ByProfileIdOrderByDateDesc(Long profileId);

    @Query("SELECT SUM(e.amount) FROM ExpenseEntity e WHERE e.profile.id = :profileId")
    BigDecimal findTotalExpenseByProfileId(@Param("profileId") Long profileId);

    //select * from tbl_expenses where profile_id = ?1 and date between ?2 and ?3 and name like %?4%
    @EntityGraph(attributePaths = {"category"})
    List<ExpenseEntity> findByProfileIdAndDateBetweenAndNameContainingIgnoreCase(
            Long profileId,
            LocalDate startDate,
            LocalDate endDate,
            String keyword,
            Sort sort
    );

    //select * from tbl_expenses where profile_id = ?1 and date between ?2 and ?3
    @EntityGraph(attributePaths = {"category"})
    List<ExpenseEntity> findByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    //select * from tbl_expenses where profile_id = ?1 and date = ?2
    List<ExpenseEntity> findByProfileIdAndDate(Long profileId, LocalDate date);

    long countByProfileId(Long profileId);

    long countByProfileIdAndDateBetween(Long profileId, LocalDate startDate, LocalDate endDate);

    // Xoá toàn bộ expense thuộc một danh mục (dùng khi xoá danh mục)
    void deleteByCategoryId(Long categoryId);

    void deleteByProfileId(Long profileId);
}
