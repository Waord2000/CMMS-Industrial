namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class TareaPlanDto
{
    public int TareaId { get; set; }
    public int PlanId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public int? TiempoEstimadoMin { get; set; }
}

public class TareaPlanCreateDto
{
    public string Descripcion { get; set; } = string.Empty;
    public int? TiempoEstimadoMin { get; set; }
}