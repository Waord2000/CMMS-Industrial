using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class TareasPlan
{
    public int TareaId { get; set; }

    public int PlanId { get; set; }

    public string Descripcion { get; set; } = null!;

    public int? TiempoEstimadoMin { get; set; }

    public virtual PlanesMantenimiento Plan { get; set; } = null!;
}
