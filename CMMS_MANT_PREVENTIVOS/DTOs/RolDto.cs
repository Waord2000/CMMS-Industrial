namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class RolDto
{
    public int RolId { get; set; }
    public string NombreRol { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

public class RolCreateDto
{
    public string NombreRol { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}