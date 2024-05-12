[Route("api/[controller]")]
public class AccountController : ControllerBase
{
     [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        // 典型返回值
        return Ok(new { message = "用户注册成功" });
    }

    public class LoginModel
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        // 典型返回值
        return Ok(new { Token = "jwt-token-string-here" });
    }

    public class ChangeRoleRequest
    {
        public string? UserId { get; set; }
        public string? NewRole { get; set; }
        public string? OldRole { get; set; }
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [Authorize(Roles = "管理员账户")]
    [HttpPost("change-role")]
    public async Task<IActionResult> ChangeUserRole([FromBody] ChangeRoleRequest model)
    {
        // 典型返回值
        return Ok("用户角色已更改为 管理员账户");
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [Authorize(Roles = "管理员账户,开发者账户")]
    [HttpPost("create-secret")]
    public async Task<IActionResult> CreateSecret()
    {
        // 典型返回值
        return Ok(new { ClientId = "some-random-guid", ClientSecret = "some-random-secret", Scope = "TestReadData" });
    }
}

上面是我ASP.NET Core写的后端Api的示例,我需要根据上述api,为我的vue项目添加用户登录,登录后的首页(该首页带有一个侧边栏),未来会向侧边栏添加"Cred管理"项目.
我的后端api的host是
https://amiya-bot-service.hsyhhssyy.net
并且日后可能修改.

接下来我将据此提出一系列问题.

现在请引导我实现用户登录的具体页面


import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue'; // 引入刚刚创建的 Login 组件

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login, // 使用 Login 组件
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

这是我当前的router
我设置了/重定向到login
假如我有一个后端API:Get /api/SKLandCredential/list 可以用来判断token是否有效.
请问我能否调整为,在用户访问/时,如果有有效的token则去主页,如果token失效了则返回登录页?

该主页使用Element Plus，左侧带有一个侧边栏，点击侧边栏时，右侧部分会相应的跳转.
我该使用什么样的文件结构来组织代码最合适?
请给出修改后的主页.


很好，home差不多就这样了，现在开始开发子功能。下面这个内容是我Asp.netCore后端的代码
namespace AmiyaBotPlayerRatingServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme,Roles = "普通账户")]
    public class SKLandCredentialController : ControllerBase
    {
        [HttpPost("Create")]
        public async Task<IActionResult> CreateCredential([FromBody] SKLandCredentialModel model)
        {
            // 示例返回值: { "Id": "123456", "Message": "Credential successfully created." }
            return Ok(new { Id = "123456", Message = "Credential successfully created." });
        }

        [HttpPut("Update/{credentialId}")]
        [Authorize(Policy = CredentialOwnerPolicy.Name)]
        public async Task<IActionResult> UpdateCredential(string credentialId, [FromBody] SKLandCredentialModel model)
        {
            // 示例返回值: { "Message": "Credential successfully updated." }
            return Ok(new { Message = "Credential successfully updated." });
        }

        [HttpDelete("Delete/{credentialId}")]
        [Authorize(Policy = CredentialOwnerPolicy.Name)]
        public async Task<IActionResult> DeleteCredential(string credentialId)
        {
            // 示例返回值: { "Message": "Credential successfully deleted." }
            return Ok(new { Message = "Credential successfully deleted." });
        }

        [HttpGet("List")]
        public async Task<IActionResult> GetCredentials()
        {
            // 示例返回值: [{ "Id": "123", "Credential": "sample_credential", "Nickname": "sample_nickname", "AvatarUrl": "sample_url" }]
            return Ok(new[] { new { Id = "123", Credential = "sample_credential", Nickname = "sample_nickname", AvatarUrl = "sample_url" } });
        }

        [HttpGet("Details/{credentialId}")]
        [Authorize(Policy = CredentialOwnerPolicy.Name)]
        public async Task<IActionResult> GetCredentialDetails(string credentialId)
        {
            // 示例返回值: { "Id": "123", "Credential": "sample_credential", "Nickname": "sample_nickname", "Avatar": "sample_avatar" }
            return Ok(new { Id = "123", Credential = "sample_credential", Nickname = "sample_nickname", Avatar = "sample_avatar" });
        }
    }
}

现在要根据上面的这个功能,开发一个Cred管理页面(home中的子页面之一)
这个功能是这样的,页面上有用卡片展示的一个个Cred,每个用Avatar和nickname来显示.
此外还含有一个添加按钮.添加按钮按下后会弹出一个对话框来操作,目前对话框内暂时只含有一个文本框,用于输入cred,后续会进行调整.
暂时不处理查看cred详情的功能.
请给出这个页面的代码.


请帮忙实现一个用户注册，具体如下

页面上方有一个二选一的选择： 普通账户，开发者账户
选择后，注册时需要的内容不同

对于普通账户，注册需要填写用户名 密码 重复密码
对于开发者账户，注册需要填写邮箱，密码，重复密码
http://localhost:5173/OAuth?client-id=5005de326a1f42a390a0c025aa99e4b0

我有一个OAuth服务器,用OpenIddict搭建,已经完成.
同时我已经创建好了一个OAuth的前台页面,该页面有三个参数,client-id,state,redirect
该页面提示"是否允许该应用获取您的用户信息."
同时该页面可以通过localstorage获取当前登录的用户的jwt,这是用JwtBearer在后台获取的.
当用户按下 同意 按钮的时候,我该做什么?

namespace AmiyaBotPlayerRatingServer.Controllers
{
    public class AuthorizationController : Controller
    {
        private readonly IOpenIddictApplicationManager _applicationManager;

        public AuthorizationController(IOpenIddictApplicationManager applicationManager)
            => _applicationManager = applicationManager;

        [HttpGet("~/connect/authorize")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Authorize()
        {
            var request = HttpContext.GetOpenIddictServerRequest();

            var allowToAuthorize = true;
            // 这里应验证传入的 request 参数（例如：client_id，redirect_uri 等）

            if (allowToAuthorize)
            {
                // 创建或获取用户的身份标识（ClaimsIdentity）
                var identity = new ClaimsIdentity(
                    OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                    Claims.Name, Claims.Role);

                var subjectClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value??"";
                var claim = new Claim(Claims.Subject, subjectClaim);
                claim.SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken);
                identity.AddClaim(claim);
                
                var principal = new ClaimsPrincipal(identity);
                
                return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
            else
            {
                // 用户拒绝授权，您应该重定向到一个错误页面或返回到第三方应用
                return Forbid(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
        }

        [AllowAnonymous]
        [HttpPost("~/connect/token"), Produces("application/json")]
        public async Task<IActionResult> Exchange()
        {
            var request = HttpContext.GetOpenIddictServerRequest();
            if (request.IsAuthorizationCodeGrantType())
            {
                var identity = new ClaimsIdentity(
                    TokenValidationParameters.DefaultAuthenticationType,
                    Claims.Name,
                    Claims.Role);

                // Get the principal associated with the authorization code
                var info = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
                var userPrincipal = info?.Principal;

                if (userPrincipal == null)
                {
                    // Handle error: the authorization code is invalid or has expired
                    return BadRequest();
                }

                // Extract the user ID from the principal
                var userId = userPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    // Handle error: the user ID is missing
                    return BadRequest();
                }

                // 这里添加相应的声明。
                identity.AddClaim(Claims.Subject, userId,
                    OpenIddictConstants.Destinations.AccessToken);

                var principal = new ClaimsPrincipal(identity);

                return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
            else if (request.IsClientCredentialsGrantType())
            {

                // Note: the client credentials are automatically validated by OpenIddict:
                // if client_id or client_secret are invalid, this action won't be invoked.

                var application = await _applicationManager.FindByClientIdAsync(request.ClientId) ??
                                  throw new InvalidOperationException("The application cannot be found.");

                // Create a new ClaimsIdentity containing the claims that
                // will be used to create an id_token, a token or a code.
                var identity = new ClaimsIdentity(TokenValidationParameters.DefaultAuthenticationType, Claims.Name,
                    Claims.Role);

                // Use the client_id as the subject identifier.
                identity.SetClaim(Claims.Subject, await _applicationManager.GetClientIdAsync(application));
                identity.SetClaim(Claims.Name, await _applicationManager.GetDisplayNameAsync(application));

                identity.SetDestinations(static claim => claim.Type switch
                {
                    // Allow the "name" claim to be stored in both the access and identity tokens
                    // when the "profile" scope was granted (by calling principal.SetScopes(...)).
                    Claims.Name when claim.Subject.HasScope(Scopes.Profile)
                        => new[] { Destinations.AccessToken, Destinations.IdentityToken },

                    // Otherwise, only store the claim in the access tokens.
                    _ => new[] { Destinations.AccessToken }
                });

                return SignIn(new ClaimsPrincipal(identity), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
            else
            {
                throw new NotImplementedException("The specified grant type is not implemented.");
            }
        }

        [HttpPost("~/connect/describe"), Produces("application/json")]
        [Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
        public IActionResult Describe()
        {
            var clientId = User.FindFirst("client_id")?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            
            return Ok(new { Message = "Authorized", clientId = clientId , userId = userId });
        }
    }
}

如果这是我后端的代码,我是应该在vue端直接调用哪一个接口?还是创建一个新的action来处理这个情形?


openiddict的authorize会在authorization code流程执行的时候,自动返回302进行重定向。
但是访问这个接口需要header上的Authorize来验证当前用户身份，我的前端如果通过window.location.href跳转到authorize页面，无法提供这个验证。
如果我通过axios访问这个地址，302会重定向到redirect_uri,导致我收到了redirect_uri的数据.
我该怎么正确的配置这个流程呢?

标准的OpenId OAuth规范的authorize端点会在authorization code流程执行的时候,自动返回302进行重定向。
但是如果我是使用jwt来验证用户身份的话，访问这个接口需要header上的Authorize来验证当前用户身份。
那么我的前端如果通过window.location.href跳转到authorize页面，无法提供这个验证。
如果我通过axios访问这个地址，302会重定向到redirect_uri,导致我收到了redirect_uri的数据而不是code。
我问了ChatGPT，他说你需要用cookie来验证用户身份。
但是jwt和cookie不兼容，我觉得市面上这么多OAuth，肯定不是都用的cookie。

我的后端Api使用了[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]来验证用户的身份，
通常来说jwt都是放在Header的Authorization头中
我是否可以设置一个cookie并让这个验证方式可以验证cookie中的jwt呢？