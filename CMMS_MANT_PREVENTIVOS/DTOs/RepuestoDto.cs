namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class RepuestoDto
{
    public int RepuestoId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public string NombreCategoria { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = "Unidad";
    public decimal StockMinimo { get; set; }
    public decimal StockActual { get; set; }
    public decimal CostoUnitario { get; set; }
    public bool StockBajo => StockActual <= StockMinimo;
}

public class RepuestoCreateDto
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public string UnidadMedida { get; set; } = "Unidad";
    public decimal StockMinimo { get; set; }
    public decimal StockActual { get; set; }
    public decimal CostoUnitario { get; set; }
}