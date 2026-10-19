namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class MovimientoInventarioDto
{
    public int MovimientoId { get; set; }
    public int RepuestoId { get; set; }
    public string NombreRepuesto { get; set; } = string.Empty;
    public string TipoMovimiento { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public DateTime Fecha { get; set; }
    public int? OrdenId { get; set; }
    public string? Observaciones { get; set; }
}

public class EntradaInventarioCreateDto
{
    public int RepuestoId { get; set; }
    public decimal Cantidad { get; set; }
    public string? Observaciones { get; set; }
}