using FluentAssertions;
using ShdOneErp.Infrastructure.Authentication;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void HashPassword_ShouldReturnValidSaltedFormat()
    {
        // Act
        var hash = _hasher.HashPassword("StrongP@ssw0rd!2026");

        // Assert
        hash.Should().NotBeNullOrWhiteSpace();
        var parts = hash.Split('.');
        parts.Length.Should().Be(3);
        parts[0].Should().Be("10000"); // Iterations
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue()
    {
        // Arrange
        var password = "Correct@Password123";
        var hash = _hasher.HashPassword(password);

        // Act
        var isValid = _hasher.VerifyPassword(password, hash);

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_WithWrongPassword_ShouldReturnFalse()
    {
        // Arrange
        var hash = _hasher.HashPassword("Correct@Password123");

        // Act
        var isValid = _hasher.VerifyPassword("WrongPassword!", hash);

        // Assert
        isValid.Should().BeFalse();
    }
}
