namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class LoginDto
{
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreRol { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class OlvideContrasenaDto
{
    public string CorreoElectronico { get; set; } = string.Empty;
}

public class RestablecerContrasenaDto
{
    public string Token { get; set; } = string.Empty;
    public string NuevaContrasena { get; set; } = string.Empty;
}