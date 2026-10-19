using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class Maquina
{
    public int MaquinaId { get; set; }

    public string Nombre { get; set; } = null!;

    public int AreaId { get; set; }

    public string? Marca { get; set; }

    public string Estado { get; set; } = null!;

    public DateTime FechaCreacion { get; set; }

    public virtual Area Area { get; set; } = null!;

    public virtual ICollection<OrdenesTrabajo> OrdenesTrabajos { get; set; } = new List<OrdenesTrabajo>();

    public virtual ICollection<ParosMaquina> ParosMaquinas { get; set; } = new List<ParosMaquina>();

    public virtual ICollection<PlanesMantenimiento> PlanesMantenimientos { get; set; } = new List<PlanesMantenimiento>();

    public virtual ICollection<Repuesto> Repuestos { get; set; } = new List<Repuesto>();
}
