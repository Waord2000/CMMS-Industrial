namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class AreaDto
{
    public int AreaId { get; set; }
    public string NombreArea { get; set; } = string.Empty;
}

public class AreaCreateDto
{
    public string NombreArea { get; set; } = string.Empty;
}