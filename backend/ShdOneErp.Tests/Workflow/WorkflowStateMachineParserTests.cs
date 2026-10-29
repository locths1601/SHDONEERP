using FluentAssertions;
using ShdOneErp.Application.Modules.Workflow.Exceptions;
using ShdOneErp.Application.Modules.Workflow.Services;
using ShdOneErp.Domain.Enums;
using Xunit;

namespace ShdOneErp.Tests.Workflow;

public class WorkflowStateMachineParserTests
{
    private const string ValidSchemaJson = @"{
        ""version"": 1,
        ""initialState"": ""Draft"",
        ""states"": [
            { ""code"": ""Draft"", ""name"": ""Bản nháp"", ""stateType"": 1 },
            { ""code"": ""Review"", ""name"": ""Thẩm định"", ""stateType"": 2 },
            { ""code"": ""Approved"", ""name"": ""Đã duyệt"", ""stateType"": 3 },
            { ""code"": ""Rejected"", ""name"": ""Từ chối"", ""stateType"": 4 }
        ],
        ""transitions"": [
            { ""id"": ""t1"", ""fromState"": ""Draft"", ""toState"": ""Review"", ""action"": ""Submit"" },
            { ""id"": ""t2"", ""fromState"": ""Review"", ""toState"": ""Approved"", ""action"": ""Approve"", ""requiredPermission"": ""wf.sample.approve"" },
            { ""id"": ""t3"", ""fromState"": ""Review"", ""toState"": ""Rejected"", ""action"": ""Reject"", ""requiresComment"": true }
        ]
    }";

    [Fact]
    public void ParseAndValidate_WithValidSchema_ReturnsValidWorkflowSchema()
    {
        var schema = WorkflowStateMachineParser.ParseAndValidate(ValidSchemaJson);

        schema.Should().NotBeNull();
        schema.Version.Should().Be(1);
        schema.InitialState.Should().Be("Draft");
        schema.States.Should().HaveCount(4);
        schema.Transitions.Should().HaveCount(3);

        var transition = schema.FindTransition("Review", "Approve");
        transition.Should().NotBeNull();
        transition!.ToState.Should().Be("Approved");
        transition.RequiredPermission.Should().Be("wf.sample.approve");
    }

    [Fact]
    public void ParseAndValidate_WhenMissingInitialState_ThrowsException()
    {
        var invalidJson = @"{
            ""version"": 1,
            ""initialState"": """",
            ""states"": [{ ""code"": ""Draft"", ""name"": ""Bản nháp"", ""stateType"": 3 }],
            ""transitions"": [{ ""id"": ""t1"", ""fromState"": ""Draft"", ""toState"": ""Draft"", ""action"": ""Submit"" }]
        }";

        var act = () => WorkflowStateMachineParser.ParseAndValidate(invalidJson);

        act.Should().Throw<WorkflowException>()
            .WithMessage("*khởi tạo*");
    }

    [Fact]
    public void ParseAndValidate_WhenTransitionTargetInvalid_ThrowsException()
    {
        var invalidJson = @"{
            ""version"": 1,
            ""initialState"": ""Draft"",
            ""states"": [
                { ""code"": ""Draft"", ""name"": ""Bản nháp"", ""stateType"": 1 },
                { ""code"": ""Approved"", ""name"": ""Đã duyệt"", ""stateType"": 3 }
            ],
            ""transitions"": [
                { ""id"": ""t1"", ""fromState"": ""Draft"", ""toState"": ""NON_EXISTING"", ""action"": ""Submit"" }
            ]
        }";

        var act = () => WorkflowStateMachineParser.ParseAndValidate(invalidJson);

        act.Should().Throw<WorkflowException>()
            .WithMessage("*NON_EXISTING*");
    }

    [Fact]
    public void ParseAndValidate_WhenNoTerminalState_ThrowsException()
    {
        var invalidJson = @"{
            ""version"": 1,
            ""initialState"": ""Draft"",
            ""states"": [
                { ""code"": ""Draft"", ""name"": ""Bản nháp"", ""stateType"": 1 },
                { ""code"": ""Step1"", ""name"": ""Bước 1"", ""stateType"": 2 }
            ],
            ""transitions"": [
                { ""id"": ""t1"", ""fromState"": ""Draft"", ""toState"": ""Step1"", ""action"": ""Next"" }
            ]
        }";

        var act = () => WorkflowStateMachineParser.ParseAndValidate(invalidJson);

        act.Should().Throw<WorkflowException>()
            .WithMessage("*kết thúc*");
    }
}

