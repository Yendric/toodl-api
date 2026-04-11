# Implementation Plan - Shopping List Feature

This plan outlines the steps to implement a specialized shopping list feature, including categories, stores, and customizable category ordering per store.

## Objective

- Support `SHOPPING` type lists.
- Enable `Todo` items to be assigned to categories.
- Allow users to create categories and stores.
- Allow users to define the order of categories per store for sorting/grouping.
- Create a default shopping list, store, and categories for new users.

## Key Files & Context

- `prisma/schema.prisma`: Database schema.
- `src/services/UserService.ts`: User creation logic (where defaults are set).
- `src/services/ListService.ts` & `src/controllers/list.ts`: List management.
- `src/services/TodoService.ts` & `src/controllers/todo.ts`: Todo/ShoppingItem management.
- `src/services/CategoryService.ts` & `src/controllers/category.ts`: (New) Category management.
- `src/services/StoreService.ts` & `src/controllers/store.ts`: (New) Store management.

## Implementation Steps

### 1. Database Schema Update

- Modify `prisma/schema.prisma`:
  - Add `enum ListType { REGULAR, SHOPPING }`.
  - Update `List` model: add `type ListType @default(REGULAR)`.
  - Update `Todo` model: add `categoryId Int?` and relation to `Category`.
  - Add `Category` model: `id`, `name`, `userId`, and relations.
  - Add `Store` model: `id`, `name`, `userId`, and relations.
  - Add `StoreCategoryOrder` model: `storeId`, `categoryId`, `position`, and relations.
  - Update `User` model: add relations to `Category` and `Store`.
- Run `npx prisma migrate dev --name add_shopping_list_feature`.

### 2. Update existing Services & Controllers

- **List**:
  - Update `ListRequest` and `ListResponse` interfaces in `src/controllers/list.ts` to include `type`.
  - Update `ListService.create` and `ListService.update` to handle `type`.
- **Todo**:
  - Update `TodoCreateRequest` and `TodoResponse` interfaces in `src/controllers/todo.ts` to include `categoryId`.
  - Update `TodoService.create` and `TodoService.update` to handle `categoryId`.

### 3. Create Category Service & Controller

- Implement `CategoryService` with CRUD operations.
- Implement `CategoryController` with `tsoa` annotations.
- Register the service in `src/ioc.ts`.

### 4. Create Store Service & Controller

- Implement `StoreService` with CRUD operations for stores.
- Implement logic to get and update `StoreCategoryOrder`.
- Implement `StoreController` with `tsoa` annotations.
- Register the service in `src/ioc.ts`.

### 5. Update User Service for Defaults

- In `UserService.createUserWithDefaults`:
  - Create a default "Supermarket" store.
  - Create default categories: "Groenten & Fruit", "Zuivel", "Bakkerij", "Dranken", "Vlees & Vis", "Diepvries", "Huishoudelijk".
  - Set default order for these categories in the "Supermarket" store.
  - Update the initial "Boodschappen" list to have `type: SHOPPING`.

### 6. (Optional/Enhanced) Sorting/Grouping

- Add an optional `storeId` parameter to `TodoController.index` (or a specific endpoint) to return items sorted by the store's category order.

## Verification & Testing

- Verify migrations run successfully.
- Test user registration to ensure default shopping list, store, and categories are created.
- Test CRUD operations for Categories and Stores.
- Test updating category order for a store.
- Test creating a `Todo` with a `categoryId` in a `SHOPPING` list.
- Add unit tests for `CategoryService` and `StoreService`.
- Add integration tests for the new endpoints.
