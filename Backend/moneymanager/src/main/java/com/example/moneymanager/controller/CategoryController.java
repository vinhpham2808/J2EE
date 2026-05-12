package com.example.moneymanager.controller;

import com.example.moneymanager.dto.CategoryDTO;
import com.example.moneymanager.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody CategoryDTO categoryDTO) {
        CategoryDTO savedCategory = categoryService.saveCategory(categoryDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getCurrentUserCategories() {
        return ResponseEntity.ok(categoryService.getCategoriesForCurrentUser());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<CategoryDTO>> getCurrentUserCategoriesByType(@PathVariable String type) {
        return ResponseEntity.ok(categoryService.getCategoriesByTypeForCurrentUser(type));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable Long categoryId,
            @RequestBody CategoryDTO categoryDTO
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(categoryId, categoryDTO));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
