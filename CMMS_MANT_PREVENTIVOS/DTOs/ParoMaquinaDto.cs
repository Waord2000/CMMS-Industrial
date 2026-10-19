namespace CMMS_MANT_PREVENTIVOS.DTOs;

public class ParoMaquinaDto
{
    public int ParoId { get; set; }
    public int MaquinaId { get; set; }
    public string NombreMaquina { get; set; } = string.Empty;
    public int? OrdenId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public int? DuracionMinutos { get; set; }
    public string? Causa { get; set; }
    public bool ParoActivo => FechaFin is null;
}

public class ParoMaquinaCreateDto
{
    public int MaquinaId { get; set; }
    public int? OrdenId { get; set; }
    public DateTime? FechaInicio { get; set; }
    public string? Causa { get; set; }
}

public class ParoMaquinaCerrarDto
{
    public DateTime? FechaFin { get; set; }
    public string? Causa { get; set; }
}
