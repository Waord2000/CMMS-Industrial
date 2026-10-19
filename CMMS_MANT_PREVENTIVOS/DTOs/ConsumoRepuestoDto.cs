namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class ConsumoRepuestoDto
{
    public int ConsumoId { get; set; }
    public int OrdenId { get; set; }
    public int RepuestoId { get; set; }
    public string NombreRepuesto { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal CostoTotal { get; set; }
    public DateTime FechaConsumo { get; set; }
    public string UnidadMedida { get; set; } = "Unidad";
}

public class ConsumoRepuestoCreateDto
{
    public int OrdenId { get; set; }
    public int RepuestoId { get; set; }
    public decimal Cantidad { get; set; }
}