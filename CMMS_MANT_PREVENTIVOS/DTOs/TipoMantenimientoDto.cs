namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class TipoMantenimientoDto
{
    public int TipoMantenimientoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

public class TipoMantenimientoCreateDto
{
    public string Nombre { get; set; } = string.Empty;
}