using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class PlanesMantenimiento
{
    public int PlanId { get; set; }

    public int MaquinaId { get; set; }

    public string NombrePlan { get; set; } = null!;

    public byte FrecuenciaMeses { get; set; }

    public DateOnly? UltimaEjecucion { get; set; }

    public DateOnly? ProximaEjecucion { get; set; }

    public bool Activo { get; set; }

    public virtual Maquina Maquina { get; set; } = null!;

    public virtual ICollection<OrdenesTrabajo> OrdenesTrabajos { get; set; } = new List<OrdenesTrabajo>();

    public virtual ICollection<TareasPlan> TareasPlans { get; set; } = new List<TareasPlan>();
}
