using System;
using System.Collections.Generic;

namespace CMMS_MANT_PREVENTIVOS.Data.Models;

public partial class OrdenesTrabajo
{
    public int OrdenId { get; set; }

    public int MaquinaId { get; set; }

    public int? PlanId { get; set; }

    public int TipoMantenimientoId { get; set; }

    public int? UsuarioAsignadoId { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateOnly? FechaProgramada { get; set; }

    public TimeOnly? HoraInicio { get; set; }

    public TimeOnly? HoraFin { get; set; }

    public int? DuracionMinutos { get; set; }

    public string Estado { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string? Observaciones { get; set; }

    public virtual ICollection<ConsumoRepuesto> ConsumoRepuestos { get; set; } = new List<ConsumoRepuesto>();

    public virtual Maquina Maquina { get; set; } = null!;

    public virtual ICollection<MovimientosInventario> MovimientosInventarios { get; set; } = new List<MovimientosInventario>();

    public virtual ICollection<ParosMaquina> ParosMaquinas { get; set; } = new List<ParosMaquina>();

    public virtual PlanesMantenimiento? Plan { get; set; }

    public virtual TiposMantenimiento TipoMantenimiento { get; set; } = null!;

    public virtual Usuario? UsuarioAsignado { get; set; }
}
