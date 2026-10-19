using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class ParosMaquina
{
    public int ParoId { get; set; }

    public int MaquinaId { get; set; }

    public int? OrdenId { get; set; }

    public DateTime FechaInicio { get; set; }

    public DateTime? FechaFin { get; set; }

    public int? DuracionMinutos { get; set; }

    public string? Causa { get; set; }

    public virtual Maquina Maquina { get; set; } = null!;

    public virtual OrdenesTrabajo? Orden { get; set; }
}
