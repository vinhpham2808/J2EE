# GitHub Copilot Instructions - Money Manager Project

This document provides GitHub Copilot with comprehensive project-specific guidance to ensure accurate, consistent, and secure code suggestions across the Money Manager codebase.

---

## 1. Project Overview

**Money Manager** is a full-stack financial management application with three subscription tiers (FREE, BASIC, PREMIUM). The application enables users to track expenses and income, manage budgets, set saving goals, and generate financial reports.

### Key Characteristics
- **Multi-platform**: Web (React), Mobile (React Native), Backend (Spring Boot)
- **Subscription-based**: Three-tier pricing model with feature restrictions
- **Financial focus**: Expense tracking, budgeting, reporting, AI-powered receipt analysis
- **Real-time**: Dashboard with live analytics and notifications

---

## 2. Technology Stack

### Backend
- **Framework**: Spring Boot 4.0.3
- **Language**: Java 21
- **Build Tool**: Maven
- **Database**: MySQL with JPA/Hibernate ORM
- **Authentication**: JWT (JSON Web Tokens) with Spring Security
- **External APIs**: PayOS (payments), Google Gemini API (AI)
- **Utilities**: Apache POI (Excel), Spring Mail (email)

### Frontend (Web)
- **Framework**: React 19
- **Build Tool**: Vite
- **CSS**: Tailwind CSS 4.x
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Notifications**: react-hot-toast
- **UI Components**: Custom components with emoji support

### Mobile
- **Framework**: React Native 0.79
- **Platform**: Expo 53
- **Navigation**: React Navigation (bottom tabs + native stack)
- **Storage**: AsyncStorage for offline-first data persistence
- **HTTP Client**: Axios
- **Build Targets**: Android, iOS, Web (experimental)

---

## 3. Critical Architectural Rules

### ⚠️ Subscription Plan Enforcement (MOST IMPORTANT)

**RULE: Backend MUST enforce plan restrictions. Frontend checks are UX only.**

```
Frontend Role: Hide restricted features (UX/usability)
Backend Role: ENFORCE restrictions on every API call (SECURITY)
Never trust frontend validation alone
```

#### Enforcement Points (Backend Service Layer)
1. **CategoryService.create()** → Validate category count:
   - FREE: max 10 categories
   - BASIC: max 30 categories
   - PREMIUM: unlimited

2. **ExpenseService.create() / IncomeService.create()** → Validate monthly transactions:
   - FREE: max 100/month
   - BASIC: max 1,000/month
   - PREMIUM: unlimited

3. **ExcelService.generateReport()** → Require BASIC or PREMIUM

4. **EmailService.sendReport()** → Require BASIC or PREMIUM

5. **FilterController.getTransactions()** → Restrict date range queries:
   - FREE: 3 months only
   - BASIC: 12 months
   - PREMIUM: unlimited

#### Expected Error Responses
```json
Status: 403 Forbidden
{
  "success": false,
  "message": "Feature requires BASIC plan or higher",
  "code": "SUBSCRIPTION_REQUIRED",
  "timestamp": "2026-05-06T10:30:00Z"
}
```

---

## 4. Data Model & Key Entities

### ProfileEntity (Central User Entity)
```java
- id: UUID/Long
- username: String (unique)
- email: String (unique, for authentication)
- password: String (hashed with BCrypt)
- subscriptionPlan: ENUM (FREE, BASIC, PREMIUM)
- subscriptionStatus: ENUM (active, expired, cancelled)
- subscriptionActivatedAt: LocalDateTime
- subscriptionExpiresAt: LocalDateTime
- autoRenew: Boolean (for recurring subscriptions)
- profilePhoto: String/URL (optional)
- fullName: String
- createdAt: LocalDateTime
- updatedAt: LocalDateTime
```

### Transaction Entities
**ExpenseEntity**
```java
- id: Long/UUID
- profileId: FK to ProfileEntity
- categoryId: FK to CategoryEntity
- amount: BigDecimal
- description: String
- date: LocalDate
- receipt: String/URL (optional, for receipt analysis)
- createdAt: LocalDateTime
```

**IncomeEntity**
```java
- id: Long/UUID
- profileId: FK to ProfileEntity
- categoryId: FK to CategoryEntity
- amount: BigDecimal
- description: String
- date: LocalDate
- source: String (optional)
- createdAt: LocalDateTime
```

### Supporting Entities
- **CategoryEntity**: User-defined expense/income categories with icon, color
- **BudgetEntity**: Monthly budget allocation per category
- **SavingGoalEntity**: Saving goals with target amount and date
- **SavingGoalContributionEntity**: Individual contributions to goals
- **PaymentEntity**: PayOS payment records for subscription transactions
- **NotificationEntity**: User notifications (transaction alerts, budget warnings)
- **NotificationReadEntity**: Tracks which notifications user has read
- **RoleEntity**: User roles (USER, ADMIN)

### Key Relationships
```
ProfileEntity (1) ──── (Many) CategoryEntity
ProfileEntity (1) ──── (Many) ExpenseEntity
ProfileEntity (1) ──── (Many) IncomeEntity
ProfileEntity (1) ──── (Many) BudgetEntity
ProfileEntity (1) ──── (Many) SavingGoalEntity
ProfileEntity (1) ──── (Many) PaymentEntity
ProfileEntity (1) ──── (Many) NotificationEntity

SavingGoalEntity (1) ──── (Many) SavingGoalContributionEntity
NotificationEntity (1) ──── (Many) NotificationReadEntity
ProfileEntity (Many) ──── (Many) RoleEntity
```

---

## 5. Subscription Tiers Reference

| Feature | FREE | BASIC | PREMIUM |
|---------|------|-------|---------|
| **Categories** | 10 | 30 | Unlimited |
| **Monthly Transactions** | 100 | 1,000 | Unlimited |
| **History Depth** | 3 months | 12 months | Unlimited |
| **Excel Export** | ❌ | ✅ | ✅ |
| **Email Reports** | ❌ | ✅ | ✅ |
| **Receipt Analysis** | ✅ (limited) | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ✅ | ✅ |
| **API Access** | Rate limited | Standard | Premium |

---

## 6. Code Generation Guidelines

### Backend (Java/Spring Boot) ✅ DO

1. **Always validate at service layer**
   ```java
   if (!userService.hasPlan(userId, "BASIC")) {
       throw new SubscriptionLimitException("BASIC plan required");
   }
   ```

2. **Use DTOs for API responses**
   ```java
   @PostMapping("/expenses")
   public ResponseEntity<ApiResponse<ExpenseDTO>> create(@RequestBody ExpenseDTO dto) {
       // Return DTO, not Entity
   }
   ```

3. **Include error handling**
   ```java
   try {
       // business logic
   } catch (SubscriptionLimitException e) {
       return ResponseEntity.status(403).body(errorResponse);
   } catch (Exception e) {
       return ResponseEntity.status(400).body(errorResponse);
   }
   ```

4. **Validate inputs early**
   ```java
   @PostMapping("/categories")
   public ResponseEntity<?> create(@Valid @RequestBody CategoryDTO dto) {
       // @Valid annotation triggers validation
   }
   ```

5. **Use explicit types (generics)**
   ```java
   List<ExpenseEntity> expenses = repository.findByProfileId(profileId);
   Map<LocalDate, BigDecimal> aggregated = new HashMap<>();
   ```

### Backend ❌ DON'T

- ❌ Skip error handling
- ❌ Return Entity directly (always use DTO)
- ❌ Forget subscription checks
- ❌ Use raw types (use generics)
- ❌ Log sensitive data (passwords, tokens, credit cards)
- ❌ Hardcode API keys or secrets

### Frontend (React) ✅ DO

1. **Check subscription before rendering**
   ```jsx
   function ExcelExportButton() {
       const { subscriptionPlan } = useContext(AppContext);
       if (subscriptionPlan === "FREE") {
           return <LockedFeature message="Available in BASIC plan" />;
       }
       return <button onClick={handleExport}>Export</button>;
   }
   ```

2. **Handle loading and error states**
   ```jsx
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   
   const handleSubmit = async () => {
       setLoading(true);
       try {
           const response = await apiClient.post('/api/expenses', data);
           // success handling
       } catch (err) {
           setError(err.response?.data?.message || "Error occurred");
       } finally {
           setLoading(false);
       }
   };
   ```

3. **Memoize expensive computations**
   ```jsx
   const totalExpenses = useMemo(() => {
       return expenses.reduce((sum, exp) => sum + exp.amount, 0);
   }, [expenses]);
   ```

4. **Debounce user input**
   ```jsx
   const debouncedSearch = useCallback(
       debounce((query) => handleSearch(query), 300),
       []
   );
   ```

5. **Use React Context properly**
   ```jsx
   const { user, subscriptionPlan, updateUser } = useContext(AppContext);
   ```

### Frontend ❌ DON'T

- ❌ Use `any` type
- ❌ Skip error handling
- ❌ Trust frontend-only validation for security
- ❌ Ignore loading states
- ❌ Make uncontrolled API calls

### Mobile (React Native) ✅ DO

1. **Check network connectivity**
   ```javascript
   const isOnline = useNetworkState().isConnected;
   if (!isOnline) {
       // Save to AsyncStorage, queue for sync
   }
   ```

2. **Use AsyncStorage for offline persistence**
   ```javascript
   const saveExpense = async (expense) => {
       const stored = await AsyncStorage.getItem('pendingExpenses');
       const pending = stored ? JSON.parse(stored) : [];
       pending.push({ ...expense, synced: false });
       await AsyncStorage.setItem('pendingExpenses', JSON.stringify(pending));
   };
   ```

3. **Implement proper error boundaries**
   ```javascript
   <ErrorBoundary fallback={<ErrorScreen />}>
       <TransactionScreen />
   </ErrorBoundary>
   ```

4. **Handle sync conflicts**
   ```javascript
   // Merge local changes with server state
   const syncExpenses = async () => {
       const local = await AsyncStorage.getItem('pendingExpenses');
       const server = await apiClient.get('/api/expenses');
       // Implement conflict resolution strategy
   };
   ```

### Mobile ❌ DON'T

- ❌ Assume network always available
- ❌ Lose data on app close
- ❌ Make blocking API calls
- ❌ Skip error boundaries
- ❌ Ignore sync conflicts

---

## 7. Project File Structure

### Backend (Spring Boot)
```
Backend/moneymanager/
├── src/main/java/com/example/moneymanager/
│   ├── controller/          # REST endpoints
│   │   ├── ExpenseController.java
│   │   ├── IncomeController.java
│   │   ├── CategoryController.java
│   │   ├── PaymentController.java
│   │   ├── ExcelController.java
│   │   └── ...
│   ├── service/            # Business logic with plan enforcement
│   │   ├── ExpenseService.java
│   │   ├── IncomeService.java
│   │   ├── CategoryService.java (enforces category limits)
│   │   ├── ExcelService.java (BASIC+ only)
│   │   ├── EmailService.java (BASIC+ only)
│   │   └── ...
│   ├── repository/         # JPA repositories
│   │   ├── ProfileRepository.java
│   │   ├── ExpenseRepository.java
│   │   ├── IncomeRepository.java
│   │   └── ...
│   ├── entity/            # JPA entities
│   │   ├── ProfileEntity.java (central user entity)
│   │   ├── ExpenseEntity.java
│   │   ├── IncomeEntity.java
│   │   └── ...
│   ├── dto/               # API data transfer objects
│   │   ├── ExpenseDTO.java
│   │   ├── CategoryDTO.java
│   │   └── ...
│   ├── security/          # JWT and Spring Security
│   │   ├── JwtRequestFilter.java
│   │   └── SecurityConfig.java
│   ├── config/            # Configuration beans
│   │   ├── PayOSConfig.java
│   │   ├── GeminiConfig.java
│   │   └── JacksonConfig.java
│   └── exception/         # Custom exceptions
│       ├── SubscriptionLimitException.java
│       └── ...
├── pom.xml               # Maven configuration
└── src/main/resources/
    └── application.properties  # Spring Boot configuration
```

### Frontend (React + Vite)
```
Frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Dashboard.jsx (main dashboard)
│   │   ├── TransactionList.jsx
│   │   ├── BudgetForm.jsx
│   │   ├── CategorySelector.jsx
│   │   └── ...
│   ├── pages/            # Full page components
│   │   ├── Home.jsx
│   │   ├── Expense.jsx
│   │   ├── Income.jsx
│   │   ├── Category.jsx
│   │   ├── Budget.jsx
│   │   ├── SavingGoals.jsx
│   │   ├── Payment.jsx (subscription upgrade)
│   │   ├── Profile.jsx
│   │   └── ...
│   ├── context/          # React Context
│   │   ├── AppContext.jsx (global state: user, subscription)
│   │   └── ThemeContext.jsx (dark/light mode)
│   ├── hooks/            # Custom React hooks
│   │   ├── useUser.jsx
│   │   └── ...
│   ├── util/             # Utility functions and configuration
│   │   ├── apiEndpoints.js (API URLs)
│   │   ├── paymentPlans.js (subscription tier data)
│   │   ├── axiosConfig.jsx (Axios instance)
│   │   ├── helper.js
│   │   └── ...
│   ├── services/         # API client functions
│   │   ├── expenseService.js
│   │   ├── categoryService.js
│   │   └── ...
│   ├── assets/           # Images, logos, static files
│   └── App.jsx           # Root component
├── index.html
├── package.json          # React 19, Vite, Tailwind
├── vite.config.js
├── tailwind.config.js
└── eslint.config.js
```

### Mobile (React Native + Expo)
```
Mobile/
├── src/
│   ├── screens/          # Full screen components
│   │   ├── DashboardScreen.js
│   │   ├── ExpenseScreen.js
│   │   ├── IncomeScreen.js
│   │   ├── CategoryScreen.js
│   │   ├── PaymentScreen.js
│   │   └── ...
│   ├── components/       # Reusable UI components
│   │   ├── TransactionList.js
│   │   ├── CategoryPicker.js
│   │   └── ...
│   ├── services/         # API and business logic
│   │   ├── api.js (Axios with JWT)
│   │   ├── expenseService.js
│   │   └── ...
│   ├── storage/          # AsyncStorage utilities
│   │   ├── transactionStorage.js
│   │   ├── userStorage.js
│   │   └── ...
│   ├── context/          # React Context
│   │   └── AppContext.js
│   ├── navigation/       # Navigation configuration
│   │   └── RootStack.js
│   └── utils/            # Helper functions
├── app.json              # Expo configuration
├── babel.config.js
├── index.js
└── package.json          # React Native 0.79, Expo 53
```

---

## 8. External Integrations

### PayOS Payment Processing
- **Service**: `PaymentService`, `PaymentController`
- **Endpoints**:
  - `POST /api/payment/create-link` → Generate payment checkout
  - `POST /api/payment/webhook` → Handle payment confirmation
  - `GET /api/payment/status` → Check payment status
- **Key Actions**:
  - Verify webhook signature before processing
  - Update `ProfileEntity.subscriptionPlan` on success
  - Store transaction in `PaymentEntity`
  - Send confirmation email
- **Error Handling**: Return clear error messages, retry logic for transient failures

### Google Gemini API (Receipt Analysis)
- **Service**: `ReceiptAnalysisService`
- **Called From**: `ExpenseService.createFromReceipt()`
- **Task**: Extract merchant, amount, date, category from receipt images
- **Handling**:
  - Implement exponential backoff for rate limiting
  - Fallback to manual entry if API fails
  - Cache API responses
  - Consider restricting to BASIC+ tiers
- **Configuration**: Store API key in `application.properties` via environment variable

### MySQL & JPA/Hibernate
- **Connection Pool**: HikariCP (configured in Spring Boot)
- **Query Optimization**:
  - Index on `profile_id`, `transaction_date`, `category_id`
  - Use JPA projections for read-heavy queries
  - Implement pagination (default 20-50 items/page)
- **Data Maintenance**:
  - Soft deletes for audit trails
  - Archive old transactions for FREE tier (enforce history limit)
  - Cleanup old notifications periodically

---

## 9. Security & Best Practices

### Authentication & Authorization
- ✅ JWT tokens for stateless authentication
- ✅ Token includes `userId`, `subscriptionPlan`, `expirationTime`
- ✅ Validate JWT on every protected endpoint
- ✅ Use BCrypt for password hashing
- ✅ HTTP-only cookies or secure localStorage for token storage
- ✅ Refresh tokens for long sessions

### Input Validation & Sanitization
- ✅ Validate all inputs at controller level
- ✅ Use `@Valid` annotation with DTOs
- ✅ Sanitize user-provided strings (prevent XSS/injection)
- ✅ Check subscription status on every protected operation
- ✅ Return HTTP 403 for plan violations

### API Security
- ✅ Use HTTPS only in production
- ✅ Implement rate limiting (prevent brute force, DoS)
- ✅ CORS configuration for frontend origin
- ✅ API key management for external services
- ✅ Verify PayOS webhook signatures

### Data Protection
- ❌ Never log passwords, tokens, credit card numbers
- ❌ Never expose system internals in error messages
- ❌ Never hardcode secrets (use environment variables)
- ✅ Use parameterized queries (JPA handles this)
- ✅ Implement encryption for sensitive data at rest
- ✅ Use HTTPS for data in transit

---

## 10. Performance Optimization

### Backend
- Use database indexes on frequently queried columns
- Implement pagination for large result sets (100+ records)
- Cache subscription status during request processing
- Use JPA projections to avoid loading full entities
- Connection pooling (HikariCP)
- Query batching for bulk operations

### Frontend
- Lazy load pages with `React.lazy()` and `Suspense`
- Memoize expensive computations with `useMemo()`
- Use `React.memo()` for pure components
- Debounce search and filter inputs (300-500ms)
- Code splitting with React Router
- Optimize chart rendering with custom tooltips/legends

### Mobile
- Limit AsyncStorage to <10MB
- Implement virtualization for long lists (FlatList, SectionList)
- Batch API calls during sync
- Cache API responses locally
- Avoid blocking operations
- Monitor memory usage on low-end devices

---

## 11. Common Error Codes

| Code | HTTP Status | Meaning | Example |
|------|------------|---------|---------|
| `SUBSCRIPTION_REQUIRED` | 403 | Feature requires higher plan | Export to BASIC+ |
| `LIMIT_EXCEEDED` | 400 | Monthly/category limit reached | Too many transactions |
| `UNAUTHORIZED` | 401 | JWT invalid or expired | Token refresh needed |
| `INVALID_INPUT` | 400 | Validation failed | Missing required field |
| `PAYMENT_FAILED` | 400 | PayOS payment error | Payment declined |
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist | Category ID not found |
| `DUPLICATE_RESOURCE` | 409 | Unique constraint violation | Email already registered |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Database connection lost |

---

## 12. Testing Scenarios

When generating tests, ensure these scenarios work:

1. **FREE tier attempting premium feature** → HTTP 403 with "SUBSCRIPTION_REQUIRED"
2. **Monthly transaction limit exceeded** → HTTP 400 with "LIMIT_EXCEEDED"
3. **Expired subscription using premium feature** → HTTP 403 with renewal prompt
4. **Offline mobile edit then sync** → Handles conflicts, marks as synced
5. **Concurrent payment requests** → Prevents duplicate charges
6. **JWT token expiration** → Auto-refresh or redirect to login
7. **PayOS webhook with invalid signature** → Reject without processing
8. **Database query with 1000+ transactions** → Pagination works, <500ms response

---

## 13. Development Commands

```bash
# Backend
cd Backend/moneymanager
mvn clean install         # Build and run tests
mvn spring-boot:run      # Start development server (localhost:8080)
mvn test                 # Run test suite

# Frontend
cd Frontend
npm install              # Install dependencies
npm run dev             # Start Vite server (localhost:5173)
npm run build           # Production build
npm run lint            # Run ESLint
npm run preview         # Preview production build

# Mobile
cd Mobile
npm install             # Install dependencies
npm start               # Start Expo development server
npm run android         # Build and run on Android
npm run ios            # Build and run on iOS
npm run web            # Run web version (experimental)
```

---

## 14. When in Doubt

Consult these documentation files:
- **`.claude/rules/`** — Detailed Claude Code guidelines (local only)
- **`.copilot/rules/`** — Detailed Copilot rules (local only)
- **`CLAUDE.md`** — High-level Claude guidance (tracked)
- **`COPILOT.md`** — High-level Copilot guidance (tracked)

---

## 15. Final Reminders

🚨 **CRITICAL**: Subscription restrictions MUST be enforced at backend service layer, not frontend

✅ **Always**: Include error handling, validation, and meaningful error messages

✅ **Always**: Use explicit types and DTOs in backend code

✅ **Always**: Check subscription status before sensitive operations

✅ **Always**: Log security events (failed auth, plan violations)

❌ **Never**: Trust frontend validation alone

❌ **Never**: Hardcode secrets or API keys

❌ **Never**: Skip error handling

❌ **Never**: Return raw Entity objects in API responses

---

**Last Updated**: May 6, 2026  
**Maintained by**: Development Team  
**Version**: 1.0
