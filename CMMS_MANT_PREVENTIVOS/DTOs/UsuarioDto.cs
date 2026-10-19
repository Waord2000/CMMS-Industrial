namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class UsuarioDto
{
    public int UsuarioId { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string CorreoElectronico { get; set; } = string.Empty;
    public int RolId { get; set; }
    public string NombreRol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class UsuarioCreateDto
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty; // texto plano solo al recibirla, nunca se guarda así
    public int RolId { get; set; }
    public bool Activo { get; set; } = true;
}