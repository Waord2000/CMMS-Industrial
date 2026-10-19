using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class Repuesto
{
    public int RepuestoId { get; set; }

    public string Codigo { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public int CategoriaId { get; set; }

    public string UnidadMedida { get; set; } = "Unidad";

    public decimal StockMinimo { get; set; }

    public decimal StockActual { get; set; }

    public decimal CostoUnitario { get; set; }

    public virtual CategoriasRepuesto Categoria { get; set; } = null!;

    public virtual ICollection<ConsumoRepuesto> ConsumoRepuestos { get; set; } = new List<ConsumoRepuesto>();

    public virtual ICollection<MovimientosInventario> MovimientosInventarios { get; set; } = new List<MovimientosInventario>();

    public virtual ICollection<Maquina> Maquinas { get; set; } = new List<Maquina>();
}