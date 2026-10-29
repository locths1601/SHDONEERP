using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Workflow.DTOs;
using ShdOneErp.Application.Modules.Workflow.Exceptions;
using ShdOneErp.Application.Modules.Workflow.Interfaces;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Workflow.Services;

public class WorkflowExecutionService : IWorkflowExecutionService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public WorkflowExecutionService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
    }

    public async Task<Result<Guid>> StartAsync(StartWorkflowRequest request, CancellationToken cancellationToken = default)
    {
        var requesterUserId = _currentUser.UserId ?? Guid.Empty;
        if (requesterUserId == Guid.Empty)
            return Result<Guid>.Fail("UNAUTHORIZED", "Không xác định được danh tính người dùng gửi yêu cầu.");

        // 1. Tìm bản ghi Definition active mới nhất theo mã
        var definition = await _context.WorkflowDefinitions
            .Where(d => d.Code == request.WorkflowCode.Trim().ToUpperInvariant() && d.IsActive)
            .OrderByDescending(d => d.Version)
            .FirstOrDefaultAsync(cancellationToken);

        if (definition == null)
            return Result<Guid>.Fail("WORKFLOW_DEFINITION_NOT_FOUND", $"Không tìm thấy định nghĩa quy trình '{request.WorkflowCode}'.");

        // 2. Parse State Machine Schema
        var schema = WorkflowStateMachineParser.ParseAndValidate(definition.DefinitionJson);

        // 3. Kiểm tra xem thực thể đã có quy trình Pending chưa
        var existingPending = await _context.WorkflowInstances
            .AnyAsync(i => i.DefinitionId == definition.Id &&
                           i.EntityId == request.EntityId &&
                           i.Status == WorkflowStatus.Pending, cancellationToken);

        if (existingPending)
            return Result<Guid>.Fail("WORKFLOW_ALREADY_IN_PROGRESS", $"Thực thể '{request.EntityId}' đã có một quy trình đang chờ xử lý.");

        // 4. Khởi tạo instance với phạm vi LegalEntity và BusinessUnit
        var instance = new WorkflowInstance(
            definitionId: definition.Id,
            definitionVersion: definition.Version,
            legalEntityId: request.LegalEntityId,
            entityType: request.EntityType,
            entityId: request.EntityId,
            initialState: schema.InitialState,
            requesterUserId: requesterUserId,
            payloadJson: request.PayloadJson,
            assignedUserGroupId: request.AssignedUserGroupId,
            assignedUserId: request.AssignedUserId,
            workflowCode: definition.Code,
            businessUnitId: request.BusinessUnitId);

        // 5. Thêm bản ghi lịch sử đầu tiên (Submit)
        var initialHistory = new WorkflowHistory(
            instanceId: instance.Id,
            action: "Submit",
            fromState: string.Empty,
            toState: schema.InitialState,
            actorUserId: requesterUserId,
            comments: "Khởi tạo và gửi quy trình phê duyệt",
            payloadJson: request.PayloadJson);

        _context.WorkflowInstances.Add(instance);
        _context.WorkflowHistories.Add(initialHistory);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(instance.Id, "Khởi tạo quy trình công việc thành công.");
    }

    public async Task<Result> ExecuteActionAsync(Guid instanceId, ExecuteWorkflowActionRequest request, CancellationToken cancellationToken = default)
    {
        var actorUserId = _currentUser.UserId ?? Guid.Empty;
        if (actorUserId == Guid.Empty)
            return Result.Fail("UNAUTHORIZED", "Không xác định được danh tính người xử lý.");

        // 1. Tải instance kèm definition
        var instance = await _context.WorkflowInstances
            .Include(i => i.Definition)
            .FirstOrDefaultAsync(i => i.Id == instanceId, cancellationToken);

        if (instance == null || instance.Definition == null)
            return Result.Fail("WORKFLOW_INSTANCE_NOT_FOUND", "Không tìm thấy phiên bản quy trình công việc.");

        // 2. Kiểm tra Concurrency
        if (!string.IsNullOrEmpty(request.RowVersionBase64))
        {
            var expectedBytes = Convert.FromBase64String(request.RowVersionBase64);
            if (!instance.RowVersion.SequenceEqual(expectedBytes))
                return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu quy trình đã bị cập nhật bởi người khác. Vui lòng tải lại trang.");
        }

        // 3. Kiểm tra trạng thái quy trình
        if (instance.Status != WorkflowStatus.Pending)
            return Result.Fail("WORKFLOW_TERMINATED", "Quy trình đã hoàn tất hoặc bị hủy bỏ, không thể thực hiện thêm thao tác.");

        // 4. Parse Schema
        var schema = WorkflowStateMachineParser.ParseAndValidate(instance.Definition.DefinitionJson);

        // 5. Tìm transition hợp lệ
        var transition = schema.FindTransition(instance.CurrentState, request.Action);
        if (transition == null)
            return Result.Fail("INVALID_TRANSITION", $"Hành động '{request.Action}' không hợp lệ từ trạng thái hiện tại '{instance.CurrentState}'.");

        // 6. Kiểm tra quyền hạn của người xử lý (Xác thực với Direct GBAC kèm LegalEntity và BusinessUnit scope)
        if (!string.IsNullOrEmpty(transition.RequiredPermission) && !_currentUser.IsAdmin)
        {
            var hasPerm = await _permissionResolver.HasPermissionAsync(
                userId: actorUserId,
                permissionCode: transition.RequiredPermission,
                legalEntityId: instance.LegalEntityId,
                businessUnitId: instance.BusinessUnitId,
                cancellationToken: cancellationToken);

            if (!hasPerm)
                return Result.Fail("UNAUTHORIZED_TRANSITION", $"Bạn không có quyền '{transition.RequiredPermission}' để thực hiện hành động này.");
        }

        // 7. Kiểm tra yêu cầu ý kiến / comment
        if (transition.RequiresComment && string.IsNullOrWhiteSpace(request.Comments))
            return Result.Fail("COMMENT_REQUIRED", "Hành động này bắt buộc phải nhập ý kiến hoặc lý do xử lý.");

        var fromState = instance.CurrentState;
        var toState = transition.ToState;

        // 8. Thực hiện chuyển trạng thái (Entity Domain Logic)
        instance.TransitionTo(
            newState: toState,
            status: transition.TargetStatus,
            actorUserId: actorUserId,
            action: request.Action,
            nextAssignedUserGroupId: request.NextAssignedUserGroupId,
            nextAssignedUserId: request.NextAssignedUserId,
            comments: request.Comments,
            updatedPayloadJson: request.UpdatedPayloadJson,
            workflowCode: instance.Definition.Code);

        // 9. Ghi nhận lịch sử bất biến (Immutable History)
        var history = new WorkflowHistory(
            instanceId: instance.Id,
            action: request.Action,
            fromState: fromState,
            toState: toState,
            actorUserId: actorUserId,
            comments: request.Comments,
            payloadJson: request.UpdatedPayloadJson);

        _context.WorkflowHistories.Add(history);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Xung đột đồng thời: Quy trình đã được xử lý bởi một phiên khác.");
        }

        return Result.Ok($"Thực hiện hành động '{request.Action}' thành công. Trạng thái hiện tại: {toState}.");
    }

    public async Task<Result> CancelAsync(Guid instanceId, CancelWorkflowRequest request, CancellationToken cancellationToken = default)
    {
        var actorUserId = _currentUser.UserId ?? Guid.Empty;
        if (actorUserId == Guid.Empty)
            return Result.Fail("UNAUTHORIZED", "Không xác định được danh tính người xử lý.");

        var instance = await _context.WorkflowInstances
            .Include(i => i.Definition)
            .FirstOrDefaultAsync(i => i.Id == instanceId, cancellationToken);

        if (instance == null || instance.Definition == null)
            return Result.Fail("WORKFLOW_INSTANCE_NOT_FOUND", "Không tìm thấy quy trình công việc.");

        if (instance.Status != WorkflowStatus.Pending)
            return Result.Fail("WORKFLOW_TERMINATED", "Quy trình không ở trạng thái có thể hủy.");

        // Kiểm tra quyền hủy: người tạo hoặc Admin
        if (instance.RequesterUserId != actorUserId && !_currentUser.IsAdmin)
            return Result.Fail("FORBIDDEN_CANCEL", "Chỉ người khởi tạo hoặc Quản trị viên mới có quyền hủy bỏ quy trình.");

        var fromState = instance.CurrentState;
        instance.Cancel(actorUserId, request.Reason, instance.Definition.Code);

        var history = new WorkflowHistory(
            instanceId: instance.Id,
            action: "Cancel",
            fromState: fromState,
            toState: "Cancelled",
            actorUserId: actorUserId,
            comments: request.Reason);

        _context.WorkflowHistories.Add(history);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Xung đột đồng thời khi hủy quy trình.");
        }

        return Result.Ok("Đã hủy bỏ quy trình công việc thành công.");
    }

    public async Task<IReadOnlyList<AvailableTransitionDto>> GetAvailableTransitionsAsync(Guid instanceId, CancellationToken cancellationToken = default)
    {
        var actorUserId = _currentUser.UserId ?? Guid.Empty;

        var instance = await _context.WorkflowInstances
            .Include(i => i.Definition)
            .FirstOrDefaultAsync(i => i.Id == instanceId, cancellationToken);

        if (instance == null || instance.Definition == null || instance.Status != WorkflowStatus.Pending)
            return Array.Empty<AvailableTransitionDto>();

        var schema = WorkflowStateMachineParser.ParseAndValidate(instance.Definition.DefinitionJson);
        var transitions = schema.GetAvailableTransitions(instance.CurrentState);

        var result = new List<AvailableTransitionDto>();
        foreach (var t in transitions)
        {
            // Kiểm tra quyền của actor có xét phạm vi LegalEntity và BusinessUnit
            if (!string.IsNullOrEmpty(t.RequiredPermission) && !_currentUser.IsAdmin)
            {
                var hasPerm = await _permissionResolver.HasPermissionAsync(
                    userId: actorUserId,
                    permissionCode: t.RequiredPermission,
                    legalEntityId: instance.LegalEntityId,
                    businessUnitId: instance.BusinessUnitId,
                    cancellationToken: cancellationToken);

                if (!hasPerm)
                    continue; // Bỏ qua transition nếu user không có quyền
            }

            var toState = schema.GetState(t.ToState);
            result.Add(new AvailableTransitionDto
            {
                Action = t.Action,
                ToState = t.ToState,
                ToStateName = toState?.Name ?? t.ToState,
                RequiresComment = t.RequiresComment,
                RequiredPermission = t.RequiredPermission
            });
        }

        return result;
    }
}
