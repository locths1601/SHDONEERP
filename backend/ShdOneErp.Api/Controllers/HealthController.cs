using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ShdOneErp.Api.Controllers;

[Route("health")]
public class HealthController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Check()
    {
        return ApiOk(new
        {
            status = "Healthy",
            service = "SHD OneERP API",
            version = "1.0.0",
            serverTimeUtc = DateTime.UtcNow
        }, "Hệ thống hoạt động bình thường.");
    }
}
