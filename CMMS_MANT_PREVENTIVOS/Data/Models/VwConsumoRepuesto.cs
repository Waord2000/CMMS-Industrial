using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class VwConsumoRepuesto
{
    public int ConsumoId { get; set; }

    public int OrdenId { get; set; }

    public int RepuestoId { get; set; }

    public string NombreRepuesto { get; set; } = null!;

    public decimal Cantidad { get; set; }

    public decimal CostoUnitario { get; set; }

    public decimal? CostoTotal { get; set; }

    public DateTime FechaConsumo { get; set; }
}
