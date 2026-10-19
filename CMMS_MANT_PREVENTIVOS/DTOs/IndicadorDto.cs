namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class MtbfDto
{
    public int MaquinaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal? MtbfHoras { get; set; }
}

public class MttrDto
{
    public int MaquinaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal? MttrHoras { get; set; }
    public int? TotalParos { get; set; }
}

public class ConsumoRepuestoResumenDto
{
    public int ConsumoId { get; set; }
    public int OrdenId { get; set; }
    public int RepuestoId { get; set; }
    public string NombreRepuesto { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal? CostoTotal { get; set; }
    public DateTime FechaConsumo { get; set; }
}