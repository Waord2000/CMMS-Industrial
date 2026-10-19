namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class MaquinaDto
{
    public int MaquinaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int AreaId { get; set; }
    public string NombreArea { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}

public class MaquinaCreateDto
{
    public string Nombre { get; set; } = string.Empty;
    public int AreaId { get; set; }
    public string? Marca { get; set; }
    public string Estado { get; set; } = "Operativa";
}