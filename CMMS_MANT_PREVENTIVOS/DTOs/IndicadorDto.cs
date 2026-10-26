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

public class ConsumoDetalleDto
{
    public int ConsumoId { get; set; }
    public DateTime Fecha { get; set; }
    public int OrdenId { get; set; }
    public string Repuesto { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = "Unidad";
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal CostoTotal { get; set; }
    public string Maquina { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string TipoMantenimiento { get; set; } = string.Empty;
}

public class TendenciaMesDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }
    public int TotalParos { get; set; }
    public decimal? MttrHoras { get; set; }
    public decimal? MtbfHoras { get; set; }
    public decimal InversionPreventivo { get; set; }
    public decimal ConsumoTotal { get; set; }
}