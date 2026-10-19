using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class Area
{
    public int AreaId { get; set; }

    public string NombreArea { get; set; } = null!;

    public virtual ICollection<Maquina> Maquinas { get; set; } = new List<Maquina>();
}
