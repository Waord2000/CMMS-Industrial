using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class MovimientosInventario
{
    public int MovimientoId { get; set; }

    public int RepuestoId { get; set; }

    public string TipoMovimiento { get; set; } = null!;

    public decimal Cantidad { get; set; }

    public DateTime Fecha { get; set; }

    public int? OrdenId { get; set; }

    public string? Observaciones { get; set; }

    public virtual OrdenesTrabajo? Orden { get; set; }

    public virtual Repuesto Repuesto { get; set; } = null!;
}
