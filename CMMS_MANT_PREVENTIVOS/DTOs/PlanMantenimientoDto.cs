namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class PlanMantenimientoDto
{
    public int PlanId { get; set; }
    public int MaquinaId { get; set; }
    public string NombreMaquina { get; set; } = string.Empty;
    public string NombrePlan { get; set; } = string.Empty;
    public byte FrecuenciaMeses { get; set; }
    public DateOnly? UltimaEjecucion { get; set; }
    public DateOnly? ProximaEjecucion { get; set; }
    public bool Activo { get; set; }
}


public class PlanMantenimientoCreateDto
{
    public int MaquinaId { get; set; }
    public string NombrePlan { get; set; } = string.Empty;
    public byte FrecuenciaMeses { get; set; }
    public DateOnly? UltimaEjecucion { get; set; }
    public DateOnly? ProximaEjecucion { get; set; }
    public bool Activo { get; set; } = true;
}