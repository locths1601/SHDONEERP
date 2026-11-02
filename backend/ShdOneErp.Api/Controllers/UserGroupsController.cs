using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Application.Modules.Identity.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/identity/user-groups")]
[Authorize]
public class UserGroupsController : ApiControllerBase
{
    private readonly IUserGroupReadService _readService;
    private readonly IUserGroupWriteService _writeService;

    public UserGroupsController(IUserGroupReadService readService, IUserGroupWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:identity.group.view")]
    public async Task<IActionResult> GetPaged([FromQuery] UserGroupFilterQuery query, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetPagedAsync(query, cancellationToken));
    }

    [HttpGet("permissions")]
    [Authorize(Policy = "Permission:identity.permission.view")]
    public async Task<IActionResult> GetAllPermissions(CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetAllPermissionsAsync(cancellationToken));
    }

    [HttpGet("users/{userId:guid}/effective-permissions")]
    [Authorize(Policy = "Permission:identity.permission.view")]
    public async Task<IActionResult> GetUserEffectivePermissions(Guid userId, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetUserEffectivePermissionsAsync(userId, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:identity.group.view")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var group = await _readService.GetByIdAsync(id, cancellationToken);
        return group is null
            ? ApiError("NOT_FOUND", "Không tìm thấy nhóm người dùng.", StatusCodes.Status404NotFound)
            : ApiOk(group);
    }

    [HttpGet("{id:guid}/members")]
    [Authorize(Policy = "Permission:identity.group.view")]
    public async Task<IActionResult> GetMembers(Guid id, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetMembersAsync(id, cancellationToken));
    }

    [HttpGet("{id:guid}/permissions")]
    [Authorize(Policy = "Permission:identity.group.view")]
    public async Task<IActionResult> GetPermissions(Guid id, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetPermissionsAsync(id, cancellationToken));
    }

    [HttpPost]
    [Authorize(Policy = "Permission:identity.group.create")]
    public async Task<IActionResult> Create([FromBody] CreateUserGroupRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/identity/user-groups/{result.Data}", new { id = result.Data }, result.Message);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:identity.group.edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserGroupRequest request, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:identity.group.delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.DeleteAsync(id, cancellationToken));
    }

    [HttpPost("{id:guid}/members")]
    [Authorize(Policy = "Permission:identity.group.assign")]
    public async Task<IActionResult> AssignMember(Guid id, [FromBody] AssignUserGroupMemberRequest request, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.AssignMemberAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}/members/{membershipId:guid}")]
    [Authorize(Policy = "Permission:identity.group.assign")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid membershipId, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.RemoveMemberAsync(id, membershipId, cancellationToken));
    }

    [HttpPut("{id:guid}/permissions")]
    [Authorize(Policy = "Permission:identity.permission.assign")]
    public async Task<IActionResult> UpdatePermissions(Guid id, [FromBody] UpdateGroupPermissionsRequest request, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.UpdatePermissionsAsync(id, request, cancellationToken));
    }
}

