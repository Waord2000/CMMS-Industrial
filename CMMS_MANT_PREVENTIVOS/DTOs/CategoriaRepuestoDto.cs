namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class CategoriaRepuestoDto
{
    public int CategoriaId { get; set; }
    public string NombreCategoria { get; set; } = string.Empty;
}

public class CategoriaRepuestoCreateDto
{
    public string NombreCategoria { get; set; } = string.Empty;
}