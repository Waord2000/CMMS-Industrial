using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class VwMtbf
{
    public int MaquinaId { get; set; }

    public string Nombre { get; set; } = null!;

    public decimal? MtbfHoras { get; set; }
}
