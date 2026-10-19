namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class OrdenTrabajoDto
{
    public int OrdenId { get; set; }
    public int MaquinaId { get; set; }
    public string NombreMaquina { get; set; } = string.Empty;
    public int? PlanId { get; set; }
    public string? NombrePlan { get; set; }
    public int TipoMantenimientoId { get; set; }
    public string NombreTipoMantenimiento { get; set; } = string.Empty;
    public int? UsuarioAsignadoId { get; set; }
    public string? NombreUsuarioAsignado { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateOnly? FechaProgramada { get; set; }
    public TimeOnly? HoraInicio { get; set; }
    public TimeOnly? HoraFin { get; set; }
    public int? DuracionMinutos { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Observaciones { get; set; }
}

public class OrdenTrabajoCreateDto
{
    public int MaquinaId { get; set; }
    public int? PlanId { get; set; }
    public int TipoMantenimientoId { get; set; }
    public int? UsuarioAsignadoId { get; set; }
    public DateOnly? FechaProgramada { get; set; }
    public string? Descripcion { get; set; }
    public string? Observaciones { get; set; }
}

public class OrdenTrabajoObservacionesDto
{
    public string? Observaciones { get; set; }
}

public class RegistrarMantenimientoDto
{
    public int MaquinaId { get; set; }
    public int? PlanId { get; set; }
    public int TipoMantenimientoId { get; set; }
    public DateOnly? FechaProgramada { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public bool RegistrarParo { get; set; } = true;
}