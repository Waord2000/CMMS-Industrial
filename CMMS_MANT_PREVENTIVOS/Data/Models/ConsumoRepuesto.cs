using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class ConsumoRepuesto
{
    public int ConsumoId { get; set; }

    public int OrdenId { get; set; }

    public int RepuestoId { get; set; }

    public decimal Cantidad { get; set; }

    public DateTime FechaConsumo { get; set; }

    public virtual OrdenesTrabajo Orden { get; set; } = null!;

    public virtual Repuesto Repuesto { get; set; } = null!;
}
