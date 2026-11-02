-- =========================================================================
-- SHD OneERP Migration: 20261102_0017_EnhanceMasterDataItemsSchemaAndSp.sql
-- Description: Bổ sung UpdatedAtUtc, RowVersion, Check Constraints, Indexes
--              và Stored Procedures CQRS Read cho System_MasterDataItems
-- Module: SYSTEM / REFERENCE DATA (SYS-REF-02)
-- =========================================================================

SET NOCOUNT ON;

-- 1. Bổ sung cột UpdatedAtUtc vào System_MasterDataItems nếu chưa có
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'System_MasterDataItems' 
      AND COLUMN_NAME = 'UpdatedAtUtc'
)
BEGIN
    ALTER TABLE [dbo].[System_MasterDataItems]
    ADD [UpdatedAtUtc] DATETIME2(7) NULL;
    PRINT 'Đã thêm cột UpdatedAtUtc vào System_MasterDataItems.';
END
GO

-- 2. Bổ sung cột RowVersion vào System_MasterDataItems nếu chưa có
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'System_MasterDataItems' 
      AND COLUMN_NAME = 'RowVersion'
)
BEGIN
    ALTER TABLE [dbo].[System_MasterDataItems]
    ADD [RowVersion] ROWVERSION NOT NULL;
    PRINT 'Đã thêm cột RowVersion vào System_MasterDataItems.';
END
GO

-- 3. Ràng buộc Check không cho phép Item tự làm cha chính nó
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE [name] = 'CK_System_MasterDataItems_NoSelfParent' 
      AND [parent_object_id] = OBJECT_ID('dbo.System_MasterDataItems')
)
BEGIN
    ALTER TABLE [dbo].[System_MasterDataItems]
    ADD CONSTRAINT [CK_System_MasterDataItems_NoSelfParent] 
    CHECK ([ParentItemId] IS NULL OR [ParentItemId] <> [Id]);
    PRINT 'Đã thêm ràng buộc CK_System_MasterDataItems_NoSelfParent.';
END
GO

-- 4. Bổ sung Index tối ưu hóa truy vấn lọc và sắp xếp theo Catalog
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE [name] = 'IX_System_MasterDataItems_Catalog_IsActive_DisplayOrder' 
      AND [object_id] = OBJECT_ID('dbo.System_MasterDataItems')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_System_MasterDataItems_Catalog_IsActive_DisplayOrder]
    ON [dbo].[System_MasterDataItems] ([CatalogId], [IsActive], [DisplayOrder])
    INCLUDE ([Code], [Name], [Value], [ParentItemId], [UpdatedAtUtc]);
    PRINT 'Đã tạo index IX_System_MasterDataItems_Catalog_IsActive_DisplayOrder.';
END
GO

-- 5. Bổ sung Index hỗ trợ tìm kiếm phân cấp theo ParentItemId
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE [name] = 'IX_System_MasterDataItems_ParentItemId' 
      AND [object_id] = OBJECT_ID('dbo.System_MasterDataItems')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_System_MasterDataItems_ParentItemId]
    ON [dbo].[System_MasterDataItems] ([ParentItemId])
    WHERE [ParentItemId] IS NOT NULL;
    PRINT 'Đã tạo filtered index IX_System_MasterDataItems_ParentItemId.';
END
GO

-- =========================================================================
-- STORED PROCEDURES
-- =========================================================================

-- 1. SP: sp_System_MasterData_Item_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_System_MasterData_Item_GetPagedList]
    @CatalogId UNIQUEIDENTIFIER,
    @SearchTerm NVARCHAR(100) = NULL,
    @IsActive BIT = NULL,
    @ParentItemId UNIQUEIDENTIFIER = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SortBy NVARCHAR(50) = 'DisplayOrder',
    @SortOrder NVARCHAR(4) = 'ASC',
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Chuẩn hóa tham số phân trang
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    -- Whitelist Sort
    DECLARE @SafeSortBy NVARCHAR(50);
    SET @SafeSortBy = CASE LOWER(@SortBy)
        WHEN 'displayorder' THEN 'DisplayOrder'
        WHEN 'code' THEN 'Code'
        WHEN 'name' THEN 'Name'
        WHEN 'createdatutc' THEN 'CreatedAtUtc'
        ELSE 'DisplayOrder'
    END;

    DECLARE @SafeSortOrder NVARCHAR(4);
    SET @SafeSortOrder = CASE UPPER(@SortOrder)
        WHEN 'DESC' THEN 'DESC'
        ELSE 'ASC'
    END;

    -- Tính tổng số bản ghi
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[System_MasterDataItems] i WITH (NOLOCK)
    WHERE i.[CatalogId] = @CatalogId
      AND (@SearchTerm IS NULL OR i.[Code] LIKE '%' + @SearchTerm + '%' OR i.[Name] LIKE '%' + @SearchTerm + '%')
      AND (@IsActive IS NULL OR i.[IsActive] = @IsActive)
      AND (@ParentItemId IS NULL OR i.[ParentItemId] = @ParentItemId);

    -- Lấy dữ liệu phân trang
    SELECT 
        i.[Id],
        i.[CatalogId],
        i.[Code],
        i.[Name],
        i.[Value],
        i.[DisplayOrder],
        i.[IsActive],
        i.[ParentItemId],
        p.[Code] AS [ParentItemCode],
        p.[Name] AS [ParentItemName],
        i.[MetadataJson],
        i.[CreatedAtUtc],
        i.[UpdatedAtUtc],
        i.[RowVersion]
    FROM [dbo].[System_MasterDataItems] i WITH (NOLOCK)
    LEFT JOIN [dbo].[System_MasterDataItems] p WITH (NOLOCK) ON i.[ParentItemId] = p.[Id]
    WHERE i.[CatalogId] = @CatalogId
      AND (@SearchTerm IS NULL OR i.[Code] LIKE '%' + @SearchTerm + '%' OR i.[Name] LIKE '%' + @SearchTerm + '%')
      AND (@IsActive IS NULL OR i.[IsActive] = @IsActive)
      AND (@ParentItemId IS NULL OR i.[ParentItemId] = @ParentItemId)
    ORDER BY
        CASE WHEN @SafeSortBy = 'DisplayOrder' AND @SafeSortOrder = 'ASC' THEN i.[DisplayOrder] END ASC,
        CASE WHEN @SafeSortBy = 'DisplayOrder' AND @SafeSortOrder = 'DESC' THEN i.[DisplayOrder] END DESC,
        CASE WHEN @SafeSortBy = 'Code' AND @SafeSortOrder = 'ASC' THEN i.[Code] END ASC,
        CASE WHEN @SafeSortBy = 'Code' AND @SafeSortOrder = 'DESC' THEN i.[Code] END DESC,
        CASE WHEN @SafeSortBy = 'Name' AND @SafeSortOrder = 'ASC' THEN i.[Name] END ASC,
        CASE WHEN @SafeSortBy = 'Name' AND @SafeSortOrder = 'DESC' THEN i.[Name] END DESC,
        CASE WHEN @SafeSortBy = 'CreatedAtUtc' AND @SafeSortOrder = 'ASC' THEN i.[CreatedAtUtc] END ASC,
        CASE WHEN @SafeSortBy = 'CreatedAtUtc' AND @SafeSortOrder = 'DESC' THEN i.[CreatedAtUtc] END DESC,
        i.[DisplayOrder] ASC,
        i.[Code] ASC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- 2. SP: sp_System_MasterData_Item_GetById
CREATE OR ALTER PROCEDURE [dbo].[sp_System_MasterData_Item_GetById]
    @ItemId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        i.[Id],
        i.[CatalogId],
        c.[Code] AS [CatalogCode],
        c.[Name] AS [CatalogName],
        c.[IsSystem] AS [CatalogIsSystem],
        c.[IsActive] AS [CatalogIsActive],
        i.[Code],
        i.[Name],
        i.[Value],
        i.[DisplayOrder],
        i.[IsActive],
        i.[ParentItemId],
        p.[Code] AS [ParentItemCode],
        p.[Name] AS [ParentItemName],
        i.[MetadataJson],
        i.[CreatedAtUtc],
        i.[UpdatedAtUtc],
        i.[RowVersion]
    FROM [dbo].[System_MasterDataItems] i WITH (NOLOCK)
    INNER JOIN [dbo].[System_MasterDataCatalogs] c WITH (NOLOCK) ON i.[CatalogId] = c.[Id]
    LEFT JOIN [dbo].[System_MasterDataItems] p WITH (NOLOCK) ON i.[ParentItemId] = p.[Id]
    WHERE i.[Id] = @ItemId;
END
GO

-- 3. SP: sp_System_MasterData_Item_GetByCatalogCode
CREATE OR ALTER PROCEDURE [dbo].[sp_System_MasterData_Item_GetByCatalogCode]
    @CatalogCode NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SET @CatalogCode = NULLIF(LTRIM(RTRIM(@CatalogCode)), '');

    SELECT 
        i.[Id],
        i.[CatalogId],
        c.[Code] AS [CatalogCode],
        i.[Code],
        i.[Name],
        i.[Value],
        i.[DisplayOrder],
        i.[ParentItemId],
        i.[MetadataJson]
    FROM [dbo].[System_MasterDataItems] i WITH (NOLOCK)
    INNER JOIN [dbo].[System_MasterDataCatalogs] c WITH (NOLOCK) ON i.[CatalogId] = c.[Id]
    WHERE c.[Code] = @CatalogCode
      AND c.[IsActive] = 1
      AND i.[IsActive] = 1
    ORDER BY i.[DisplayOrder] ASC, i.[Name] ASC;
END
GO
