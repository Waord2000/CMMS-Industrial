using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CMMS_MANT_PREVENTIVOS.Data;
using CMMS_MANT_PREVENTIVOS.Data.Models;
using CMMS_MANT_PREVENTIVOS.DTOs;
using CMMS_MANT_PREVENTIVOS.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CMMS_MANT_PREVENTIVOS.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly CmmsDbContext _context;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;
    private readonly ILogger<AuthController> _logger;

    public AuthController(CmmsDbContext context, IConfiguration config, IEmailService email, ILogger<AuthController> logger)
    {
        _context = context;
        _config = config;
        _email = email;
        _logger = logger;
    }

    private static byte[] HashContrasena(string contrasena) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(contrasena));

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login(LoginDto dto)
    {
        var usuario = await _context.Usuarios.Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.CorreoElectronico == dto.CorreoElectronico);

        if (usuario is null || !usuario.Activo)
            return Unauthorized("Credenciales inválidas.");

        var hashIngresado = HashContrasena(dto.Contrasena);
        if (!hashIngresado.SequenceEqual(usuario.ContrasenaHash))
            return Unauthorized("Credenciales inválidas.");

        var jwtKey = _config["Jwt:Key"]!;
        var jwtIssuer = _config["Jwt:Issuer"]!;
        var jwtAudience = _config["Jwt:Audience"]!;
        var minutos = int.Parse(_config["Jwt:ExpiresInMinutes"] ?? "480");
        var expira = DateTime.UtcNow.AddMinutes(minutos);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.UsuarioId.ToString()),
            new(ClaimTypes.NameIdentifier, usuario.UsuarioId.ToString()),
            new(ClaimTypes.Name, usuario.NombreCompleto),
            new(ClaimTypes.Email, usuario.CorreoElectronico),
            new(ClaimTypes.Role, usuario.Rol.NombreRol)
        };

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expira,
            signingCredentials: credenciales);

        return Ok(new LoginResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UsuarioId = usuario.UsuarioId,
            NombreCompleto = usuario.NombreCompleto,
            NombreRol = usuario.Rol.NombreRol,
            ExpiresAt = expira
        });
    }

    // Siempre responde lo mismo, exista o no el correo, para que nadie pueda
    // averiguar qué correos están registrados en el sistema.
    [HttpPost("olvide-contrasena")]
    public async Task<IActionResult> OlvideContrasena(OlvideContrasenaDto dto)
    {
        const string respuesta = "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.";

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.CorreoElectronico == dto.CorreoElectronico && u.Activo);
        if (usuario is null)
            return Ok(new { mensaje = respuesta });

        // Invalida cualquier enlace anterior que no se haya usado
        var anteriores = await _context.PasswordResetTokens
            .Where(t => t.UsuarioId == usuario.UsuarioId && !t.Usado)
            .ToListAsync();
        foreach (var t in anteriores) t.Usado = true;

        var tokenPlano = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UsuarioId = usuario.UsuarioId,
            TokenHash = SHA256.HashData(Encoding.UTF8.GetBytes(tokenPlano)),
            Expira = DateTime.UtcNow.AddMinutes(30),
            Usado = false,
            FechaCreacion = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var baseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var enlace = $"{baseUrl}/restablecer-contrasena?token={tokenPlano}";

        var cuerpo = $@"
            <div style='font-family:Arial,sans-serif;max-width:480px'>
              <h2 style='color:#b97f2c'>CMMS — Restablecer contraseña</h2>
              <p>Hola {usuario.NombreCompleto},</p>
              <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para elegir una nueva. El enlace es válido por 30 minutos.</p>
              <p><a href='{enlace}' style='background:#e8a33d;color:#241a06;padding:10px 18px;text-decoration:none;border-radius:4px;font-weight:bold'>Restablecer contraseña</a></p>
              <p style='color:#666;font-size:12px'>Si no fuiste tú, ignora este mensaje: tu contraseña no cambiará.</p>
            </div>";

        try
        {
            await _email.EnviarAsync(usuario.CorreoElectronico, "Restablecer contraseña — CMMS", cuerpo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo enviar el correo de recuperación a {Correo}", usuario.CorreoElectronico);
        }

        return Ok(new { mensaje = respuesta });
    }

    [HttpPost("restablecer-contrasena")]
    public async Task<IActionResult> RestablecerContrasena(RestablecerContrasenaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NuevaContrasena) || dto.NuevaContrasena.Length < 8)
            return BadRequest("La contraseña debe tener al menos 8 caracteres.");

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(dto.Token ?? string.Empty));
        var registro = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && !t.Usado && t.Expira > DateTime.UtcNow);
        if (registro is null)
            return BadRequest("El enlace no es válido o ya expiró. Solicita uno nuevo.");

        var usuario = await _context.Usuarios.FindAsync(registro.UsuarioId);
        if (usuario is null)
            return BadRequest("El enlace no es válido o ya expiró. Solicita uno nuevo.");

        usuario.ContrasenaHash = HashContrasena(dto.NuevaContrasena);
        registro.Usado = true;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Contraseña actualizada. Ya puedes iniciar sesión." });
    }
}